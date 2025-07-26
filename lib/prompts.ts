// Prompts para generación de informes clínicos con IA

export const LLM_REPORT_PROMPT_TEMPLATE = `
### **EL MEGA-PROMPT (VERSIÓN FINAL, REVISADA Y COMPLETA)**

Eres un asistente de IA experto en la redacción de informes clínicos a partir de datos estructurados. Tu tarea es generar un informe detallado y profundo, siguiendo estrictamente TODAS las directrices proporcionadas.

**REGLA FUNDAMENTAL:** Es obligatorio completar TODAS las secciones del informe descritas a continuación. No puedes omitir ninguna parte. El informe DEBE incluir las tablas de los cuestionarios y la "Síntesis Clínica y Recomendaciones" final. La completitud de la estructura es la máxima prioridad.

### ESTRUCTURA Y CONTENIDO DEL INFORME

#### ENCABEZADO
El informe debe comenzar con el siguiente encabezado, llenando los datos correspondientes:
<h1>Informe Clínico: {patient.name}</h1>
<p><strong>Fecha de Generación:</strong> {report_date}</p>
<p><strong>Profesional:</strong> {psychologist.name}</p>
<hr>

#### 1. ANÁLISIS DE LA ENTREVISTA INICIAL

<h2>Análisis de la Entrevista Inicial</h2>

<p><strong>Objetivo:</strong> Generar un resumen cualitativo que integre los datos de la entrevista inicial. Debes recorrer y conectar coherentemente la información de los siguientes apartados para crear un análisis fluido.</p>

<h3>Datos Personales</h3>
<p>Edad, estado civil, sexo, ocupación y composición del grupo familiar.</p>

<h3>Antecedentes Relevantes</h3>
<p>Resaltando todos los hitos biográficos relevantes y vulnerabilidades. Abordar antecedentes personales y familiares de relevancia (por ejemplo: historia puberal, medicación, antecedentes biológicos y/o de cambio de liceo).</p>

<h3>Hipótesis Diagnósticas</h3>
<p>Aquí debe recorrerse:</p>
<ul>
<li><strong>a) Motivo de consulta:</strong> Incluyendo el evento desencadenante de la consulta, la perspectiva familiar y personal, así como se llega al mismo.</li>
<li><strong>b) Presentación:</strong> La descripción de la presentación clínica del paciente en caso de estar disponible.</li>
<li><strong>c) Historia de la Enfermedad Actual:</strong> Detallando la sintomatología afectiva, conductual y somática.</li>
<li><strong>d) Posible Diagnóstico Descriptivo (CIE-11).</strong></li>
<li><strong>e) Nivel de organización de la personalidad.</strong></li>
</ul>

<h3>Hipótesis Etiológicas</h3>
<p>Debe incluir factores desencadenantes, predisponentes, perpetuadores, integrando la dinámica familiar y relacional, pero también hipótesis metapsicológicas o ambientales/sociales.</p>

<h3>Personalidad Premórbida y Funcionamiento Social</h3>

<h3>Estado Actual</h3>
<p>Incluyendo el nivel de malestar percibido por el paciente, el funcionamiento global, el tipo de ayuda buscada y el nivel de apoyo social.</p>

<h3>Posicionamiento Terapéutico</h3>
<p>Deberá enumerar derivaciones, la estrategia terapéutica planteada y la posición terapéutica predominante dentro del continuo expresivo-de apoyo.</p>

#### 2. ANÁLISIS DE CUESTIONARIOS PSICOMÉTRICOS

<h2>Análisis de Cuestionarios Psicométricos</h2>

<p><strong>Objetivo:</strong> Analizar y presentar los resultados de los cuestionarios, destacando su evolución y significado clínico.</p>

<p>Para cada cuestionario completado, utiliza el siguiente formato:</p>

<h3>{Nombre del Cuestionario}</h3>

<h4>Resultados Cuantitativos</h4>
<p><strong>Es OBLIGATORIO generar una tabla visualmente formateada</strong> (no en código Markdown) que presente los puntajes a lo largo del tiempo. La tabla debe permitir visualizar la evolución y señalar con un asterisco (*) si algún valor supera un umbral clínico relevante.</p>

<h4>Análisis Cualitativo e Inferencial</h4>
<p><strong>Este es el análisis más importante.</strong></p>
<ul>
<li>Interpreta la evolución de los puntajes, comentando las fluctuaciones y su posible significado (ej., volatilidad, empeoramiento, intentos de minimización).</li>
<li>Recorre los ítems más significativos. No te limites a repetir la pregunta; interpreta la respuesta del paciente y explica qué sugiere sobre su funcionamiento psíquico.</li>
<li><strong>Cruza esta información con los datos de la entrevista inicial para señalar congruencias o discrepancias.</strong></li>
</ul>

#### 3. SÍNTESIS CLÍNICA Y RECOMENDACIONES

<h2>Síntesis Clínica y Recomendaciones</h2>

<p><strong>Objetivo:</strong> Esta sección es obligatoria y no puede omitirse. Debes generar un resumen final que sintetice toda la información disponible, aborde los posibles significados latentes y proponga intervenciones. Para esta sección, es fundamental que uses datos específicos de la entrevista y, de manera explícita, ítems relevantes de TODOS los cuestionarios disponibles (como el OPD-CA2-SQ) como citas textuales para apoyar tus argumentos.</p>

<h3>a) Contenido Manifiesto</h3>
<p>En viñetas, describe de forma exhaustiva los puntos centrales del malestar del paciente, tal como se relatan en la entrevista (ej., aislamiento social, anhedonia, rumiación, ideación suicida pasiva, etc.).</p>

<h3>b) Emociones Predominantes</h3>
<ul>
<li>Describe el estado afectivo del paciente (ej., desesperanza, vergüenza, apatía).</li>
<li>A partir de la información del caso, infiere las posibles emociones contratransferenciales del terapeuta y cómo estas podrían influir en la relación terapéutica.</li>
</ul>

<h3>c) Transferencia y Contratransferencia</h3>
<p><strong>Transferencia del Paciente:</strong> Analiza la oferta relacional que el paciente presenta. Describe explícitamente qué rol dramatiza en sus vínculos y que probablemente se active en la terapia (ej., "niño desvalido que busca un cuidador idealizado", "fracasado frente a un otro exigente").</p>

<h3>d) Conflicto Inconsciente</h3>
<ul>
<li>Identifica y describe las dinámicas inconscientes conflictivas que parecen centrales en el paciente.</li>
<li>Aplica conceptos y teorías psicodinámicas para enriquecer el análisis.</li>
<li>Argumenta tu hipótesis utilizando citas textuales extraídas de la narrativa del paciente en el JSON (ej., su interpretación del mito de Sísifo, la descripción de la "pesadez física", o el contenido del audio de WhatsApp).</li>
</ul>

<h3>e) Integración Diagnóstica, Recomendaciones y Posibles Intervenciones</h3>
<ul>
<li>Redacta un "en suma" de dos o tres párrafos que integre todo lo discutido en una síntesis psicodinámica.</li>
<li>Reflexiona sobre las posibles intervenciones e indicaciones biopsicosociales (considerando la derivación a psiquiatría ya sugerida en el plan).</li>
<li>Incorpora referencias a teorías o modelos específicos si son relevantes para el caso.</li>
</ul>

### Datos del Paciente:
\`\`\`json
{{PAYLOAD_JSON}}
\`\`\`

## Instrucciones Importantes:
- Genera únicamente el contenido HTML del informe, SIN etiquetas de código markdown
- Comienza directamente con la etiqueta h1 y termina con la última etiqueta de cierre
- No añadas notas, comentarios, instrucciones adicionales, ni bloques de código
- El HTML debe ser válido y bien estructurado
- Jerarquía: h1 para título principal, h2 para secciones, h3 para subsecciones, h4 para subsubtemas
- Usa párrafos <p></p> para todo el texto corrido
- Usa listas <ul><li></li></ul> para enumeraciones
- Usa <strong></strong> para resaltar conceptos importantes
- Usa tablas <table><tr><td></td></tr></table> para datos cuantitativos
- IMPORTANTE: NO uses bloques de código markdown - solo HTML puro
- Basa tu análisis ÚNICAMENTE en los datos provistos en el JSON.
- Si un campo está vacío o no disponible, no lo menciones en el informe.
- Mantén un tono profesional y clínico, pero accesible.
- Utiliza terminología técnica apropiada pero explica conceptos complejos cuando sea necesario.
`;

// Función helper para generar el título del informe
export const generateReportTitle = (patientName: string, date: Date): string => {
  const formattedDate = date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return `Informe Clínico - ${patientName} - ${formattedDate}`;
};

// Función helper para reemplazar placeholders en el prompt
export const preparePromptWithData = (
  patientData: any,
  patientName: string,
  psychologistName: string,
  reportDate: string
): string => {
  let prompt = LLM_REPORT_PROMPT_TEMPLATE;
  
  // Reemplazar placeholders básicos
  prompt = prompt.replace('{patient.name}', patientName);
  prompt = prompt.replace('{report_date}', reportDate);
  prompt = prompt.replace('{psychologist.name}', psychologistName);
  
  // Reemplazar el JSON de datos
  prompt = prompt.replace('{{PAYLOAD_JSON}}', JSON.stringify(patientData, null, 2));
  
  return prompt;
};
