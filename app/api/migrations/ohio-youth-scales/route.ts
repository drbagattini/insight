import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando migración Ohio Youth Scales...');

    // 1. Agregar campo destinatario a cuestionarios
    console.log('📄 Agregando campo destinatario a cuestionarios...');
    const { error: alterCuestionariosError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE cuestionarios 
        ADD COLUMN IF NOT EXISTS destinatario VARCHAR(20) DEFAULT 'paciente' 
        CHECK (destinatario IN ('paciente', 'padre_tutor', 'ambos'));
      `
    });

    if (alterCuestionariosError) {
      console.error('Error agregando campo destinatario a cuestionarios:', alterCuestionariosError);
    } else {
      console.log('✅ Campo destinatario agregado a cuestionarios');
    }

    // 2. Agregar campo destinatario a envios_programados
    console.log('📄 Agregando campo destinatario a envios_programados...');
    const { error: alterEnviosError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE envios_programados 
        ADD COLUMN IF NOT EXISTS destinatario VARCHAR(20) DEFAULT 'paciente' 
        CHECK (destinatario IN ('paciente', 'padre_tutor', 'ambos'));
      `
    });

    if (alterEnviosError) {
      console.error('Error agregando campo destinatario a envios_programados:', alterEnviosError);
    } else {
      console.log('✅ Campo destinatario agregado a envios_programados');
    }

    // 3. Insertar cuestionarios Ohio Youth Scales
    console.log('📄 Insertando cuestionarios Ohio Youth Scales...');
    const { error: insertError } = await supabaseAdmin
      .from('cuestionarios')
      .upsert([
        {
          id: 'oys-ps-p-sf20',
          nombre: 'Ohio Youth Scales - Severidad de Problemas (Padres) - Forma Corta',
          codigo: 'OYS-PS-P-SF20',
          descripcion: 'Cuestionario de 20 ítems para evaluar la severidad de problemas conductuales y emocionales desde la perspectiva de padres/tutores',
          activo: true,
          destinatario: 'padre_tutor'
        },
        {
          id: 'oys-f-p-sf20',
          nombre: 'Ohio Youth Scales - Funcionamiento (Padres) - Forma Corta',
          codigo: 'OYS-F-P-SF20',
          descripcion: 'Cuestionario de 20 ítems para evaluar el nivel de funcionamiento desde la perspectiva de padres/tutores',
          activo: true,
          destinatario: 'padre_tutor'
        },
        {
          id: 'oys-ps-y-sf20',
          nombre: 'Ohio Youth Scales - Severidad de Problemas (Jóvenes) - Forma Corta',
          codigo: 'OYS-PS-Y-SF20',
          descripcion: 'Cuestionario de 20 ítems para evaluar la severidad de problemas conductuales y emocionales desde la perspectiva del joven',
          activo: true,
          destinatario: 'paciente'
        },
        {
          id: 'oys-f-y-sf20',
          nombre: 'Ohio Youth Scales - Funcionamiento (Jóvenes) - Forma Corta',
          codigo: 'OYS-F-Y-SF20',
          descripcion: 'Cuestionario de 20 ítems para evaluar el nivel de funcionamiento desde la perspectiva del joven',
          activo: true,
          destinatario: 'paciente'
        }
      ], { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (insertError) {
      console.error('Error insertando cuestionarios OYS:', insertError);
    } else {
      console.log('✅ Cuestionarios Ohio Youth Scales insertados');
    }

    // 4. Crear tabla alertas_clinicas
    console.log('📄 Creando tabla alertas_clinicas...');
    const { error: createTableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS alertas_clinicas (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
          respuesta_id UUID REFERENCES respuestas(id) ON DELETE CASCADE,
          tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('tdah', 'sustancias', 'autolesion')),
          severidad VARCHAR(10) NOT NULL CHECK (severidad IN ('warning', 'danger')),
          mensaje TEXT NOT NULL,
          evidencia JSONB NOT NULL,
          recomendaciones JSONB NOT NULL,
          activa BOOLEAN DEFAULT true,
          revisada BOOLEAN DEFAULT false,
          revisada_por UUID REFERENCES users(id),
          fecha_revision TIMESTAMPTZ,
          notas_revision TEXT,
          fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
          fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (createTableError) {
      console.error('Error creando tabla alertas_clinicas:', createTableError);
    } else {
      console.log('✅ Tabla alertas_clinicas creada');
    }

    // 5. Crear índices
    console.log('📄 Creando índices...');
    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_paciente_id ON alertas_clinicas(paciente_id);
        CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_tipo ON alertas_clinicas(tipo);
        CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_severidad ON alertas_clinicas(severidad);
        CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_activa ON alertas_clinicas(activa);
        CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_fecha_creacion ON alertas_clinicas(fecha_creacion);
      `
    });

    if (indexError) {
      console.error('Error creando índices:', indexError);
    } else {
      console.log('✅ Índices creados');
    }

    // 6. Configurar RLS
    console.log('📄 Configurando Row Level Security...');
    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE alertas_clinicas ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS alertas_clinicas_select_policy ON alertas_clinicas;
        CREATE POLICY alertas_clinicas_select_policy ON alertas_clinicas
          FOR SELECT
          USING (
            paciente_id IN (
              SELECT id FROM patients WHERE user_id = auth.uid()
            )
          );
          
        DROP POLICY IF EXISTS alertas_clinicas_insert_policy ON alertas_clinicas;
        CREATE POLICY alertas_clinicas_insert_policy ON alertas_clinicas
          FOR INSERT
          WITH CHECK (
            paciente_id IN (
              SELECT id FROM patients WHERE user_id = auth.uid()
            )
          );
          
        DROP POLICY IF EXISTS alertas_clinicas_update_policy ON alertas_clinicas;
        CREATE POLICY alertas_clinicas_update_policy ON alertas_clinicas
          FOR UPDATE
          USING (
            paciente_id IN (
              SELECT id FROM patients WHERE user_id = auth.uid()
            )
          );
      `
    });

    if (rlsError) {
      console.error('Error configurando RLS:', rlsError);
    } else {
      console.log('✅ Row Level Security configurado');
    }

    console.log('🎉 Migración completada exitosamente!');

    return NextResponse.json({
      success: true,
      message: 'Migración Ohio Youth Scales completada exitosamente',
      steps: [
        'Campo destinatario agregado a cuestionarios',
        'Campo destinatario agregado a envios_programados',
        '4 cuestionarios Ohio Youth Scales insertados',
        'Tabla alertas_clinicas creada',
        'Índices creados',
        'Row Level Security configurado'
      ]
    });

  } catch (error) {
    console.error('💥 Error durante la migración:', error);
    return NextResponse.json({
      success: false,
      error: 'Error durante la migración',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
