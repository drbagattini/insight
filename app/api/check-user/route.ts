import { supabase } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Error en la consulta' }, { status: 500 });
    }

    return NextResponse.json({ exists: !!data });
  } catch (error) {
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
