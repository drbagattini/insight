import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { patientId } = await params;
  const id = patientId;
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
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params;
  const id = patientId;
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

// Schema para validación de actualización
const updatePatientSchema = z.object({
  name: z.string().min(1, "Nombre requerido").optional(),
  email: z.string().email().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { patientId } = await params;
  const id = patientId;
  if (!id) {
    return NextResponse.json({ error: 'Patient ID no proporcionado' }, { status: 400 });
  }

  try {
    const body = await request.json();
    console.log('[PUT /api/patients/[patientId]] body:', body);
    
    const parsed = updatePatientSchema.safeParse(body);
    if (!parsed.success) {
      console.error('[PUT /api/patients/[patientId]] Validation error:', parsed.error.flatten());
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Verificar que el paciente pertenece al psicólogo autenticado
    const { data: existingPatient, error: checkError } = await supabaseAdmin
      .from('patients')
      .select('id, psychologist_id')
      .eq('id', id)
      .eq('psychologist_id', session.user.id)
      .single();

    if (checkError || !existingPatient) {
      console.error('[PUT /api/patients/[patientId]] Patient not found or unauthorized:', checkError);
      return NextResponse.json({ error: 'Paciente no encontrado o no autorizado' }, { status: 404 });
    }

    // Actualizar el paciente
    const { data: updatedPatient, error: updateError } = await supabaseAdmin
      .from('patients')
      .update({
        name: parsed.data.name,
        email: parsed.data.email,
        whatsapp: parsed.data.whatsapp,
        metadata: parsed.data.metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('[PUT /api/patients/[patientId]] Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log('[PUT /api/patients/[patientId]] Patient updated successfully:', updatedPatient.id);
    return NextResponse.json({ paciente: updatedPatient });

  } catch (error) {
    console.error('[PUT /api/patients/[patientId]] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
