import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import { MERCHANTS } from "../../data/merchants.js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const server = new Server(
  { name: "mtn-agent", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

// ── Helper: get active policy ──────────────────────────────────────────────
async function getPolicy() {
  const { data } = await supabase
    .from("agent_policies")
    .select("*")
    .eq("active", true)
    .single();
  return data;
}

// ── Helper: get today's spend ──────────────────────────────────────────────
async function getTodaySpend() {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("agent_audit_log")
    .select("amount")
    .eq("decision", "APPROVED")
    .gte("created_at", `${today}T00:00:00`);
  return (data || []).reduce((sum, r) => sum + (r.amount || 0), 0);
}

// ── Helper: log action ─────────────────────────────────────────────────────
async function logAction(entry: {
  tool_called: string;
  merchant_id?: string;
  merchant_name?: string;
  amount?: number;
  category?: string;
  decision: string;
  reason?: string;
  agent_reasoning?: string;
}) {
  await supabase.from("agent_audit_log").insert(entry);
}

// ── Tool definitions ───────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_merchants",
      description: "Search available merchants by query or category. Returns merchant options with prices.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "What you're looking for, e.g. 'flight to London'" },
          category: { type: "string", enum: ["travel", "food", "accommodation", "retail"], description: "Optional category filter" },
        },
        required: ["query"],
      },
    },
    {
      name: "check_policy",
      description: "Check whether a proposed transaction is within the user's agent policy before attempting payment.",
      inputSchema: {
        type: "object",
        properties: {
          merchant_id: { type: "string" },
          amount: { type: "number" },
          category: { type: "string" },
        },
        required: ["merchant_id", "amount", "category"],
      },
    },
    {
      name: "initiate_payment",
      description: "Attempt to execute a payment. Will check policy first — only proceeds if approved.",
      inputSchema: {
        type: "object",
        properties: {
          merchant_id: { type: "string" },
          amount: { type: "number" },
          description: { type: "string" },
        },
        required: ["merchant_id", "amount", "description"],
      },
    },
    {
      name: "get_spending_summary",
      description: "Get current spending vs limits to inform purchasing decisions.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "escalate_for_approval",
      description: "Escalate a transaction that exceeds policy thresholds for human approval.",
      inputSchema: {
        type: "object",
        properties: {
          merchant_id: { type: "string" },
          merchant_name: { type: "string" },
          amount: { type: "number" },
          reason: { type: "string" },
        },
        required: ["merchant_id", "merchant_name", "amount", "reason"],
      },
    },
  ],
}));

// ── Tool handlers ──────────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "search_merchants") {
    const { query, category } = args as { query: string; category?: string };
    let results = MERCHANTS;
    if (category) results = results.filter((m) => m.category === category);
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
      );
    }
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }

  if (name === "check_policy") {
    const { merchant_id, amount, category } = args as {
      merchant_id: string; amount: number; category: string;
    };
    const policy = await getPolicy();
    const todaySpend = await getTodaySpend();
    const merchant = MERCHANTS.find((m) => m.id === merchant_id);

    if (!policy?.active) {
      return { content: [{ type: "text", text: JSON.stringify({ decision: "REJECTED", reason: "Agent policy is disabled" }) }] };
    }
    if (!policy.allowed_categories.includes(category)) {
      return { content: [{ type: "text", text: JSON.stringify({ decision: "REJECTED", reason: `Category '${category}' not in allowed categories: ${policy.allowed_categories.join(", ")}` }) }] };
    }
    if (amount > policy.single_transaction_limit) {
      if (amount > policy.require_approval_above) {
        return { content: [{ type: "text", text: JSON.stringify({ decision: "ESCALATED", reason: `Amount €${amount} exceeds approval threshold of €${policy.require_approval_above}` }) }] };
      }
      return { content: [{ type: "text", text: JSON.stringify({ decision: "REJECTED", reason: `Amount €${amount} exceeds single transaction limit of €${policy.single_transaction_limit}` }) }] };
    }
    if (todaySpend + amount > policy.daily_limit) {
      return { content: [{ type: "text", text: JSON.stringify({ decision: "REJECTED", reason: `Would exceed daily limit. Spent today: €${todaySpend}, limit: €${policy.daily_limit}` }) }] };
    }

    return { content: [{ type: "text", text: JSON.stringify({ decision: "APPROVED", merchant: merchant?.name, amount, category }) }] };
  }

  if (name === "initiate_payment") {
    const { merchant_id, amount, description } = args as {
      merchant_id: string; amount: number; description: string;
    };
    const merchant = MERCHANTS.find((m) => m.id === merchant_id);
    if (!merchant) throw new Error(`Merchant ${merchant_id} not found`);

    // Check policy before proceeding
    const policyCheck = await server.request(
      { method: "tools/call", params: { name: "check_policy", arguments: { merchant_id, amount, category: merchant.category } } },
      {} as any
    ).catch(() => null);

    const policy = await getPolicy();
    const todaySpend = await getTodaySpend();

    // Re-run policy logic inline for payment
    let decision = "APPROVED";
    let reason = "Transaction approved by agent policy";

    if (!policy?.active) { decision = "REJECTED"; reason = "Agent policy disabled"; }
    else if (!policy.allowed_categories.includes(merchant.category)) { decision = "REJECTED"; reason = `Category not permitted`; }
    else if (amount > policy.single_transaction_limit) { decision = "REJECTED"; reason = `Exceeds single transaction limit`; }
    else if (todaySpend + amount > policy.daily_limit) { decision = "REJECTED"; reason = `Would exceed daily limit`; }

    await logAction({
      tool_called: "initiate_payment",
      merchant_id,
      merchant_name: merchant.name,
      amount,
      category: merchant.category,
      decision,
      reason,
      agent_reasoning: description,
    });

    const ref = `TXN-${Date.now()}`;
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ decision, merchant: merchant.name, amount, reference: decision === "APPROVED" ? ref : null, reason }),
      }],
    };
  }

  if (name === "get_spending_summary") {
    const policy = await getPolicy();
    const todaySpend = await getTodaySpend();
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          daily_limit: policy?.daily_limit,
          spent_today: todaySpend,
          remaining_today: (policy?.daily_limit || 0) - todaySpend,
          single_transaction_limit: policy?.single_transaction_limit,
          require_approval_above: policy?.require_approval_above,
          allowed_categories: policy?.allowed_categories,
        }),
      }],
    };
  }

  if (name === "escalate_for_approval") {
    const { merchant_id, merchant_name, amount, reason } = args as {
      merchant_id: string; merchant_name: string; amount: number; reason: string;
    };
    await supabase.from("pending_approvals").insert({ merchant_id, merchant_name, amount, reason });
    await logAction({ tool_called: "escalate_for_approval", merchant_id, merchant_name, amount, decision: "ESCALATED", reason });
    return {
      content: [{ type: "text", text: JSON.stringify({ status: "ESCALATED", message: `Transaction of €${amount} with ${merchant_name} queued for human approval` }) }],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
server.connect(transport).then(() => console.error("MTN-Agent MCP server running"));