import { z } from 'zod';

// Definición de campos basada en la especificación
export const intakeFieldsDefinition = [
  // Step 1: Datos Personales
  { step: 1, key: 'fechaEntrevista', label: 'Fecha de la entrevista', control: 'text', options: 'readonly, auto-now' },
  { step: 1, key: 'nombrePaciente', label: 'Nombre y apellido del paciente', control: 'text', options: 'readonly' },
  { step: 1, key: 'edad', label: 'Edad', control: 'select', options: 'age-dropdown' },
  { step: 1, key: 'sexo', label: 'Sexo', control: 'select', options: ['Masculino', 'Femenino'] },
  { step: 1, key: 'estadoCivil', label: 'Estado civil', control: 'select', options: ['Soltero/a', 'Casado/a', 'Concubinato estable'] },
  { step: 1, key: 'ocupacion', label: 'Ocupación', control: 'select', options: ['Estudiante', 'Trabajo dependiente', 'Trabajo independiente', 'Desempleado', 'Otra'] },
  { step: 1, key: 'grupoFamiliar', label: 'Conformación del grupo familiar', control: 'textarea' },

  // Step 2: Motivo de Consulta
  { step: 2, key: 'motivoConsulta', label: 'Motivo de consulta', control: 'textarea' },
  { step: 2, key: 'derivante', label: 'Quién lo deriva', control: 'select', options: ['Psiquiatra', 'Pediatra', 'Familia', 'Asistente social', 'Consulta espontánea'] },
  { step: 2, key: 'presentacion', label: 'Presentación del paciente', control: 'textarea' },
  { step: 2, key: 'diagnosticoTexto', label: '¿Qué le sucede al paciente?', control: 'textarea', options: 'rows:9, placeholder:Describa aspectos diagnósticos' },
  { step: 2, key: 'nivelPersonalidad', label: 'Nivel de organización de la personalidad', control: 'select', options: ['Saludable', 'Neurótico', 'Borderline', 'Psicótico'] },
  { step: 2, key: 'etiologia', label: '¿Por qué le sucede?', control: 'textarea', options: 'rows:9, placeholder:Describa factores predisponentes, desencadenantes y perpetuadores del malestar' },

  // Step 3: Estado Actual
  { step: 3, key: 'malestarPaciente', label: 'Nivel de malestar percibido por el paciente', control: 'select', options: [{ value: '1', label: '1 - Sin malestar' }, { value: '2', label: '2 - Leve' }, { value: '3', label: '3 - Moderado' }, { value: '4', label: '4 - Severo' }, { value: '5', label: '5 - Extremo' }] },
  { step: 3, key: 'atribucionPaciente', label: '¿Cuáles son las causas de su malestar, según el paciente?', control: 'select', options: ['Psicológicas', 'Sociales', 'Familia', 'Trabajo', 'Biológicas', 'Otros'] },
  { step: 3, key: 'ayudaBuscada', label: 'Tipo de ayuda buscada por el paciente', control: 'multiselect', options: [{ value: '1', label: 'Orientación y resolución práctica' }, { value: '2', label: 'Alivio sintomático' }, { value: '3', label: 'Apoyo emocional y contención' }, { value: '4', label: 'Entenderse a sí mismo' }, { value: '5', label: 'Cambio profundo en su personalidad' }, { value: '6', label: 'No sabe qué esperar' }] },
  { step: 3, key: 'gravedadTerapeuta', label: 'Gravedad percibida por el terapeuta', control: 'select', options: ['Ausencia', 'Leve', 'Moderada', 'Grave', 'Extrema'] },
  { step: 3, key: 'funcionamientoGlobal', label: 'Funcionamiento global del paciente', control: 'select', options: [{ value: '1', label: '1 - Funcionamiento superior (sin síntomas)' }, { value: '2', label: '2 - Síntomas mínimos, buen funcionamiento' }, { value: '3', label: '3 - Reacciones transitorias y esperables' }, { value: '4', label: '4 - Síntomas leves o dificultades leves' }, { value: '5', label: '5 - Síntomas moderados o dificultades moderadas' }, { value: '6', label: '6 - Síntomas graves o deterioro grave' }, { value: '7', label: '7 - Deterioro de la realidad o comunicación' }, { value: '8', label: '8 - Influencia de delirios/alucinaciones o deterioro muy grave' }, { value: '9', label: '9 - Peligro de autolesión o daño a otros' }, { value: '10', label: '10 - Peligro persistente de daño severo o acto suicida' }, { value: '11', label: '11 - Información insuficiente' }] },
  { step: 3, key: 'apoyoSocial', label: 'Apoyo social externo', control: 'select', options: [{ value: '1', label: '1 - Inexistente' }, { value: '2', label: '2 - Muy bajo' }, { value: '3', label: '3 - Moderado' }, { value: '4', label: '4 - Bueno' }, { value: '5', label: '5 - Óptimo' }] },

  // Step 4: Antecedentes
  { step: 4, key: 'medicacionPrev', label: 'Medicación previa', control: 'textarea', placeholder: 'Indique nombre, dosis y duración' },
  { step: 4, key: 'antecedentesSM', label: 'Antecedentes personales y familiares de salud mental', control: 'textarea', placeholder: 'Describa antecedentes personales y familiares relevantes' },
  { step: 4, key: 'biologicos', label: 'Antecedentes biológicos relevantes', control: 'textarea', placeholder: 'Describa antecedentes biológicos relevantes' },

  // Step 5: Tratamiento
  { step: 5, key: 'estrategia', label: 'Estrategia terapéutica', control: 'textarea', placeholder: 'Describa los lineamientos principales de la estrategia terapéutica prevista' },
  { step: 5, key: 'posicionTerap', label: 'Posición terapéutica predominante', control: 'select', options: [{ value: '1', label: '1 → Apoyo' }, { value: '2', label: '2 → Predominantemente de apoyo' }, { value: '3', label: '3 → Mixta' }, { value: '4', label: '4 → Predominantemente interpretativa' }, { value: '5', label: '5 → Interpretativa' }] },
  { step: 5, key: 'derivacion', label: 'Derivación (a quién se deriva)', control: 'select', options: ['Sin derivaciones', 'Psiquiatra', 'Asistente social', 'Psicopedagogo', 'Pediatra', 'Neuropediatra'] },
] as const;

// Esquema de validación con Zod
export const intakeSchema = z.object({
  fechaEntrevista: z.string().optional(),
  nombrePaciente: z.string().optional(),
  edad: z.coerce.number().min(0).max(90).optional(),
  sexo: z.enum(['Masculino', 'Femenino']).optional(),
  estadoCivil: z.enum(['Soltero/a', 'Casado/a', 'Concubinato estable']).optional(),
  ocupacion: z.enum(['Estudiante', 'Trabajo dependiente', 'Trabajo independiente', 'Desempleado', 'Otra']).optional(),
  grupoFamiliar: z.string().optional(),
  motivoConsulta: z.string().optional(),
  derivante: z.enum(['Psiquiatra', 'Pediatra', 'Familia', 'Asistente social', 'Consulta espontánea']).optional(),
  presentacion: z.string().optional(),
  diagnosticoTexto: z.string().optional(),
  nivelPersonalidad: z.enum(['Saludable', 'Neurótico', 'Borderline', 'Psicótico']).optional(),
  etiologia: z.string().optional(),
  malestarPaciente: z.string().optional(),
  ayudaBuscada: z.array(z.string()).optional(),
  gravedadTerapeuta: z.enum(['Ausencia', 'Leve', 'Moderada', 'Grave', 'Extrema']).optional(),
  funcionamientoGlobal: z.string().optional(),
  apoyoSocial: z.string().optional(),
  medicacionPrev: z.string().optional(),
  antecedentesSM: z.string().optional(),
  biologicos: z.string().optional(),
  estrategia: z.string().optional(),
  posicionTerap: z.string().optional(),
  derivacion: z.enum(['Sin derivaciones', 'Psiquiatra', 'Asistente social', 'Psicopedagogo', 'Pediatra', 'Neuropediatra']).optional(),
});

export type IntakeFormValues = z.infer<typeof intakeSchema>;

// Definición de los pasos del wizard
export const WIZARD_STEPS = [
  { id: 1, name: 'Datos Personales' },
  { id: 2, name: 'Motivo de consulta y Diagnóstico' },
  { id: 3, name: 'Estado Actual' },
  { id: 4, name: 'Antecedentes' },
  { id: 5, name: 'Plan Terapéutico' },
];
