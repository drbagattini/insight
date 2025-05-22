import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function GET(
  request: NextRequest
) {
  const token = request.nextUrl.pathname.split('/').pop();
  if (!token) {
    return NextResponse.json({ error: "Token no proporcionado" }, { status: 400 });
  }

  // 1. Obtener datos del link
  const { data: linkData, error: linkError } = await supabaseAdmin
    .from("links_cuestionario")
    .select("paciente_id, cuestionario_id")
    .eq("token", token)
    .single();
  if (linkError || !linkData) {
    return NextResponse.json({ error: "Link no encontrado" }, { status: 404 });
  }

  // 2. Obtener todas las respuestas para evolución del paciente
  const { data: respuestasData, error: respuestasError } = await supabaseAdmin
    .from("respuestas")
    .select("respuestas, puntuacion, creado_en")
    .eq("paciente_id", linkData.paciente_id)
    .eq("cuestionario_id", linkData.cuestionario_id)
    .order("creado_en", { ascending: true });
  if (respuestasError) {
    console.error("Error al obtener respuestas:", respuestasError);
    return NextResponse.json({ error: "No se pudo obtener las respuestas" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: respuestasData });
}
