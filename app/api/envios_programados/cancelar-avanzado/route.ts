import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { computeNextDate } from '@/app/lib/utils/cuestionarios';
import { z } from 'zod';

const cancelAdvancedSchema = z.object({
  envioId: z.string().uuid(),
  action: z.enum(['cancel_next', 'cancel_all', 'pause', 'unpause']),
  razon: z.string().optional(),
});

// POST /api/envios_programados/cancelar-avanzado
export async function POST(req: NextRequest) {
  console.log('🚫 Cancelación avanzada de envío programado...');
  
  // Verificar sesión
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  
  try {
    const body = await req.json();
    const parsed = cancelAdvancedSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    
    const { envioId, action, razon } = parsed.data;
    
    // 1. Verificar que el envío existe y pertenece al psicólogo
    const { data: envio, error: fetchError } = await supabaseAdmin
      .from('envios_programados')
      .select(`
        id, 
        activo, 
        frecuencia,
        proximo_envio,
        paciente_id,
        patients!inner(
          id,
          psychologist_id
        )
      `)
      .eq('id', envioId)
      .single();
    
    if (fetchError || !envio) {
      console.error('Error fetching envio:', fetchError);
      return NextResponse.json({ error: "Envío programado no encontrado" }, { status: 404 });
    }
    
    console.log('Envio data:', JSON.stringify(envio, null, 2));
    console.log('Session user id:', session.user.id);
    
    // Verificar ownership - patients es un objeto, no un array debido al !inner
    const patient = envio.patients as any;
    if (patient?.psychologist_id !== session.user.id) {
      console.error('Authorization failed:', {
        envio_psychologist_id: patient?.psychologist_id,
        session_user_id: session.user.id
      });
      return NextResponse.json({ error: "No autorizado para este envío" }, { status: 403 });
    }
    
    if (!envio.activo) {
      return NextResponse.json({ error: "El envío ya está inactivo" }, { status: 400 });
    }
    
    let updateData: any = {
      actualizado_en: new Date().toISOString()
    };
    
    let message = "";
    
    switch (action) {
      case 'cancel_next':
        // Solo cancelar el próximo envío, mantener la recurrencia
        if (envio.frecuencia === 'unico') {
          // Si es único, cancelar completamente (será eliminado del frontend)
          updateData.activo = false;
          const farFutureDate = new Date('2099-12-31T23:59:59.999Z');
          updateData.proximo_envio = farFutureDate.toISOString();
          message = "Envío único cancelado";
        } else {
          // Si es recurrente, saltar al siguiente ciclo (sin cambios visuales)
          const currentDate = new Date(envio.proximo_envio);
          const nextDate = computeNextDate(envio.frecuencia, currentDate);
          updateData.proximo_envio = nextDate.toISOString();
          message = "Próximo envío cancelado, recurrencia continúa";
        }
        break;
        
      case 'cancel_all':
        // Cancelar toda la serie (será eliminado del frontend)
        updateData.activo = false;
        const farFutureDate = new Date('2099-12-31T23:59:59.999Z');
        updateData.proximo_envio = farFutureDate.toISOString();
        message = "Toda la serie de envíos cancelada";
        break;
        
      case 'pause':
        // Pausar temporalmente (mostrar como "Pausado" en frontend)
        updateData.activo = true; // Mantener activo pero pausado
        const pauseDate = new Date('2099-01-01T00:00:00.000Z');
        updateData.proximo_envio = pauseDate.toISOString();
        message = "Envíos pausados temporalmente";
        break;
        
      case 'unpause':
        // Despausar - calcular próxima fecha basada en frecuencia
        const nextActiveDate = computeNextDate(envio.frecuencia, new Date());
        updateData.proximo_envio = nextActiveDate.toISOString();
        message = "Envíos reactivados";
        break;
    }
    
    // 2. Aplicar la actualización
    const { data: updatedEnvio, error: updateError } = await supabaseAdmin
      .from('envios_programados')
      .update(updateData)
      .eq('id', envioId)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('Error actualizando envío:', updateError);
      return NextResponse.json({ error: "Error actualizando envío" }, { status: 500 });
    }
    
    console.log(`✅ Envío ${envioId} actualizado: ${action}`);
    
    return NextResponse.json({
      success: true,
      message,
      action,
      updatedEnvio: {
        id: updatedEnvio.id,
        frecuencia: updatedEnvio.frecuencia,
        activo: updatedEnvio.activo,
        proximo_envio: updatedEnvio.proximo_envio
      },
      razon: razon || 'No especificada'
    });
    
  } catch (error) {
    console.error('Exception en cancelación avanzada:', error);
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 });
  }
}

function computeNextRecurrence(currentDate: string, frequency: string): string {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case 'semanal':
      date.setDate(date.getDate() + 7);
      break;
    case 'quincenal':
      date.setDate(date.getDate() + 14);
      break;
    case 'mensual':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'trimestral':
      date.setMonth(date.getMonth() + 3);
      break;
    default:
      // Fallback to monthly
      date.setMonth(date.getMonth() + 1);
  }
  
  return date.toISOString();
}
