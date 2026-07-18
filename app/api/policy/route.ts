import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function GET() {
  const { data } = await supabase.from('agent_policies').select('*').eq('active', true).single();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { data } = await supabase.from('agent_policies').select('id').eq('active', true).single();
    if (!data) return NextResponse.json({ error: 'No active policy found' }, { status: 404 });
    await supabase.from('agent_policies').update({
      daily_limit: body.daily_limit,
      single_transaction_limit: body.single_transaction_limit,
      require_approval_above: body.require_approval_above,
      active: body.active,
      updated_at: new Date().toISOString(),
    }).eq('id', data.id);
    return NextResponse.json({ ok: true });
  }