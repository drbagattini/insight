#!/usr/bin/env node

/**
 * ANÁLISIS COMPLETO: Acceso de GPT-4o a datos de cuestionarios psicométricos
 */

console.log('🔍 ANÁLISIS DE ACCESO A CUESTIONARIOS PSICOMÉTRICOS PARA GPT-4O');
console.log('=' .repeat(70));

// Estructura de datos esperada según el código
const expectedDataStructure = {
  patient: {
    fields: ['id', 'name', 'email', 'whatsapp', 'created_at', 'metadata'],
    source: 'tabla: patients'
  },
  questionnaires: {
    fields: [
      'id', 'codigo', 'titulo', 'fecha_completado', 
      'puntuacion', 'score_detallado', 'respuestas', 'metadata'
    ],
    source: 'tabla: respuestas + cuestionarios + questionnairesMeta.ts'
  },
  intake: {
    fields: ['id', 'estado', 'datos', 'fecha_inicio', 'fecha_fin', 'created_at'],
    source: 'tabla: primeras_entrevistas'
  }
};

// Cuestionarios disponibles según metadata
const availableQuestionnaires = {
  'WHO-5': {
    title: 'Índice de Bienestar (WHO-5)',
    domain: 'Bienestar',
    items: 5,
    scoring: 'Likert 0-5, multiplicar x4 (rango 0-100)',
    thresholds: { warning: 13 },
    hasDetailedScore: false
  },
  'OPD-CA2-SQ': {
    title: 'Estructura Psíquica Adolescente (OPD-CA2-SQ)',
    domain: 'Estructura de Personalidad',
    items: 81,
    scoring: 'Likert 0-4, T-scores por dimensión',
    thresholds: { warning: 60 },
    hasDetailedScore: true,
    dimensions: ['Regulación', 'Identidad', 'Interpersonalidad', 'Apego'],
    subdimensions: 20
  },
  'BR-WAI': {
    title: 'Alianza Terapéutica (BR-WAI)',
    domain: 'Alianza Terapéutica',
    items: 16,
    scoring: 'Likert 1-5, total + 2 subescalas',
    thresholds: { warning: 48 },
    hasDetailedScore: true,
    dimensions: ['Vínculo', 'Tareas-Objetivos']
  },
  'PHQ-9': {
    title: 'Cuestionario de Salud del Paciente (PHQ-9)',
    domain: 'Depresión',
    items: 9,
    scoring: 'Likert 0-3, suma directa (rango 0-27)',
    thresholds: { warning: 10, danger: 20 },
    hasDetailedScore: true,
    riskAssessment: 'Incluye ítem de ideación suicida'
  },
  'GAD-7': {
    title: 'Trastorno de Ansiedad Generalizada (GAD-7)',
    domain: 'Ansiedad',
    items: 7,
    scoring: 'Likert 0-3, suma directa (rango 0-21)',
    thresholds: { warning: 10, danger: 15 },
    hasDetailedScore: true
  }
};

console.log('\n📊 CUESTIONARIOS DISPONIBLES EN EL SISTEMA:');
console.log('-'.repeat(50));

Object.entries(availableQuestionnaires).forEach(([code, info]) => {
  console.log(`\n🧪 ${code} - ${info.title}`);
  console.log(`   📋 Dominio: ${info.domain}`);
  console.log(`   📝 Items: ${info.items}`);
  console.log(`   📊 Scoring: ${info.scoring}`);
  console.log(`   ⚠️  Umbrales: ${JSON.stringify(info.thresholds)}`);
  console.log(`   🎯 Score detallado: ${info.hasDetailedScore ? 'SÍ' : 'NO'}`);
  
  if (info.dimensions) {
    console.log(`   📐 Dimensiones: ${info.dimensions.join(', ')}`);
  }
  
  if (info.subdimensions) {
    console.log(`   📏 Subdimensiones: ${info.subdimensions}`);
  }
  
  if (info.riskAssessment) {
    console.log(`   🚨 Evaluación de riesgo: ${info.riskAssessment}`);
  }
});

console.log('\n🔍 ESTRUCTURA DE DATOS DISPONIBLE PARA GPT-4O:');
console.log('-'.repeat(50));

Object.entries(expectedDataStructure).forEach(([section, info]) => {
  console.log(`\n📂 ${section.toUpperCase()}:`);
  console.log(`   📊 Fuente: ${info.source}`);
  console.log(`   📋 Campos: ${info.fields.join(', ')}`);
});

console.log('\n🎯 ANÁLISIS CRÍTICO PARA SUPERVISIÓN CLÍNICA:');
console.log('-'.repeat(50));

console.log(`
✅ DATOS DISPONIBLES:
   • Respuestas individuales por ítem (campo 'respuestas')
   • Puntuaciones totales (campo 'puntuacion')
   • Scores detallados con dimensiones (campo 'score_detallado')
   • Metadata de cuestionarios (interpretación, umbrales)
   • Datos de entrevista inicial (campo 'datos')
   • Información del paciente (demografía, contacto)

🎯 CAPACIDADES PARA GPT-4O:
   • Análisis cualitativo de respuestas específicas
   • Interpretación de patrones entre cuestionarios
   • Detección de alertas clínicas (umbrales)
   • Análisis dimensional (OPD-CA2-SQ, BR-WAI)
   • Evaluación de riesgo (PHQ-9 ítem 9)
   • Contextualización con datos de entrevista

⚠️  PUNTOS CRÍTICOS A VERIFICAR:
   1. ¿El endpoint /api/informes/datos/[patientId] está funcionando?
   2. ¿Los campos score_detallado están poblados correctamente?
   3. ¿Las respuestas individuales están en formato accesible?
   4. ¿La metadata se está cargando desde questionnairesMeta.ts?

🔧 RECOMENDACIONES:
   • Verificar que el endpoint de datos funcione sin errores 500
   • Confirmar que score_detallado existe en la tabla respuestas
   • Probar con un paciente real que tenga cuestionarios completados
   • Validar que GPT-4o recibe todos los campos necesarios
`);

console.log('\n✅ CONCLUSIÓN:');
console.log('El sistema tiene una estructura robusta de datos psicométricos.');
console.log('GPT-4o DEBERÍA tener acceso completo a:');
console.log('- Respuestas individuales por ítem');
console.log('- Scores totales y detallados');
console.log('- Interpretaciones clínicas');
console.log('- Datos contextuales del paciente');
console.log('\n🚨 PRÓXIMO PASO: Verificar que el endpoint funcione correctamente.');
