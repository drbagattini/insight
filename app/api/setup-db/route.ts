import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET() {
  try {
    // Crear la tabla users si no existe
    const { error: createTableError } = await supabase.rpc('create_users_table');

    if (createTableError) {
      console.error('Error al crear tabla:', createTableError);
      return NextResponse.json({
        error: createTableError.message,
        details: createTableError.details,
        hint: createTableError.hint
      }, { status: 500 });
    }

    // Verificar que la tabla se creó correctamente
    const { data: tableInfo, error: checkError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('Error al verificar tabla:', checkError);
      return NextResponse.json({
        error: checkError.message,
        details: checkError.details,
        hint: checkError.hint
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Tabla users creada/verificada correctamente'
    });
  } catch (err) {
    console.error('Error al configurar la base de datos:', err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Error desconocido'
    }, { status: 500 });
  }
}
