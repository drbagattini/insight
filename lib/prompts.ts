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

#### 1. ANÁLISIS DE LA ENTREVISTA INICIAL

<h2>Análisis de la Entrevista Inicial</h2>

<p><strong>Objetivo:</strong> Generar un resumen cualitativo que integre los datos de la entrevista inicial. Debes recorrer y conectar coherentemente la información de los siguientes apartados para crear un análisis fluido.</p>

<h3>Datos Personales</h3>
<p>Edad, estado civil, sexo, ocupación y composición del grupo familiar.</p>

<h3>Antecedentes Relevantes</h3>
<p>Resaltando todos los hitos biográficos relevantes y vulnerabilidades. Abordar antecedentes personales y familiares de relevancia (por ejemplo: historia puberal, medicación, antecedentes biológicos y/o de cambio de liceo).</p>

<h3>Cuadro Clínico e Hipótesis Diagnósticas</h3>
<h4>a) Motivo de consulta</h4>
<p>Incluyendo el evento desencadenante de la consulta, la perspectiva familiar y personal, así como se llega al mismo.</p>

<h4>b) Presentación</h4>
<p>La descripción de la presentación clínica del paciente en caso de estar disponible.</p>

<h4>c) Historia de la Enfermedad Actual</h4>
<p>Detallando la sintomatología afectiva, conductual y somática.</p>

<h4>d) Posible Diagnóstico Descriptivo (CIE-11)</h4>

<h4>e) Nivel de organización de la personalidad</h4>

<h3>Análisis Etiológico</h3>
<p>Debe incluir factores desencadenantes, predisponentes, perpetuadores, integrando la dinámica familiar y relacional, pero también hipótesis metapsicológicas o ambientales/sociales.</p>

<h3>Funcionamiento Previo</h3>

<h3>Nivel de Afectación Actual</h3>
<p>Incluyendo el nivel de malestar percibido por el paciente, el funcionamiento global, el tipo de ayuda buscada y el nivel de apoyo social.</p>

<h3>Plan de Intervención</h3>
<p>Deberá enumerar derivaciones, la estrategia terapéutica planteada y la posición terapéutica predominante dentro del continuo expresivo-de apoyo.</p>

**2. ANÁLISIS DE CUESTIONARIOS PSICOMÉTRICOS**
(Debe seguir la "Filosofía y Voz" descrita, aplicando el principio de triangulación)

<h2>Análisis de Cuestionarios Psicométricos</h2>

Para cada cuestionario completado, utiliza el siguiente formato:

<h3>{Nombre del Cuestionario}</h3>

<h4>Resultados Cuantitativos</h4>
<p>Es OBLIGATORIO generar una tabla visualmente formateada (no en código Markdown) que presente los puntajes a lo largo del tiempo. La tabla debe permitir visualizar la evolución y señalar con un asterisco (*) si algún valor supera un umbral clínico relevante.</p>

<h4>Análisis Cualitativo e Inferencial</h4>
<p>Este es el análisis más importante.</p>
<ul>
<li>Interpreta la evolución de los puntajes, comentando las fluctuaciones y su posible significado (ej., volatilidad, empeoramiento, intentos de minimización).</li>
<li>Recorre los ítems más significativos. No te limites a repetir la pregunta; interpreta la respuesta del paciente y explica qué sugiere sobre su funcionamiento psíquico, tratando el texto del ítem como un dato cualitativo en sí mismo.</li>
<li><strong>ESPECIAL para OPD-CA2-SQ:</strong> Utiliza TANTO las subescalas con T-scores (ej., "Regulación de la Autoestima T=68", "Base Segura Interna T=67") COMO ítems individuales específicos de los 81 ítems que sean clínicamente relevantes. Las subescalas proporcionan el marco cuantitativo, mientras que los ítems individuales ofrecen la riqueza cualitativa del funcionamiento psíquico del paciente.</li>
<li>Cruza esta información con los datos de la entrevista inicial para señalar congruencias o discrepancias.</li>
</ul>

**3. FORMULACIÓN CLÍNICA INTEGRADA**
(Esta sección es la culminación de la "Filosofía y Voz", donde los "ejes centrales" deben ser más evidentes que nunca)

<h2>Formulación Clínica Integrada</h2>

<p><strong>Objetivo:</strong> Esta sección final y obligatoria debe integrar todo el material anterior en una comprensión profunda del caso y un plan de acción claro, siguiendo la estructura de subtítulos que se detalla a continuación. <strong>Para el OPD-CA2-SQ específicamente:</strong> utiliza tanto las subescalas con T-scores (ej., "Regulación de la Autoestima T=68") como ítems individuales relevantes de los 81 ítems para enriquecer y dar profundidad a tu argumento, evitando que las referencias se sientan como simples citas o listas.</p>

<h3>a) Formulación Comprensiva del Caso</h3>
<p>Bajo este subtítulo, debes desarrollar la valoración clínica final. Integra los siguientes análisis en una prosa fluida y coherente, culminando en un párrafo de "en suma" que funcione como la formulación psicodinámica central.</p>

<h4>Contenido Manifiesto</h4>
<p>En viñetas, describe de forma exhaustiva los puntos centrales del malestar del paciente, tal como se relatan en la entrevista (ej., aislamiento social, anhedonia, rumiación, ideación suicida pasiva, etc.).</p>

<h4>Emociones Predominantes</h4>
<p>Describe el estado afectivo del paciente (ej., desesperanza, vergüenza, apatía). A partir de la información del caso, infiere las posibles emociones contratransferenciales del terapeuta y cómo estas podrían influir en la relación terapéutica.</p>

<h4>Transferencia</h4>
<p>Analiza la oferta relacional que el paciente presenta. Describe explícitamente qué rol dramatiza en sus vínculos y que probablemente se active en la terapia (ej., "niño desvalido que busca un cuidador idealizado", "fracasado frente a un otro exigente").</p>

<h4>Conflicto Inconsciente</h4>
<p>Identifica y describe las dinámicas inconscientes conflictivas que parecen centrales en el paciente. Aplica conceptos y teorías psicodinámicas para enriquecer el análisis y argumenta tu hipótesis utilizando citas textuales.</p>

<h4>Párrafo de "En Suma"</h4>
<p>Redacta uno o dos párrafos que desarrollen la formulación psicodinámica integrada del caso, conectando los hallazgos en una narrativa cohesiva.</p>

<h3>b) Plan de Intervención</h3>
<p>Bajo este subtítulo, presenta las recomendaciones prácticas en formato de lista. Deben ser claras, accionables y estar fundamentadas en el análisis anterior.</p>
<ul>
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
