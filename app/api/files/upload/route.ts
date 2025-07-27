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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const patientId = formData.get('patientId') as string;
    const entryId = formData.get('entryId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    if (!patientId) {
      return NextResponse.json({ error: 'No se proporcionó ID del paciente' }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de archivo no permitido. Solo se permiten PDFs y archivos de audio.' 
      }, { status: 400 });
    }

    // Validar tamaño (máximo 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'El archivo es demasiado grande. Máximo 50MB.' 
      }, { status: 400 });
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Crear ruta del archivo en el bucket
    const filePath = `patients/${patientId}/attachments/${fileName}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('patient-files')
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json({ 
        error: 'Error al subir el archivo: ' + uploadError.message 
      }, { status: 500 });
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('patient-files')
      .getPublicUrl(filePath);

    // Guardar metadata del archivo en la base de datos
    const { data: dbData, error: dbError } = await supabase
      .from('file_attachments')
      .insert({
        patient_id: patientId,
        entry_id: entryId || null, // Convertir string vacío a null
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        public_url: urlData.publicUrl,
        uploaded_by: session.user.email,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving file metadata:', dbError);
      // Intentar eliminar el archivo subido si falla la inserción en BD
      await supabase.storage.from('patient-files').remove([filePath]);
      return NextResponse.json({ 
        error: 'Error al guardar metadata del archivo: ' + dbError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      file: {
        id: dbData.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        path: filePath
      }
    });

  } catch (error) {
    console.error('Error in file upload:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
