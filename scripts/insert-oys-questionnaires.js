#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertOYSQuestionnaires() {
  console.log('📋 Insertando cuestionarios Ohio Youth Scales...\n');
  
  const oysQuestionnaires = [
    {
      id: 'oys-ps-p-sf20',
      codigo: 'OYS-PS-P-SF20',
      titulo: 'Ohio Youth Scales - Severidad de Problemas (Padres) - Forma Corta',
      descripcion: 'Cuestionario de 20 ítems para evaluar la severidad de problemas conductuales y emocionales desde la perspectiva de padres/tutores',
      activo: true,
      destinatario: 'padre_tutor'
    },
    {
      id: 'oys-f-p-sf20',
      codigo: 'OYS-F-P-SF20',
      titulo: 'Ohio Youth Scales - Funcionamiento (Padres) - Forma Corta',
      descripcion: 'Cuestionario de 20 ítems para evaluar el nivel de funcionamiento desde la perspectiva de padres/tutores',
      activo: true,
      destinatario: 'padre_tutor'
    },
    {
      id: 'oys-ps-y-sf20',
      codigo: 'OYS-PS-Y-SF20',
      titulo: 'Ohio Youth Scales - Severidad de Problemas (Jóvenes) - Forma Corta',
      descripcion: 'Cuestionario de 20 ítems para evaluar la severidad de problemas conductuales y emocionales desde la perspectiva del joven',
      activo: true,
      destinatario: 'paciente'
    },
    {
      id: 'oys-f-y-sf20',
      codigo: 'OYS-F-Y-SF20',
      titulo: 'Ohio Youth Scales - Funcionamiento (Jóvenes) - Forma Corta',
      descripcion: 'Cuestionario de 20 ítems para evaluar el nivel de funcionamiento desde la perspectiva del joven',
      activo: true,
      destinatario: 'paciente'
    }
  ];

  try {
    // Verificar si ya existen
    const { data: existing } = await supabase
      .from('cuestionarios')
      .select('codigo')
      .in('codigo', ['OYS-PS-P-SF20', 'OYS-F-P-SF20', 'OYS-PS-Y-SF20', 'OYS-F-Y-SF20']);

    const existingCodes = existing?.map(q => q.codigo) || [];
    const newQuestionnaires = oysQuestionnaires.filter(q => !existingCodes.includes(q.codigo));

    if (newQuestionnaires.length === 0) {
      console.log('✅ Todos los cuestionarios OYS ya existen');
      return;
    }

    console.log(`📝 Insertando ${newQuestionnaires.length} cuestionarios nuevos...`);

    for (const questionnaire of newQuestionnaires) {
      console.log(`  • ${questionnaire.codigo}: ${questionnaire.titulo}`);
      
      const { error } = await supabase
        .from('cuestionarios')
        .insert(questionnaire);

      if (error) {
        console.error(`    ❌ Error: ${error.message}`);
      } else {
        console.log(`    ✅ Insertado exitosamente`);
      }
    }

    // Verificar resultado final
    console.log('\n🔍 Verificando cuestionarios insertados...');
    const { data: allQuestionnaires } = await supabase
      .from('cuestionarios')
      .select('codigo, titulo')
      .eq('activo', true)
      .order('titulo');

    console.log('\n📋 Cuestionarios activos en la base de datos:');
    allQuestionnaires?.forEach(q => {
      console.log(`  • ${q.codigo}: ${q.titulo}`);
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

async function main() {
  await insertOYSQuestionnaires();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { insertOYSQuestionnaires };
