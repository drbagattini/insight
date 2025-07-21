import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { z } from 'zod';

const cancelSchema = z.object({
  envioId: z.string().uuid(),
  razon: z.string().optional() // Opcional: razón de cancelación
});

// POST /api/envios_programados/cancelar
export async function POST(req: NextRequest) {
  console.log('🚫 Cancelar envío programado...');
  
  // Verificar sesión
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  
  try {
    const body = await req.json();
    const parsed = cancelSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    
    const { envioId, razon } = parsed.data;
    
    // 1. Verificar que el envío existe y pertenece al psicólogo
    const { data: envio, error: fetchError } = await supabaseAdmin
      .from('envios_programados')
      .select(`
        id, 
        activo, 
        frecuencia,
        patients!inner(psychologist_id)
      `)
      .eq('id', envioId)
      .single();
    
    if (fetchError || !envio) {
      return NextResponse.json({ error: "Envío programado no encontrado" }, { status: 404 });
    }
    
    // Verificar ownership
    if (envio.patients[0]?.psychologist_id !== session.user.id) {
      return NextResponse.json({ error: "No autorizado para este envío" }, { status: 403 });
    }
    
    if (!envio.activo) {
      return NextResponse.json({ error: "El envío ya está inactivo" }, { status: 400 });
    }
    
    // 2. Desactivar el envío (cancela TODOS los futuros triggers)
    const { data: canceledEnvio, error: updateError } = await supabaseAdmin
      .from('envios_programados')
      .update({ 
        activo: false,
        proximo_envio: null, // Limpiar próxima fecha
        actualizado_en: new Date().toISOString()
      })
      .eq('id', envioId)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('Error cancelando envío:', updateError);
      return NextResponse.json({ error: "Error cancelando envío" }, { status: 500 });
    }
    
    console.log(`✅ Envío ${envioId} cancelado exitosamente`);
    
    return NextResponse.json({
      success: true,
      message: "Envío programado cancelado exitosamente",
      canceledEnvio: {
        id: canceledEnvio.id,
        frecuencia: canceledEnvio.frecuencia,
        activo: canceledEnvio.activo,
        proximo_envio: canceledEnvio.proximo_envio
      },
      note: "Se han cancelado TODOS los envíos futuros de esta programación",
      razon: razon || 'No especificada'
    });
    
  } catch (error) {
    console.error('Exception cancelando envío:', error);
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 });
  }
}

// GET /api/envios_programados/cancelar?envioId=xxx - Info sobre un envío
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  
  const { searchParams } = new URL(req.url);
  const envioId = searchParams.get('envioId');
  
  if (!envioId) {
    return NextResponse.json({ error: "envioId requerido" }, { status: 400 });
  }
  
  const { data: envio, error } = await supabaseAdmin
    .from('envios_programados')
    .select(`
      id,
      frecuencia,
      proximo_envio,
      activo,
      canal,
      creado_en,
      actualizado_en,
      patients!inner(id, name, psychologist_id),
      cuestionarios!inner(titulo, codigo)
    `)
    .eq('id', envioId)
    .single();
    
  if (error || !envio) {
    return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 });
  }
  
  // Verificar ownership
  if (envio.patients[0]?.psychologist_id !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  
  return NextResponse.json({
    success: true,
    envio: {
      id: envio.id,
      frecuencia: envio.frecuencia,
      proximo_envio: envio.proximo_envio,
      activo: envio.activo,
      canal: envio.canal,
      paciente: envio.patients[0]?.name,
      cuestionario: envio.cuestionarios[0]?.titulo,
      creado_en: envio.creado_en,
      actualizado_en: envio.actualizado_en,
      status: envio.activo ? 'ACTIVO' : 'CANCELADO',
      nextAction: !envio.activo ? 'Cancelado - sin envíos futuros' : 
                  envio.proximo_envio ? `Próximo envío: ${envio.proximo_envio}` : 
                  'Programación pendiente'
    }
  });
}
