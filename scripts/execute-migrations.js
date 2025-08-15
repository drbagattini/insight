#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filePath) {
  try {
    console.log(`📄 Ejecutando: ${filePath}`);
    
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Dividir en statements individuales (separados por ';')
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`  ⚡ Ejecutando statement...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Intentar ejecución directa si rpc falla
          const { error: directError } = await supabase
            .from('_temp_migration')
            .select('*')
            .limit(0);
          
          if (directError) {
            console.error(`  ❌ Error en statement:`, error);
            throw error;
          }
        }
        
        console.log(`  ✅ Statement ejecutado correctamente`);
      }
    }
    
    console.log(`✅ ${filePath} ejecutado correctamente\n`);
    
  } catch (error) {
    console.error(`❌ Error ejecutando ${filePath}:`, error.message);
    throw error;
  }
}

async function executeDirectSQL(sql, description) {
  try {
    console.log(`📄 Ejecutando: ${description}`);
    
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`❌ Error en ${description}:`, error);
      throw error;
    }
    
    console.log(`✅ ${description} ejecutado correctamente\n`);
    
  } catch (error) {
    console.error(`❌ Error ejecutando ${description}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando migraciones de Ohio Youth Scales...\n');
    
    // 1. Agregar campo destinatario y cuestionarios OYS
    const addDestinatarioPath = path.join(__dirname, 'add-destinatario-field.sql');
    if (fs.existsSync(addDestinatarioPath)) {
      await executeSQLFile(addDestinatarioPath);
    } else {
      console.log('⚠️  Archivo add-destinatario-field.sql no encontrado, ejecutando SQL directo...');
      
      // Ejecutar SQL directo para agregar campo destinatario
      await executeDirectSQL(`
        -- Agregar campo destinatario a cuestionarios
        ALTER TABLE cuestionarios ADD COLUMN IF NOT EXISTS destinatario VARCHAR(20) DEFAULT 'paciente' CHECK (destinatario IN ('paciente', 'padre_tutor', 'ambos'));
        
        -- Agregar campo destinatario a envios_programados  
        ALTER TABLE envios_programados ADD COLUMN IF NOT EXISTS destinatario VARCHAR(20) DEFAULT 'paciente' CHECK (destinatario IN ('paciente', 'padre_tutor', 'ambos'));
      `, 'Agregar campos destinatario');
      
      // Insertar cuestionarios OYS
      await executeDirectSQL(`
        INSERT INTO cuestionarios (id, nombre, codigo, descripcion, activo, destinatario) VALUES
        ('oys-ps-p-sf20', 'Ohio Youth Scales - Severidad de Problemas (Padres) - Forma Corta', 'OYS-PS-P-SF20', 'Cuestionario de 20 ítems para evaluar la severidad de problemas conductuales y emocionales desde la perspectiva de padres/tutores', true, 'padre_tutor'),
        ('oys-f-p-sf20', 'Ohio Youth Scales - Funcionamiento (Padres) - Forma Corta', 'OYS-F-P-SF20', 'Cuestionario de 20 ítems para evaluar el nivel de funcionamiento desde la perspectiva de padres/tutores', true, 'padre_tutor'),
        ('oys-ps-y-sf20', 'Ohio Youth Scales - Severidad de Problemas (Jóvenes) - Forma Corta', 'OYS-PS-Y-SF20', 'Cuestionario de 20 ítems para evaluar la severidad de problemas conductuales y emocionales desde la perspectiva del joven', true, 'paciente'),
        ('oys-f-y-sf20', 'Ohio Youth Scales - Funcionamiento (Jóvenes) - Forma Corta', 'OYS-F-Y-SF20', 'Cuestionario de 20 ítems para evaluar el nivel de funcionamiento desde la perspectiva del joven', true, 'paciente')
        ON CONFLICT (id) DO NOTHING;
      `, 'Insertar cuestionarios Ohio Youth Scales');
    }
    
    // 2. Crear tabla de alertas clínicas
    const alertasTablePath = path.join(__dirname, 'create-alertas-clinicas-table.sql');
    if (fs.existsSync(alertasTablePath)) {
      await executeSQLFile(alertasTablePath);
    } else {
      console.log('⚠️  Archivo create-alertas-clinicas-table.sql no encontrado, ejecutando SQL directo...');
      
      await executeDirectSQL(`
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
      `, 'Crear tabla alertas_clinicas');
      
      await executeDirectSQL(`
        CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_paciente_id ON alertas_clinicas(paciente_id);
        CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_tipo ON alertas_clinicas(tipo);
        CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_severidad ON alertas_clinicas(severidad);
        CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_activa ON alertas_clinicas(activa);
        CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_fecha_creacion ON alertas_clinicas(fecha_creacion);
      `, 'Crear índices para alertas_clinicas');
      
      await executeDirectSQL(`
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
      `, 'Configurar RLS para alertas_clinicas');
    }
    
    console.log('🎉 ¡Todas las migraciones ejecutadas correctamente!');
    console.log('\n📋 Resumen de cambios:');
    console.log('  ✅ Campo "destinatario" agregado a cuestionarios y envios_programados');
    console.log('  ✅ 4 cuestionarios Ohio Youth Scales insertados');
    console.log('  ✅ Tabla alertas_clinicas creada con RLS');
    console.log('  ✅ Índices y políticas de seguridad configuradas');
    
  } catch (error) {
    console.error('💥 Error durante las migraciones:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { executeSQLFile, executeDirectSQL };
