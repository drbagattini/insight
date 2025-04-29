import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Patient ID no proporcionado' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('patients')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error eliminando paciente:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
