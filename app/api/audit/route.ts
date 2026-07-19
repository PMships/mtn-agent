import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function GET() {
  const { data } = await supabase
    .from('agent_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  return NextResponse.json(data || []);
}