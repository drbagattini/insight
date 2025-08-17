import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { z } from 'zod';
import { calculateOYSAlerts, calculateOYSFunctioningAlerts, combineOYSAlerts } from '@/app/lib/utils/oysAlerts';

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
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

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
    console.log(`[PHQ-9 DEBUG] Respuestas recibidas:`, JSON.stringify(respuestas, null, 2));
    const answersNumeric = respuestas.map((r) => r.valor);
    console.log(`[PHQ-9 DEBUG] Respuestas numéricas mapeadas:`, answersNumeric);

    // Obtener el código del cuestionario
    const { data: cuestionarioRow } = await supabaseAdmin
      .from("cuestionarios")
      .select("codigo")
      .eq("id", linkData.cuestionario_id)
      .single();

    const codigo = cuestionarioRow?.codigo || "WHO-5";
    console.log(`[PHQ-9 DEBUG] Procesando cuestionario: ${codigo}`);
    console.log(`[PHQ-9 DEBUG] Respuestas numéricas:`, answersNumeric);
    
    const { scores } = await import("@/src/scoring");
    const scoreResult = scores[codigo] ? scores[codigo](answersNumeric) : null;
    console.log(`[PHQ-9 DEBUG] Resultado del scoring:`, scoreResult);

    // 4.1. Preparar los datos para la inserción, manejando puntuaciones simples y detalladas
    const dataToInsert: {
      paciente_id: string;
      cuestionario_id: string;
      enviado_desde: string;
      respuestas: any;
      puntuacion?: number | null;
      score_detallado?: any;
    } = {
      paciente_id: linkData.paciente_id,
      cuestionario_id: linkData.cuestionario_id,
      enviado_desde: "email",
      respuestas: respuestas,
    };

    if (typeof scoreResult === 'number') {
      // Para cuestionarios con una sola puntuación (ej. WHO-5)
      dataToInsert.puntuacion = scoreResult;
    } else if (typeof scoreResult === 'object' && scoreResult !== null) {
      // Para cuestionarios con puntuaciones detalladas (ej. OPD-CA2-SQ)
      dataToInsert.score_detallado = scoreResult;
      dataToInsert.puntuacion = (scoreResult as any).total || null; // Guardamos el total o null
    } else {
      // Si no hay puntuación calculable
      dataToInsert.puntuacion = null;
    }

    // 5. Registrar las respuestas
    console.log(`[PHQ-9 DEBUG] Datos a insertar:`, JSON.stringify(dataToInsert, null, 2));
    const { data: respuestaData, error: respuestaError } = await supabaseAdmin
      .from("respuestas")
      .insert(dataToInsert)
      .select("id")
      .single();

    if (respuestaError) {
      console.error("Error al guardar respuestas:", respuestaError);
      return NextResponse.json({ error: "Error al guardar respuestas" }, { status: 500 });
    }

    // 6. Calcular alertas para Ohio Youth Scales
    let alertsCalculated = false;
    if (cuestionarioRow?.codigo?.startsWith('OYS-')) {
      try {
        const answersNumeric = respuestas.map((r) => r.valor);
        let alertResult;

        const codeUpper = (cuestionarioRow.codigo || '').toUpperCase();
        if (codeUpper === 'OYS-PADRES-40' || codeUpper === 'OYS-JOVENES-40') {
          // Dividir en PS (primeros 20) y F (últimos 20) y combinar alertas
          const psAnswers = answersNumeric.slice(0, 20);
          const fAnswers = answersNumeric.slice(20, 40);
          const psAlerts = calculateOYSAlerts('OYS-PS', psAnswers);
          const fAlerts = calculateOYSFunctioningAlerts('OYS-F', fAnswers);
          alertResult = combineOYSAlerts(psAlerts, fAlerts);
        } else if (cuestionarioRow.codigo.includes('PS')) {
          // Cuestionario de Problemas
          alertResult = calculateOYSAlerts(cuestionarioRow.codigo, answersNumeric);
        } else if (cuestionarioRow.codigo.includes('F')) {
          // Cuestionario de Funcionamiento
          alertResult = calculateOYSFunctioningAlerts(cuestionarioRow.codigo, answersNumeric);
        }

        if (alertResult && alertResult.hasAlerts) {
          // Guardar alertas en la tabla de alertas
          const alertsToInsert = alertResult.alerts.map(alert => ({
            paciente_id: linkData.paciente_id,
            respuesta_id: respuestaData?.id,
            tipo: alert.type,
            severidad: alert.severity,
            mensaje: alert.message,
            evidencia: JSON.stringify(alert.evidence),
            recomendaciones: JSON.stringify(alert.recommendations),
            activa: true,
            fecha_creacion: new Date().toISOString()
          }));

          const { error: alertsError } = await supabaseAdmin
            .from('alertas_clinicas')
            .insert(alertsToInsert);

          if (alertsError) {
            console.error('Error al guardar alertas OYS:', alertsError);
          } else {
            console.log(`[OYS ALERTS] ${alertResult.alerts.length} alertas guardadas para ${cuestionarioRow.codigo}`);
            alertsCalculated = true;
          }
        }
      } catch (alertError) {
        console.error('Error al calcular alertas OYS:', alertError);
      }
    }

    // 7. Marcar el link como consumido
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
      alertsCalculated
    });
  } catch (error) {
    console.error("Error al procesar respuestas:", error);
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}
