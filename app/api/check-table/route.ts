import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET() {
  try {
    // Verificar la estructura de la tabla users
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Error al verificar tabla:', tableError);
      return NextResponse.json({
        error: tableError.message,
        code: tableError.code,
        details: tableError.details,
        hint: tableError.hint
      }, { status: 500 });
    }

    // Obtener la definición de la tabla
    const { data: definition, error: definitionError } = await supabase
      .rpc('get_table_definition', { table_name: 'users' });

    if (definitionError) {
      console.error('Error al obtener definición:', definitionError);
      return NextResponse.json({
        error: definitionError.message,
        code: definitionError.code
      }, { status: 500 });
    }

    return NextResponse.json({
      tableExists: true,
      columns: definition,
      sampleData: tableInfo
    });
  } catch (err) {
    console.error('Error al verificar tabla:', err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Error desconocido'
    }, { status: 500 });
  }
}
