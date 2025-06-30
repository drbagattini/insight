import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { patientId } = params;
  if (!patientId) {
    return NextResponse.json({ error: 'Patient ID no proporcionado' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('patients')
    .select('*')
    .eq('id', patientId)
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
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { patientId } = params;
  if (!patientId) {
    return NextResponse.json({ error: 'Patient ID no proporcionado' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('patients')
    .delete()
    .eq('id', patientId);
    
  if (error) {
    console.error('Error eliminando paciente:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Paciente eliminado correctamente' }, { status: 200 });
}
