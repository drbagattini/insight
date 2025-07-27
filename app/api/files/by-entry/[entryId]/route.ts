import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { entryId } = await params;

    if (!entryId) {
      return NextResponse.json({ error: 'No se proporcionó ID de entrada' }, { status: 400 });
    }

    // Obtener archivos de la entrada específica
    const { data: files, error } = await supabase
      .from('file_attachments')
      .select('*')
      .eq('entry_id', entryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching files:', error);
      return NextResponse.json({ 
        error: 'Error al obtener archivos: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      files: files || []
    });

  } catch (error) {
    console.error('Error in files API:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
