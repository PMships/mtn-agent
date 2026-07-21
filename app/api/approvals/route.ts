import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function GET() {
  const { data } = await supabase
    .from('pending_approvals')
    .select('*')
    .order('created_at', { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const { id, decision } = await req.json();

  const { data: approval } = await supabase
    .from('pending_approvals')
    .select('*')
    .eq('id', id)
    .single();

  await supabase
    .from('pending_approvals')
    .update({ status: decision })
    .eq('id', id);

  if (decision === 'approved' && approval) {
    const ref = `TXN-${Date.now()}`;
    await supabase.from('agent_audit_log').insert({
      tool_called: 'initiate_payment',
      merchant_id: approval.merchant_id,
      merchant_name: approval.merchant_name,
      amount: approval.amount,
      decision: 'APPROVED',
      reason: 'Manually approved by human reviewer',
      agent_reasoning: `Human approved escalated transaction — reference ${ref}`,
    });
  }

  return NextResponse.json({ ok: true });
}