import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Patient ID no proporcionado' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error obteniendo paciente:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
  }

  return NextResponse.json(data);
}

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
