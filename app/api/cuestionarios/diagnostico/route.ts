import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET() {
  const diagnostico = {
    timestamp: new Date().toISOString(),
    apis: {},
    configuracion: {},
    cuestionarios: {},
    errores: [] as string[]
  };

  try {
    // 1. Verificar API de cuestionarios públicos
    try {
      const { data: cuestionarios, error } = await supabaseAdmin
        .from('cuestionarios')
        .select('id, codigo, titulo')
        .eq('activo', true)
        .limit(10);

      diagnostico.apis = {
        cuestionarios_publicos: {
          status: error ? 'ERROR' : 'OK',
          count: cuestionarios?.length || 0,
          error: error?.message
        }
      };

      // Buscar específicamente los OYS
      const oysCount = cuestionarios?.filter(c => 
        c.codigo?.includes('OYS') || c.titulo?.includes('Ohio')
      ).length || 0;

      diagnostico.cuestionarios = {
        total: cuestionarios?.length || 0,
        oys_consolidados: oysCount,
        listado: cuestionarios?.map(c => ({
          codigo: c.codigo,
          titulo: c.titulo
        })) || []
      };

    } catch (error) {
      diagnostico.errores.push(`Error API cuestionarios: ${error}`);
    }

    // 2. Verificar configuración de email
    const emailConfig = {
      brevo_host: !!process.env.BREVO_SMTP_HOST,
      brevo_port: !!process.env.BREVO_SMTP_PORT,
      brevo_user: !!process.env.BREVO_SMTP_USER,
      brevo_pass: !!process.env.BREVO_SMTP_PASS,
      email_sender: !!process.env.EMAIL_SENDER
    };

    const emailConfigured = Object.values(emailConfig).every(Boolean);

    diagnostico.configuracion = {
      email: {
        configurado: emailConfigured,
        detalles: emailConfig,
        mensaje: emailConfigured 
          ? 'Configuración de email completa' 
          : 'Faltan variables de entorno para Brevo SMTP'
      },
      whatsapp: {
        configurado: !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN),
        phone_id: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
        access_token: !!process.env.WHATSAPP_ACCESS_TOKEN,
        template_name: process.env.WHATSAPP_TEMPLATE_NAME || 'insight'
      }
    };

    if (!emailConfigured) {
      diagnostico.errores.push('Configuración de email incompleta - no se pueden enviar cuestionarios por email');
    }

    // 3. Estado general
    const status = diagnostico.errores.length === 0 ? 'HEALTHY' : 'ISSUES_FOUND';

    return NextResponse.json({
      status,
      ...diagnostico,
      recomendaciones: diagnostico.errores.length > 0 ? [
        'Revisar EMAIL_CONFIG_REQUIRED.md para configurar variables de entorno',
        'Verificar que los cuestionarios OYS estén activos en la base de datos',
        'Probar el envío de un cuestionario de prueba'
      ] : [
        'Sistema funcionando correctamente',
        'Cuestionarios OYS consolidados disponibles',
        'Configuración de email lista'
      ]
    });

  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
