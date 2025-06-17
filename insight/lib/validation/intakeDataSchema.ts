import { z } from 'zod';

/**
 * Front-end replica of the Zod schema defined in
 * `app/api/patients/[pid]/evolutions/intake/route.ts`.
 * Keep this in sync when the backend schema changes so that the
 * same validation rules apply on both client and server.
 */
export const intakeDataSchema = z
  .object({
    // READ-ONLY (filled server-side or derived from context)
    fechaEntrevista: z.string().datetime().optional(),
    nombrePaciente: z.string().optional(),

    // SOCIODEMOGRÁFICOS
    edad: z.number().int().min(0).max(120),
    sexo: z.enum(['Masculino', 'Femenino', 'Otro']),
    estadoCivil: z.string(),
    ocupacion: z.string(),
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

    // DERIVED
    urgente: z.boolean().optional(),
  })
  .strict();

export type IntakeData = z.infer<typeof intakeDataSchema>;
