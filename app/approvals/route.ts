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
  await supabase
    .from('pending_approvals')
    .update({ status: decision })
    .eq('id', id);
  return NextResponse.json({ ok: true });
}