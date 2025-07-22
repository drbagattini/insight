// Implementación directa de scoreBrWai para testing
function scoreBrWai(answers) {
  if (answers.length !== 16) {
    throw new Error('BR-WAI requires exactly 16 answers');
  }

  // Verificar que todas las respuestas estén en el rango válido (1-5)
  for (let i = 0; i < answers.length; i++) {
    if (answers[i] < 1 || answers[i] > 5) {
      throw new Error(`Answer ${i + 1} must be between 1 and 5, got ${answers[i]}`);
    }
  }

  // Ítems inversos (posiciones 4, 8, 12, 16 → índices 3, 7, 11, 15)
  const reverseItems = [3, 7, 11, 15];
  
  // Crear copia de respuestas e invertir los ítems necesarios
  const processedAnswers = answers.map((answer, index) => {
    if (reverseItems.includes(index)) {
      // Inversión: 1→5, 2→4, 3→3, 4→2, 5→1
      return 6 - answer;
    }
    return answer;
  });

  // Ítems por subescala (índices base 0)
  const vinculoItems = [0, 2, 4, 6, 8, 10, 12, 14]; // ítems 1, 3, 5, 7, 9, 11, 13, 15
  const tareasObjetivosItems = [1, 3, 5, 7, 9, 11, 13, 15]; // ítems 2, 4, 6, 8, 10, 12, 14, 16

  // Calcular puntuaciones
  const vinculo = vinculoItems.reduce((sum, index) => sum + processedAnswers[index], 0);
  const tareasObjetivos = tareasObjetivosItems.reduce((sum, index) => sum + processedAnswers[index], 0);
  const total = vinculo + tareasObjetivos;

  // Interpretaciones
  const getInterpretacionTotal = (score) => {
    if (score <= 48) return 'Alianza frágil / riesgo de ruptura';
    if (score <= 59) return 'Alianza moderada';
    return 'Alianza sólida';
  };

  const getInterpretacionSubescala = (score) => {
    if (score <= 24) return 'Frágil';
    if (score <= 29) return 'Aceptable';
    return 'Sólida';
  };

  return {
    total,
    vinculo,
    tareasObjetivos,
    interpretacion: {
      total: getInterpretacionTotal(total),
      vinculo: getInterpretacionSubescala(vinculo),
      tareasObjetivos: getInterpretacionSubescala(tareasObjetivos)
    }
  };
}

console.log('🔍 VERIFICACIÓN DEL CÁLCULO BR-WAI');
console.log('=====================================\n');

// Datos de prueba: respuestas simuladas
const testAnswers = [
  4, // Ítem 1 (Vínculo): "Mi terapeuta y yo nos entendemos mutuamente" = 4
  5, // Ítem 2 (Tareas-Objetivos): "Hemos logrado una buena comprensión..." = 5
  4, // Ítem 3 (Vínculo): "Siento que mi terapeuta me valora" = 4
  2, // Ítem 4 (Tareas-Objetivos, INVERSO): "Creo que el tiempo... no se aprovecha" = 2 → se invierte a 4
  5, // Ítem 5 (Vínculo): "Creo que mi terapeuta me aprecia" = 5
  4, // Ítem 6 (Tareas-Objetivos): "Lo que hago en terapia me brinda..." = 4
  3, // Ítem 7 (Vínculo): "Siento que mi terapeuta se preocupa..." = 3
  1, // Ítem 8 (Tareas-Objetivos, INVERSO): "Mi terapeuta no entiende..." = 1 → se invierte a 5
  5, // Ítem 9 (Vínculo): "Confío en la capacidad de mi terapeuta" = 5
  4, // Ítem 10 (Tareas-Objetivos): "Siento que lo que hago en terapia..." = 4
  4, // Ítem 11 (Vínculo): "Mi terapeuta y yo confiamos el uno en el otro" = 4
  2, // Ítem 12 (Tareas-Objetivos, INVERSO): "No estoy de acuerdo..." = 2 → se invierte a 4
  5, // Ítem 13 (Vínculo): "Creo que mi terapeuta se preocupa genuinamente" = 5
  4, // Ítem 14 (Tareas-Objetivos): "Coincidimos en lo que es importante" = 4
  4, // Ítem 15 (Vínculo): "Mi terapeuta y yo nos respetamos" = 4
  1  // Ítem 16 (Tareas-Objetivos, INVERSO): "Las cosas que mi terapeuta me pide..." = 1 → se invierte a 5
];

console.log('📊 RESPUESTAS ORIGINALES:');
testAnswers.forEach((answer, index) => {
  const itemNum = index + 1;
  const isReverse = [4, 8, 12, 16].includes(itemNum);
  const subescala = itemNum % 2 === 1 ? 'Vínculo' : 'Tareas-Objetivos';
  console.log(`  Ítem ${itemNum} (${subescala}${isReverse ? ', INVERSO' : ''}): ${answer}`);
});

console.log('\n🔄 PROCESAMIENTO DE ÍTEMS INVERSOS:');
const reverseItems = [3, 7, 11, 15]; // índices base 0 para ítems 4, 8, 12, 16
const processedAnswers = testAnswers.map((answer, index) => {
  if (reverseItems.includes(index)) {
    const inverted = 6 - answer;
    console.log(`  Ítem ${index + 1}: ${answer} → ${inverted} (invertido)`);
    return inverted;
  }
  return answer;
});

console.log('\n📈 CÁLCULO MANUAL DE SUBESCALAS:');

// Vínculo: ítems 1, 3, 5, 7, 9, 11, 13, 15 (índices 0, 2, 4, 6, 8, 10, 12, 14)
const vinculoItems = [0, 2, 4, 6, 8, 10, 12, 14];
const vinculoScores = vinculoItems.map(i => processedAnswers[i]);
const vinculoTotal = vinculoScores.reduce((sum, score) => sum + score, 0);

console.log(`Vínculo (ítems 1,3,5,7,9,11,13,15):`);
console.log(`  Puntuaciones: [${vinculoScores.join(', ')}]`);
console.log(`  Total: ${vinculoTotal}`);

// Tareas-Objetivos: ítems 2, 4, 6, 8, 10, 12, 14, 16 (índices 1, 3, 5, 7, 9, 11, 13, 15)
const tareasObjetivosItems = [1, 3, 5, 7, 9, 11, 13, 15];
const tareasObjetivosScores = tareasObjetivosItems.map(i => processedAnswers[i]);
const tareasObjetivosTotal = tareasObjetivosScores.reduce((sum, score) => sum + score, 0);

console.log(`Tareas-Objetivos (ítems 2,4,6,8,10,12,14,16):`);
console.log(`  Puntuaciones: [${tareasObjetivosScores.join(', ')}]`);
console.log(`  Total: ${tareasObjetivosTotal}`);

const totalManual = vinculoTotal + tareasObjetivosTotal;
console.log(`\nPuntuación Total Manual: ${totalManual}`);

console.log('\n🧮 RESULTADO DE LA FUNCIÓN scoreBrWai():');
try {
  const result = scoreBrWai(testAnswers);
  console.log('Resultado:', JSON.stringify(result, null, 2));
  
  console.log('\n✅ VERIFICACIÓN:');
  console.log(`Vínculo: Manual=${vinculoTotal}, Función=${result.vinculo} ${vinculoTotal === result.vinculo ? '✓' : '✗'}`);
  console.log(`Tareas-Objetivos: Manual=${tareasObjetivosTotal}, Función=${result.tareasObjetivos} ${tareasObjetivosTotal === result.tareasObjetivos ? '✓' : '✗'}`);
  console.log(`Total: Manual=${totalManual}, Función=${result.total} ${totalManual === result.total ? '✓' : '✗'}`);
  
  console.log('\n🎯 INTERPRETACIONES:');
  console.log(`Total (${result.total}): ${result.interpretacion.total}`);
  console.log(`Vínculo (${result.vinculo}): ${result.interpretacion.vinculo}`);
  console.log(`Tareas-Objetivos (${result.tareasObjetivos}): ${result.interpretacion.tareasObjetivos}`);
  
  console.log('\n📋 RANGOS ESPERADOS:');
  console.log('Total: 16-80 puntos');
  console.log('Subescalas: 8-40 puntos cada una');
  console.log(`Resultado Total: ${result.total} (${result.total >= 16 && result.total <= 80 ? 'dentro del rango' : 'FUERA DE RANGO'})`);
  console.log(`Resultado Vínculo: ${result.vinculo} (${result.vinculo >= 8 && result.vinculo <= 40 ? 'dentro del rango' : 'FUERA DE RANGO'})`);
  console.log(`Resultado Tareas-Objetivos: ${result.tareasObjetivos} (${result.tareasObjetivos >= 8 && result.tareasObjetivos <= 40 ? 'dentro del rango' : 'FUERA DE RANGO'})`);

} catch (error) {
  console.error('❌ Error en la función:', error.message);
}

console.log('\n🔍 VERIFICACIÓN ADICIONAL CON CASOS EXTREMOS:');

// Caso 1: Todas las respuestas = 1
console.log('\n--- Caso 1: Todas las respuestas = 1 ---');
const allOnes = new Array(16).fill(1);
try {
  const result1 = scoreBrWai(allOnes);
  console.log(`Resultado con todas 1s: Total=${result1.total}, Vínculo=${result1.vinculo}, Tareas-Objetivos=${result1.tareasObjetivos}`);
  // Con ítems inversos: 4 ítems se convierten de 1 a 5
  // Vínculo tiene 2 ítems inversos (7, 15) → no, solo Tareas-Objetivos tiene inversos
  // Tareas-Objetivos tiene 4 ítems inversos (4, 8, 12, 16) → 4*5 + 4*1 = 24
  // Vínculo no tiene inversos → 8*1 = 8
  // Total esperado: 8 + 24 = 32
  console.log(`Esperado: Total=32, Vínculo=8, Tareas-Objetivos=24`);
} catch (error) {
  console.error('Error:', error.message);
}

// Caso 2: Todas las respuestas = 5
console.log('\n--- Caso 2: Todas las respuestas = 5 ---');
const allFives = new Array(16).fill(5);
try {
  const result2 = scoreBrWai(allFives);
  console.log(`Resultado con todas 5s: Total=${result2.total}, Vínculo=${result2.vinculo}, Tareas-Objetivos=${result2.tareasObjetivos}`);
  // Con ítems inversos: 4 ítems se convierten de 5 a 1
  // Vínculo no tiene inversos → 8*5 = 40
  // Tareas-Objetivos tiene 4 ítems inversos → 4*1 + 4*5 = 24
  // Total esperado: 40 + 24 = 64
  console.log(`Esperado: Total=64, Vínculo=40, Tareas-Objetivos=24`);
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n🏁 VERIFICACIÓN COMPLETADA');
