#!/usr/bin/env node

/**
 * ANÁLISIS: Estructura actual de la entrevista inicial
 */

async function analyzeIntakeStructure() {
  console.log('🔍 ANÁLISIS: Estructura de la entrevista inicial');
  console.log('=' .repeat(60));

  const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log('\n📊 Obteniendo datos de entrevista inicial...');
    
    const response = await fetch(`http://localhost:3000/api/informes/datos/${testPatientId}`);
    
    if (!response.ok) {
      console.error('❌ Error obteniendo datos:', response.status);
      return;
    }
    
    const data = await response.json();
    
    if (!data.intake) {
      console.log('❌ No hay datos de entrevista inicial');
      return;
    }
    
    console.log('\n📋 ESTRUCTURA ACTUAL:');
    console.log('   ID:', data.intake.id);
    console.log('   Estado:', data.intake.estado);
    console.log('   Fecha inicio:', data.intake.fecha_inicio);
    console.log('   Fecha fin:', data.intake.fecha_fin);
    
    if (data.intake.datos) {
      console.log('\n📊 ANÁLISIS DE DATOS:');
      console.log('   Tipo:', typeof data.intake.datos);
      console.log('   Campos disponibles:', Object.keys(data.intake.datos).length);
      
      console.log('\n📝 CAMPOS DE LA ENTREVISTA:');
      Object.entries(data.intake.datos).forEach(([key, value], index) => {
        const valueStr = typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : String(value).substring(0, 50);
        console.log(`   ${index + 1}. ${key}: ${valueStr}`);
      });
      
      // Identificar posibles secciones/modales
      const keys = Object.keys(data.intake.datos);
      const possibleSections = {
        'Datos demográficos': keys.filter(k => k.includes('edad') || k.includes('sexo') || k.includes('nombre') || k.includes('telefono')),
        'Historia clínica': keys.filter(k => k.includes('historia') || k.includes('antecedente') || k.includes('medico')),
        'Motivo de consulta': keys.filter(k => k.includes('motivo') || k.includes('consulta') || k.includes('problema')),
        'Historia familiar': keys.filter(k => k.includes('familia') || k.includes('padre') || k.includes('madre')),
        'Evaluación': keys.filter(k => k.includes('evaluacion') || k.includes('diagnostico') || k.includes('impresion'))
      };
      
      console.log('\n🏷️ POSIBLES SECCIONES IDENTIFICADAS:');
      Object.entries(possibleSections).forEach(([section, fields]) => {
        if (fields.length > 0) {
          console.log(`   📂 ${section}: ${fields.length} campos`);
          fields.forEach(field => console.log(`      - ${field}`));
        }
      });
      
      console.log('\n🎯 PROBLEMA IDENTIFICADO:');
      console.log('Los datos se envían como un objeto plano sin organización por secciones');
      console.log('GPT-4o recibe todos los campos mezclados sin contexto organizacional');
      
      console.log('\n💡 SOLUCIÓN PROPUESTA:');
      console.log('1. Agrupar campos por secciones lógicas');
      console.log('2. Crear estructura jerárquica para GPT-4o');
      console.log('3. Mantener orden de presentación clínico');
      console.log('4. Agregar contexto sobre cada sección');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

analyzeIntakeStructure();
