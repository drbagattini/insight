import { z } from 'zod';

/**
 * Zod schema for validating the JSON `data` payload corresponding to the 26 intake fields.
 * We explicitly validate the numeric / enum constrained fields and allow the rest as strings.
 * NOTE: The UI wizard must conform to this exact schema – keep keys in sync!
 */
export const intakeDataSchema = z.object({
  // READ-ONLY FIELDS (filled by backend / UI for display only)
  fechaEntrevista: z.string().datetime().optional(),
  nombrePaciente: z.string().optional(),

  // SOCIODEMOGRÁFICOS
  edad: z.number().int().min(0).max(120),
  sexo: z.enum(['Masculino', 'Femenino', 'Otro']),
  estadoCivil: z.string(),
  ocupacion: z.string(),

  // NÚCLEO FAMILIAR
  grupoFamiliar: z.string().optional(),
  conviveCon: z.string().optional(),

  // MOTIVO & CANAL
  motivoConsulta: z.string().optional(),
  derivante: z.string().optional(),

  // FORMULACIÓN INICIAL
  presentacion: z.string().optional(),
  diagnosticoTexto: z.string().optional(),
  diagnosticoCodigo: z.string().optional(),
  nivelPersonalidad: z.string().optional(),
  etiologia: z.string().optional(),

  // EVALUACIÓN ACTUAL
  malestarPaciente: z.number().min(1).max(5),
  atribucionPaciente: z.string().optional(),
  ayudaEsperada: z.array(z.string()).optional(),
  ayudaOtros: z.string().optional(),
  gravedadTerapeuta: z.enum(['Ausencia', 'Leve', 'Moderada', 'Grave', 'Extrema']),
  gaf: z.number().min(1).max(10),
  apoyoSocial: z.number().min(1).max(5),

  // ANTECEDENTES
  duracionTratPrevio: z.string().optional(),
  medicacionPrev: z.string().optional(),
  antecedentesSM: z.string().optional(),
  biologicos: z.string().optional(),

  // PLAN TERAPÉUTICO
  estrategia: z.string().optional(),
  posicionTerap: z.number().min(1).max(5),
}).strict();

// Helper to compute the `urgente` flag.
export function computeUrgente(data: z.infer<typeof intakeDataSchema>): boolean {
  return (
    (data.gravedadTerapeuta === 'Grave' || data.gravedadTerapeuta === 'Extrema') &&
    data.apoyoSocial <= 2
  );
}
