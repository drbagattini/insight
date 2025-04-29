import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

// GET: listar plantillas de cuestionarios activas
export async function GET(request: Request) {
  const { data, error } = await supabaseAdmin
    .from('cuestionarios')
    .select('id, codigo, titulo')
    .eq('activo', true)
    .order('titulo', { ascending: true });

  if (error) {
    console.error('Error al listar cuestionarios:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
