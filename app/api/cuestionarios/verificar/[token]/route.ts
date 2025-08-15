import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest
) {
  const token = request.nextUrl.pathname.split('/').pop();

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

    // 5. Procesar items y agregar opciones de respuesta si faltan
    let items = cuestionario.items;
    
    // Parsear items si vienen como string JSON
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (parseError) {
        console.error('Error parsing items JSON:', parseError);
        return NextResponse.json({ error: "Error al cargar las preguntas del cuestionario" }, { status: 500 });
      }
    }
    
    // Manejar diferentes estructuras de items
    if (items && typeof items === 'object' && !Array.isArray(items)) {
      if (items.items && Array.isArray(items.items)) {
        items = items.items;
      } else {
        console.error('Items structure invalid:', items);
        return NextResponse.json({ error: "Formato de cuestionario inválido" }, { status: 500 });
      }
    }
    
    if (!Array.isArray(items)) {
      console.error('Items is not an array:', typeof items);
      return NextResponse.json({ error: "Formato de cuestionario inválido" }, { status: 500 });
    }

    // Agregar opciones de respuesta basadas en el código del cuestionario
    const addResponseOptions = (codigo: string) => {
      if (codigo === 'OYS-PS-P-SF20' || codigo === 'OYS-PS-Y-SF20') {
        return [
          { valor: 0, texto: "Nada en absoluto" },
          { valor: 1, texto: "Una o dos veces" },
          { valor: 2, texto: "Varias veces" },
          { valor: 3, texto: "A menudo" },
          { valor: 4, texto: "La mayor parte del tiempo" },
          { valor: 5, texto: "Todo el tiempo" }
        ];
      } else if (codigo === 'OYS-F-P-SF20' || codigo === 'OYS-F-Y-SF20') {
        return [
          { valor: 0, texto: "Problemas extremos" },
          { valor: 1, texto: "Bastantes problemas" },
          { valor: 2, texto: "Algunos problemas" },
          { valor: 3, texto: "Bien" },
          { valor: 4, texto: "Muy bien" }
        ];
      } else if (codigo === 'WHO-5') {
        return [
          { valor: 0, texto: "En ningún momento" },
          { valor: 1, texto: "Menos de la mitad del tiempo" },
          { valor: 2, texto: "Más de la mitad del tiempo" },
          { valor: 3, texto: "La mayor parte del tiempo" },
          { valor: 4, texto: "Casi todo el tiempo" },
          { valor: 5, texto: "Todo el tiempo" }
        ];
      } else if (codigo === 'PHQ-9') {
        return [
          { valor: 0, texto: "Nunca" },
          { valor: 1, texto: "Varios días" },
          { valor: 2, texto: "Más de la mitad de los días" },
          { valor: 3, texto: "Casi todos los días" }
        ];
      } else if (codigo === 'GAD-7') {
        return [
          { valor: 0, texto: "Nunca" },
          { valor: 1, texto: "Varios días" },
          { valor: 2, texto: "Más de la mitad de los días" },
          { valor: 3, texto: "Casi todos los días" }
        ];
      } else if (codigo === 'BR-WAI') {
        return [
          { valor: 1, texto: "Totalmente en desacuerdo" },
          { valor: 2, texto: "En desacuerdo" },
          { valor: 3, texto: "Ni de acuerdo ni en desacuerdo" },
          { valor: 4, texto: "De acuerdo" },
          { valor: 5, texto: "Totalmente de acuerdo" }
        ];
      } else if (codigo === 'OPD-CA2-SQ') {
        return [
          { valor: 0, texto: "No se aplica" },
          { valor: 1, texto: "Raramente cierto" },
          { valor: 2, texto: "A veces cierto" },
          { valor: 3, texto: "A menudo cierto" },
          { valor: 4, texto: "Exactamente cierto" }
        ];
      }
      return [];
    };

    // Asegurar que todos los items tengan opciones de respuesta
    const responseOptions = addResponseOptions(cuestionario.codigo);
    items = items.map(item => ({
      ...item,
      opciones_respuesta: item.opciones_respuesta || responseOptions
    }));

    // Actualizar el cuestionario con items procesados
    const updatedCuestionario = {
      ...cuestionario,
      items: items
    };

    // 6. Devolver toda la información necesaria
    return NextResponse.json({
      pacienteId: paciente.id,
      pacienteNombre: paciente.name,
      cuestionarioId: cuestionario.id,
      cuestionario: updatedCuestionario,
      expirado,
    });
  } catch (error) {
    console.error("Error al verificar token:", error);
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}
