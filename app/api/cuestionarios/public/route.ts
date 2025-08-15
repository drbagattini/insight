import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { applySortingToApiResponse } from '@/lib/questionnaire-order';

// GET: listar plantillas de cuestionarios activas (endpoint público para formularios)
export async function GET() {
  try {
    // Primero intentar con la estructura completa, luego simplificar si falla
    let data, error;
    
    try {
      // Intentar con destinatario
      const result = await supabaseAdmin
        .from('cuestionarios')
        .select('id, codigo, titulo, destinatario')
        .eq('activo', true)
        .order('titulo', { ascending: true });
      
      data = result.data;
      error = result.error;
    } catch (e) {
      // Si falla, intentar sin destinatario
      const result = await supabaseAdmin
        .from('cuestionarios')
        .select('id, codigo, titulo')
        .eq('activo', true)
        .order('titulo', { ascending: true });
      
      data = result.data;
      error = result.error;
    }

    // Si aún falla, intentar estructura más básica
    if (error && error.message?.includes('does not exist')) {
      const result = await supabaseAdmin
        .from('cuestionarios')
        .select('*')
        .eq('activo', true)
        .limit(10);
      
      data = result.data;
      error = result.error;
    }

    // Inferir destinatario a partir del código cuando no exista la columna en BD
    const inferDestinatario = (codigo: string | null | undefined, titulo?: string | null) => {
      const c = (codigo || '').toUpperCase();
      const t = (titulo || '').toUpperCase();
      // Reglas: si referencia a Padres/Tutores en código o título => 'padre_tutor'
      if (
        c.includes('-P-') || c.endsWith('-P') || c.startsWith('P-') ||
        c.includes('PADRE') || c.includes('PADRES') || c.includes('TUTOR') ||
        t.includes('PADRE') || t.includes('PADRES') || t.includes('TUTOR')
      ) {
        return 'padre_tutor';
      }
      return 'paciente';
    };

    // Transform data to ensure consistent structure
    const transformedData = data?.map((item: any) => ({
      id: item.id,
      codigo: item.codigo || '',
      nombre: item.titulo || item.nombre || item.name || 'Cuestionario sin nombre',
      destinatario: item.destinatario || inferDestinatario(item.codigo, item.titulo)
    })) || [];

    if (error) {
      console.error('Error al listar cuestionarios públicos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aplicar ordenamiento específico
    const sortedData = applySortingToApiResponse(transformedData);

    return NextResponse.json(sortedData);
  } catch (error) {
    console.error('Error inesperado en cuestionarios públicos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
