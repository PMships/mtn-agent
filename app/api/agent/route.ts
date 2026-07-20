import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { ethers } from 'ethers';

const client = new Anthropic();

const tools: Anthropic.Tool[] = [
  {
    name: 'search_merchants',
    description: 'Search available merchants by query or category. Returns merchant options with prices.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: "What you're looking for" },
        category: { type: 'string', enum: ['travel', 'food', 'accommodation', 'retail'] },
      },
      required: ['query'],
    },
  },
  {
    name: 'check_policy',
    description: 'Check whether a proposed transaction is within the user agent policy.',
    input_schema: {
      type: 'object',
      properties: {
        merchant_id: { type: 'string' },
        amount: { type: 'number' },
        category: { type: 'string' },
      },
      required: ['merchant_id', 'amount', 'category'],
    },
  },
  {
    name: 'initiate_payment',
    description: 'Attempt to execute a payment. Checks policy first.',
    input_schema: {
      type: 'object',
      properties: {
        merchant_id: { type: 'string' },
        amount: { type: 'number' },
        description: { type: 'string' },
      },
      required: ['merchant_id', 'amount', 'description'],
    },
  },
  {
    name: 'get_spending_summary',
    description: 'Get current spending vs limits.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'escalate_for_approval',
    description: 'Escalate a transaction that exceeds policy thresholds.',
    input_schema: {
      type: 'object',
      properties: {
        merchant_id: { type: 'string' },
        merchant_name: { type: 'string' },
        amount: { type: 'number' },
        reason: { type: 'string' },
      },
      required: ['merchant_id', 'merchant_name', 'amount', 'reason'],
    },
  },
];

import { MERCHANTS } from '@/data/merchants';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function getPolicy() {
  const { data } = await supabase.from('agent_policies').select('*').eq('active', true).single();
  return data;
}

async function getTodaySpend() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('agent_audit_log')
    .select('amount')
    .eq('decision', 'APPROVED')
    .gte('created_at', `${today}T00:00:00`);
  return (data || []).reduce((sum, r) => sum + (r.amount || 0), 0);
}

async function logActionOnChain(
  merchantId: string,
  merchantName: string,
  amount: number,
  category: string,
  decision: string,
  reason: string
): Promise<string | null> {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);
    const abi = [
      "function logAction(string merchantId, string merchantName, uint256 amount, string category, string decision, string reason) external"
    ];
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS!, abi, wallet);
    const tx = await contract.logAction(
      merchantId,
      merchantName,
      BigInt(Math.round(amount * 100)),
      category,
      decision,
      reason
    );
    await tx.wait();
    return tx.hash;
  } catch (err) {
    console.error("On-chain logging failed:", err);
    return null;
  }
}

async function logAction(entry: Record<string, unknown>) {
  let tx_hash: string | null = null;
  const merchantId = entry.merchant_id as string | undefined;
  const merchantName = entry.merchant_name as string | undefined;
  const amount = entry.amount as number | undefined;
  const category = entry.category as string | undefined;
  const decision = entry.decision as string;
  const reason = entry.reason as string | undefined;

  if (merchantId && amount && category) {
    tx_hash = await logActionOnChain(
      merchantId,
      merchantName || "",
      amount,
      category,
      decision,
      reason || ""
    );
  }
  await supabase.from('agent_audit_log').insert({ ...entry, tx_hash });
}

async function handleToolCall(toolName: string, toolInput: Record<string, unknown>) {
  if (toolName === 'search_merchants') {
    const { query, category } = toolInput as { query: string; category?: string };
    let results = MERCHANTS;
    if (category) results = results.filter(m => m.category === category);
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        q.includes(m.category.toLowerCase())
      );
    }
    // If still empty and query mentions travel keywords, return all travel merchants
    if (results.length === 0) {
      const travelKeywords = [
        'flight', 'fly', 'airline', 'airport', 'travel',
        'london', 'paris', 'berlin', 'amsterdam', 'madrid', 'rome', 'barcelona',
        'new york', 'dubai', 'lisbon', 'edinburgh', 'manchester', 'glasgow',
        'brussels', 'milan', 'vienna', 'prague', 'copenhagen', 'stockholm'
      ];
      if (travelKeywords.some(k => query.toLowerCase().includes(k))) {
        results = MERCHANTS.filter(m => m.category === 'travel');
      }
    }
    return JSON.stringify(results);
  }

  if (toolName === 'get_spending_summary') {
    const policy = await getPolicy();
    const todaySpend = await getTodaySpend();
    return JSON.stringify({
      daily_limit: policy?.daily_limit,
      spent_today: todaySpend,
      remaining_today: (policy?.daily_limit || 0) - todaySpend,
      single_transaction_limit: policy?.single_transaction_limit,
      require_approval_above: policy?.require_approval_above,
      allowed_categories: policy?.allowed_categories,
    });
  }

  if (toolName === 'check_policy') {
    const { merchant_id, amount, category } = toolInput as { merchant_id: string; amount: number; category: string };
    const policy = await getPolicy();
    const todaySpend = await getTodaySpend();
    if (!policy?.active) return JSON.stringify({ decision: 'REJECTED', reason: 'Agent policy disabled' });
    if (!policy.allowed_categories.includes(category)) return JSON.stringify({ decision: 'REJECTED', reason: `Category '${category}' not allowed` });
    if (amount > policy.require_approval_above) return JSON.stringify({ decision: 'ESCALATED', reason: `€${amount} exceeds approval threshold of €${policy.require_approval_above}` });
    if (amount > policy.single_transaction_limit) return JSON.stringify({ decision: 'REJECTED', reason: `€${amount} exceeds single transaction limit of €${policy.single_transaction_limit}` });
    if (todaySpend + amount > policy.daily_limit) return JSON.stringify({ decision: 'REJECTED', reason: `Would exceed daily limit` });
    return JSON.stringify({ decision: 'APPROVED', merchant_id, amount, category });
  }

  if (toolName === 'initiate_payment') {
    const { merchant_id, amount, description } = toolInput as { merchant_id: string; amount: number; description: string };
    const merchant = MERCHANTS.find(m => m.id === merchant_id);
    if (!merchant) return JSON.stringify({ error: 'Merchant not found' });
    const policy = await getPolicy();
    const todaySpend = await getTodaySpend();
    let decision = 'APPROVED';
    let reason = 'Transaction approved by agent policy';
    if (!policy?.active) { decision = 'REJECTED'; reason = 'Agent policy disabled'; }
    else if (!policy.allowed_categories.includes(merchant.category)) { decision = 'REJECTED'; reason = 'Category not permitted'; }
    else if (amount > policy.single_transaction_limit) { decision = 'REJECTED'; reason = 'Exceeds single transaction limit'; }
    else if (todaySpend + amount > policy.daily_limit) { decision = 'REJECTED'; reason = 'Would exceed daily limit'; }
    await logAction({ tool_called: 'initiate_payment', merchant_id, merchant_name: merchant.name, amount, category: merchant.category, decision, reason, agent_reasoning: description });
    return JSON.stringify({ decision, merchant: merchant.name, amount, reference: decision === 'APPROVED' ? `TXN-${Date.now()}` : null, reason });
  }

  if (toolName === 'escalate_for_approval') {
    const { merchant_id, merchant_name, amount, reason } = toolInput as { merchant_id: string; merchant_name: string; amount: number; reason: string };
    await supabase.from('pending_approvals').insert({ merchant_id, merchant_name, amount, reason });
    await logAction({ tool_called: 'escalate_for_approval', merchant_id, merchant_name, amount, decision: 'ESCALATED', reason });
    return JSON.stringify({ status: 'ESCALATED', message: `€${amount} with ${merchant_name} queued for human approval` });
  }

  return JSON.stringify({ error: 'Unknown tool' });
}

export async function POST(req: NextRequest) {
  const { task } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (msg: string) => controller.enqueue(encoder.encode(`data: ${msg}\n\n`));

      send(`🤖 Task received: "${task}"`);

      const messages: Anthropic.MessageParam[] = [
        { role: 'user', content: task }
      ];

      let continueLoop = true;
      while (continueLoop) {
        const response = await client.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 1024,
          tools,
          messages,
          system: 'You are a purchasing agent. Use the available tools to complete the user\'s purchasing task. Always check policy before initiating payment. Be concise in your reasoning.',
        });

        for (const block of response.content) {
          if (block.type === 'text' && block.text) {
            send(`💭 ${block.text}`);
          }
          if (block.type === 'tool_use') {
            send(`🔧 Calling ${block.name}(${JSON.stringify(block.input)})`);
            const result = await handleToolCall(block.name, block.input as Record<string, unknown>);
            const parsed = JSON.parse(result);
            send(`📋 Result: ${JSON.stringify(parsed)}`);

            messages.push({ role: 'assistant', content: response.content });
            messages.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: block.id, content: result }] });
          }
        }

        if (response.stop_reason === 'end_turn' || response.stop_reason === 'stop_sequence') {
          continueLoop = false;
        } else if (response.stop_reason !== 'tool_use') {
          continueLoop = false;
        }
      }

      send('[DONE]');
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}