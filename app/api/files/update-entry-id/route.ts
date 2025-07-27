import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { patientId, entryId, fileIds } = await request.json();

    if (!patientId || !entryId || !fileIds || !Array.isArray(fileIds)) {
      return NextResponse.json({ 
        error: 'Faltan parámetros requeridos: patientId, entryId, fileIds' 
      }, { status: 400 });
    }

    // Actualizar los archivos para asociarlos con la entrada
    const { data, error } = await supabase
      .from('file_attachments')
      .update({ entry_id: entryId })
      .in('id', fileIds)
      .eq('patient_id', patientId)
      .select();

    if (error) {
      console.error('Error updating file entry_id:', error);
      return NextResponse.json({ 
        error: 'Error al actualizar archivos: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updatedFiles: data?.length || 0
    });

  } catch (error) {
    console.error('Error in update-entry-id API:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
