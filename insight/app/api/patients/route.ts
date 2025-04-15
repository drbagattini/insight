import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabase";
import { NewPatient, PatientUpdate } from "@/types/patients";
import { getServerSession } from "next-auth";

// GET: Obtener pacientes del psicólogo autenticado
export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("patients")
    .select(`
      id,
      full_name,
      email,
      whatsapp,
      created_at,
      updated_at,
      active,
      unique_code,
      metadata
    `)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST: Crear nuevo paciente
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const newPatient: NewPatient = {
      ...body,
      psychologist_id: session.user?.id as string, // Asignar automáticamente al psicólogo actual
    };

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("patients")
      .insert([newPatient])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Error al crear paciente" },
      { status: 500 }
    );
  }
}

// PATCH: Actualizar paciente existente
export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates }: { id: string } & PatientUpdate = body;

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere ID del paciente" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("patients")
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json(
      { error: "Error al actualizar paciente" },
      { status: 500 }
    );
  }
}

// DELETE: Desactivar paciente (soft delete)
export async function DELETE(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere ID del paciente" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("patients")
      .update({ active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deactivating patient:", error);
    return NextResponse.json(
      { error: "Error al desactivar paciente" },
      { status: 500 }
    );
  }
}
