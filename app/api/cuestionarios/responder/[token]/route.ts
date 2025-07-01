import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

// Schema para validar las respuestas
const respuestasSchema = z.object({
  respuestas: z.array(
    z.object({
      pregunta_id: z.union([z.number(), z.string()]), // Acepta number o string
      valor: z.number().min(0).max(5), // Rango amplio para diferentes cuestionarios
    })
  ),
});

export async function POST(
  request: NextRequest
) {
  const token = request.nextUrl.pathname.split('/').pop();

  if (!token) {
    return NextResponse.json({ error: "Token no proporcionado" }, { status: 400 });
  }

  try {
    // 1. Validar el body
    const body = await request.json();
    const validacion = respuestasSchema.safeParse(body);
    
    if (!validacion.success) {
      return NextResponse.json({ error: validacion.error.flatten() }, { status: 400 });
    }
    
    const { respuestas } = validacion.data;

    // 2. Obtener informaciu00f3n del link
    const { data: linkData, error: linkError } = await supabaseAdmin
      .from("links_cuestionario")
      .select("*")
      .eq("token", token)
      .single();

    if (linkError || !linkData) {
      return NextResponse.json({ error: "Link no encontrado" }, { status: 404 });
    }

    // 3. Verificar si el link ha expirado o ya fue consumido
    const ahora = new Date();
    const expiracion = new Date(linkData.expira_en);
    
    if (ahora > expiracion) {
      return NextResponse.json({ error: "El link ha expirado" }, { status: 400 });
    }
    
    if (linkData.consumido) {
      return NextResponse.json({ error: "Este cuestionario ya ha sido respondido" }, { status: 400 });
    }

    // 4. Calcular puntuación según el código del cuestionario
    const answersNumeric = respuestas.map((r) => r.valor);

    // Obtener el código del cuestionario
    const { data: cuestionarioRow } = await supabaseAdmin
      .from("cuestionarios")
      .select("codigo")
      .eq("id", linkData.cuestionario_id)
      .single();

    const codigo = cuestionarioRow?.codigo || "WHO-5";
    const { scores } = await import("@/src/scoring");
    const puntuacion = scores[codigo] ? scores[codigo](answersNumeric) : null;

    // 5. Registrar las respuestas
    const { data: respuestaData, error: respuestaError } = await supabaseAdmin
      .from("respuestas")
      .insert({
        paciente_id: linkData.paciente_id,
        cuestionario_id: linkData.cuestionario_id,
        enviado_desde: "email", // Por defecto, se podru00eda determinar mejor
        respuestas: respuestas,
        puntuacion: puntuacion
      })
      .select("id")
      .single();

    if (respuestaError) {
      console.error("Error al guardar respuestas:", respuestaError);
      return NextResponse.json({ error: "Error al guardar respuestas" }, { status: 500 });
    }

    // 6. Marcar el link como consumido
    const { error: updateError } = await supabaseAdmin
      .from("links_cuestionario")
      .update({ consumido: true })
      .eq("token", token);

    if (updateError) {
      console.error("Error al actualizar estado del link:", updateError);
      // No fallamos la operaciu00f3n completa si esto falla
    }

    return NextResponse.json({
      success: true,
      message: "Respuestas registradas correctamente",
      id: respuestaData?.id,
    });
  } catch (error) {
    console.error("Error al procesar respuestas:", error);
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}
