/**
 * SCRIPT DE DIAGNÓSTICO COMPLETO PARA SUPERVISIÓN CLÍNICA
 * 
 * Ejecuta el diagnóstico completo sin necesidad de autenticación web
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Debug - Variables disponibles:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY:', !!process.env.SUPABASE_SERVICE_KEY);
console.log('SUPABASE_URL:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', !!process.env.SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  console.error('supabaseUrl:', supabaseUrl);
  console.error('supabaseServiceKey length:', supabaseServiceKey?.length);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDiagnosis() {
  console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DE SUPERVISIÓN CLÍNICA');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();

  try {
    // 1. VERIFICAR CONFIGURACIÓN DE GEMINI
    console.log('\n1️⃣ VERIFICANDO CONFIGURACIÓN DE GEMINI...');
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const hasGeminiKey = !!geminiApiKey;
    const geminiKeyLength = geminiApiKey?.length || 0;
    
    console.log(`   ✓ API Key presente: ${hasGeminiKey}`);
    console.log(`   ✓ Longitud de key: ${geminiKeyLength} caracteres`);

    if (!hasGeminiKey) {
      console.log('   ❌ CRÍTICO: No se encontró GEMINI_API_KEY');
      return;
    }

    // 2. BUSCAR PACIENTE DE PRUEBA
    console.log('\n2️⃣ BUSCANDO PACIENTE DE PRUEBA...');
    
    // Primero verificar qué tablas existen
    console.log('   🔍 Verificando esquema de base de datos...');
    
    // Intentar diferentes nombres de tabla
    let patients = null;
    let patientsError = null;
    let tableName = null;
    
    const possibleTables = ['pacientes', 'patients', 'patient', 'usuarios', 'users'];
    
    for (const table of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (!error) {
          console.log(`   ✓ Tabla encontrada: ${table}`);
          tableName = table;
          
          // Ahora obtener datos completos
          const { data: fullData, error: fullError } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          patients = fullData;
          patientsError = fullError;
          break;
        }
      } catch (e) {
        // Continuar con la siguiente tabla
      }
    }

    if (patientsError || !patients || patients.length === 0) {
      console.log('   ❌ No se encontraron pacientes:', patientsError?.message);
      return;
    }

    const testPatient = patients[0];
    console.log(`   ✓ Paciente de prueba: ${testPatient.nombre} (ID: ${testPatient.id})`);

    // 3. CARGAR DATOS DEL PACIENTE
    console.log('\n3️⃣ CARGANDO DATOS DEL PACIENTE...');
    const dataStartTime = Date.now();

    // Cargar datos básicos
    const { data: patientData, error: patientError } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', testPatient.id)
      .single();

    // Cargar cuestionarios
    const { data: questionnaires, error: questionnairesError } = await supabase
      .from('resultados_cuestionarios')
      .select(`
        *,
        cuestionarios(codigo, titulo)
      `)
      .eq('paciente_id', testPatient.id);

    // Cargar evoluciones
    const { data: evolutions, error: evolutionsError } = await supabase
      .from('evolucion_clinica')
      .select('*')
      .eq('paciente_id', testPatient.id);

    const dataLoadTime = Date.now() - dataStartTime;
    console.log(`   ✓ Datos cargados en: ${dataLoadTime}ms`);
    console.log(`   ✓ Cuestionarios: ${questionnaires?.length || 0}`);
    console.log(`   ✓ Evoluciones: ${evolutions?.length || 0}`);

    if (patientError) {
      console.log(`   ⚠️ Error cargando paciente: ${patientError.message}`);
    }
    if (questionnairesError) {
      console.log(`   ⚠️ Error cargando cuestionarios: ${questionnairesError.message}`);
    }
    if (evolutionsError) {
      console.log(`   ⚠️ Error cargando evoluciones: ${evolutionsError.message}`);
    }

    // 4. ANALIZAR ESTRUCTURA DE DATOS
    console.log('\n4️⃣ ANALIZANDO ESTRUCTURA DE DATOS...');
    
    const fullPatientData = {
      patient: patientData,
      cuestionarios: questionnaires,
      evoluciones: evolutions
    };

    const dataSize = JSON.stringify(fullPatientData).length;
    console.log(`   ✓ Tamaño total de datos: ${dataSize} caracteres`);

    // Analizar cuestionarios detalladamente
    if (questionnaires && questionnaires.length > 0) {
      console.log('\n   📋 ANÁLISIS DE CUESTIONARIOS:');
      questionnaires.forEach((q, index) => {
        const hasDetailedData = !!(q.score_detallado || q.respuestas || q.metadata);
        const qSize = JSON.stringify(q).length;
        console.log(`      ${index + 1}. ${q.cuestionarios?.titulo || q.codigo}`);
        console.log(`         - Datos detallados: ${hasDetailedData ? '✓' : '❌'}`);
        console.log(`         - Tamaño: ${qSize} chars`);
        console.log(`         - Respuestas: ${q.respuestas?.length || 0} items`);
        console.log(`         - Metadata items: ${q.metadata?.items?.length || 0}`);
      });
    }

    // 5. SIMULAR CONSTRUCCIÓN DEL PROMPT
    console.log('\n5️⃣ SIMULANDO CONSTRUCCIÓN DEL PROMPT...');
    const promptStartTime = Date.now();

    const systemPrompt = `**1. ROL Y OBJETIVO PRINCIPAL**

Eres un Supervisor Clínico Colaborativo. Tu persona es la de un psicólogo senior, experimentado y cálido, con un profundo conocimiento en **psicología clínica y psicoterapia**. Tu objetivo principal es facilitar un diálogo socrático, iterativo y colaborativo, ayudando al terapeuta a construir, paso a paso, nuevos insights sobre el paciente.

* **Idioma:** Español (profesional, cercano y colaborativo).
* **Estilo:** Conversacional, empático, reflexivo y orientado a la construcción conjunta de conocimiento.

**2. METODOLOGÍA DE SUPERVISIÓN**

* **Enfoque Socrático:** No des respuestas directas. En su lugar, formula preguntas reflexivas que guíen al terapeuta hacia sus propios insights.
* **Construcción Iterativa:** Cada intercambio debe construir sobre el anterior, profundizando progresivamente en la comprensión del caso.
* **Colaboración Activa:** Actúa como un colega experimentado que acompaña el proceso de reflexión, no como una autoridad que dicta conclusiones.

**Ejemplo Maestro de Interacción:** Esta es la demostración perfecta del ritmo de "ping-pong" y del estilo de lenguaje que debes seguir.

    * **Input del Usuario:** "Me gustaría poder entender algo que siento en mi contratransferencia con este paciente"
    * **Tu Respuesta Ideal:**
        *"Me parece muy valioso que puedas registrar y querer explorar lo que te pasa con este paciente. ¿Podrías contarme un poco más sobre qué es específicamente lo que sientes? ¿Hay alguna emoción o reacción particular que te llame la atención?"*

* **Directiva Prioritaria:** Tu objetivo principal es emular el ritmo y el lenguaje del **'Ejemplo Maestro'**. Este estilo conversacional, claro y enfocado, **tiene prioridad sobre la exhaustividad de tu análisis en una sola respuesta.**

* **Metodología Socrática:** Cada intervención debe terminar con una pregunta abierta, específica y reflexiva.

* **Tono Profesional:** Mantén un estilo directo, cálido, empático y práctico, como un supervisor senior experimentado.

**3. BASE DE CONOCIMIENTO Y USO DE DATOS**

Tienes acceso completo a toda la información del paciente, incluyendo datos de intake, resultados de cuestionarios, evoluciones clínicas y cualquier otro dato relevante. **Usa esta información de manera estratégica y contextual.**

**Uso Cualitativo de Datos Cuantitativos:**

> **No te limites a citar el puntaje final de un cuestionario. Puedes y debes referirte a respuestas específicas o a ítems individuales, especialmente aquellos que puntúan alto o indican una afirmación significativa por parte del paciente. Trata estas respuestas como si fueran citas directas, un dato cualitativo valioso que puede iluminar o dar textura a una hipótesis.**

**Ejemplo de Uso Menos Potente (solo puntaje):**
*"Su alta puntuación en el PHQ-9 indica una sintomatología depresiva significativa."*

**Ejemplo de Uso Más Potente (uso cualitativo del ítem):**
*"El hecho de que en el PHQ-9 haya marcado 'Casi todos los días' en el ítem sobre 'sentirse mal consigo mismo o como un fracaso' nos da una ventana directa a la intensidad de su autocrítica, más allá del puntaje total."*

* **Inicio (Saludo Personalizado):**
    Tu primer mensaje debe ser siempre: **"Hola [Nombre del Profesional], he leído toda la información acerca de [Nombre del Paciente]. ¿Qué te interesa explorar ahora?"**.
* **Desarrollo (Diálogo Orgánico):**
    El desarrollo es un ciclo de "dar y recibir", emulando el ritmo y estilo del **Ejemplo Maestro**. Presentas una reflexión enfocada y anclada, haces una pregunta, y la respuesta del terapeuta te da la pauta para tu siguiente intervención.

**5. ENTREGABLE FINAL: SÍNTESIS DE SUPERVISIÓN**

Al final de cada sesión de supervisión, cuando el terapeuta lo solicite o cuando consideres que se ha alcanzado un punto de cierre natural, debes generar una **Síntesis de Supervisión** que incluya:

1. **Puntos Clave Explorados:** Resumen de los temas principales abordados
2. **Insights Desarrollados:** Nuevas comprensiones que emergieron durante la conversación
3. **Preguntas Pendientes:** Aspectos que quedaron abiertos para futuras exploraciones
4. **Recomendaciones de Acción:** Sugerencias concretas para el trabajo terapéutico

Esta síntesis debe ser concisa, práctica y orientada a la acción, manteniendo el tono colaborativo y reflexivo que caracteriza toda la supervisión.`;

    const patientContext = JSON.stringify(fullPatientData, null, 2);
    const testMessage = "Hola, me gustaría explorar la contratransferencia con este paciente";
    
    const fullPrompt = [
      systemPrompt,
      '',
      `**DATOS DEL PACIENTE:**`,
      patientContext,
      '',
      `**CONVERSACIÓN:**`,
      `Usuario: ${testMessage}`
    ].join('\n\n');

    const promptTime = Date.now() - promptStartTime;
    
    console.log(`   ✓ Prompt construido en: ${promptTime}ms`);
    console.log(`   ✓ Tamaño del prompt: ${fullPrompt.length} caracteres`);
    console.log(`   ✓ Tokens estimados: ${Math.ceil(fullPrompt.length / 4)}`);
    console.log(`   ✓ Dentro de límites (50K): ${fullPrompt.length <= 50000 ? '✓' : '❌'}`);
    
    if (fullPrompt.length > 50000) {
      console.log(`   ⚠️ Prompt será truncado a 50,000 caracteres`);
    }

    // 6. PROBAR CONECTIVIDAD CON GEMINI
    console.log('\n6️⃣ PROBANDO CONECTIVIDAD CON GEMINI...');
    const geminiStartTime = Date.now();

    try {
      const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Responde solo: 'Conectividad OK'"
            }]
          }],
          generationConfig: {
            temperature: 0.5,
            topK: 40,
            topP: 0.8,
            maxOutputTokens: 10
          }
        })
      });

      const geminiTime = Date.now() - geminiStartTime;
      console.log(`   ✓ Tiempo de respuesta: ${geminiTime}ms`);
      console.log(`   ✓ Status: ${testResponse.status} ${testResponse.statusText}`);

      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log(`   ✓ Respuesta válida: ${!!testData.candidates}`);
        
        if (testData.candidates && testData.candidates.length > 0) {
          const responseText = testData.candidates[0]?.content?.parts?.[0]?.text;
          console.log(`   ✓ Texto de respuesta: "${responseText}"`);
        } else {
          console.log(`   ❌ No se encontraron candidates en la respuesta`);
          console.log(`   📄 Respuesta completa:`, JSON.stringify(testData, null, 2));
        }
      } else {
        const errorText = await testResponse.text();
        console.log(`   ❌ Error de API: ${errorText}`);
      }

    } catch (geminiError) {
      console.log(`   ❌ Error de conectividad: ${geminiError.message}`);
    }

    // 7. IDENTIFICAR CUELLOS DE BOTELLA
    console.log('\n7️⃣ IDENTIFICANDO CUELLOS DE BOTELLA...');
    
    const bottlenecks = [];
    
    if (dataLoadTime > 2000) {
      bottlenecks.push(`❌ CRÍTICO: Carga de datos muy lenta (${dataLoadTime}ms)`);
    } else if (dataLoadTime > 1000) {
      bottlenecks.push(`⚠️ MEDIO: Carga de datos lenta (${dataLoadTime}ms)`);
    }

    if (fullPrompt.length > 40000) {
      bottlenecks.push(`⚠️ MEDIO: Prompt muy grande (${fullPrompt.length} chars)`);
    }

    if (dataSize > 100000) {
      bottlenecks.push(`⚠️ MEDIO: Datos del paciente muy grandes (${dataSize} chars)`);
    }

    if (bottlenecks.length === 0) {
      console.log('   ✅ No se detectaron cuellos de botella obvios');
    } else {
      console.log('   🚨 CUELLOS DE BOTELLA DETECTADOS:');
      bottlenecks.forEach(bottleneck => {
        console.log(`      ${bottleneck}`);
      });
    }

    // 8. RESUMEN FINAL
    const totalTime = Date.now() - startTime;
    console.log('\n' + '='.repeat(60));
    console.log('🏁 RESUMEN DEL DIAGNÓSTICO');
    console.log('='.repeat(60));
    console.log(`⏱️  Tiempo total: ${totalTime}ms`);
    console.log(`🔑 API Key Gemini: ${hasGeminiKey ? '✅' : '❌'}`);
    console.log(`📊 Carga de datos: ${dataLoadTime}ms`);
    console.log(`📝 Construcción prompt: ${promptTime}ms`);
    console.log(`🤖 Test Gemini: ${Date.now() - geminiStartTime}ms`);
    console.log(`📏 Tamaño prompt: ${fullPrompt.length} chars`);
    console.log(`🎯 Cuellos de botella: ${bottlenecks.length}`);

    console.log('\n💡 RECOMENDACIONES:');
    if (dataLoadTime > 1500) {
      console.log('   🔧 Optimizar consultas de base de datos');
      console.log('   🔧 Agregar índices a tablas relevantes');
      console.log('   🔧 Considerar caché de datos del paciente');
    }
    
    if (fullPrompt.length > 35000) {
      console.log('   🔧 Filtrar datos menos relevantes del paciente');
      console.log('   🔧 Incluir solo cuestionarios recientes');
    }
    
    if (bottlenecks.length === 0) {
      console.log('   ✅ Sistema parece estar bien configurado');
      console.log('   ✅ Probar con llamada real de supervisión');
    }

  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error.message);
    console.error(error.stack);
  }
}

// Ejecutar diagnóstico
runDiagnosis().then(() => {
  console.log('\n🔍 Diagnóstico completo finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
