import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

// DELETE: cancelar un envío programado por ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Envio programado ID no proporcionado' }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from('envios_programados')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error cancelando envío programado:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
