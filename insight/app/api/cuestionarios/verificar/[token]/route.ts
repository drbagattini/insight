import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const token = params.token;

  if (!token) {
    return NextResponse.json({ error: "Token no proporcionado" }, { status: 400 });
  }

  try {
    // 1. Obtener información del link
    const { data: linkData, error: linkError } = await supabaseAdmin
      .from("links_cuestionario")
      .select("*")
      .eq("token", token)
      .single();

    if (linkError || !linkData) {
      return NextResponse.json({ error: "Link no encontrado" }, { status: 404 });
    }

    // 2. Verificar si el link ha expirado o ya fue consumido
    const ahora = new Date();
    const expiracion = new Date(linkData.expira_en);
    const expirado = ahora > expiracion || linkData.consumido;

    // 3. Obtener información del paciente
    const { data: paciente, error: pacienteError } = await supabaseAdmin
      .from("patients")
      .select("id, name")
      .eq("id", linkData.paciente_id)
      .single();

    if (pacienteError || !paciente) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    // 4. Obtener información del cuestionario
    const { data: cuestionario, error: cuestionarioError } = await supabaseAdmin
      .from("cuestionarios")
      .select("*")
      .eq("id", linkData.cuestionario_id)
      .single();

    if (cuestionarioError || !cuestionario) {
      return NextResponse.json({ error: "Cuestionario no encontrado" }, { status: 404 });
    }

    // 5. Devolver toda la información necesaria
    return NextResponse.json({
      pacienteId: paciente.id,
      pacienteNombre: paciente.name,
      cuestionarioId: cuestionario.id,
      cuestionario,
      expirado,
    });
  } catch (error) {
    console.error("Error al verificar token:", error);
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}
