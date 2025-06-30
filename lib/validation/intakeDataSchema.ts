import { z } from 'zod';

// Helper to handle optional fields that might come as empty strings from forms
const preprocessOptionalField = (val: unknown) => val === "" || val === null ? undefined : val;

export const intakeDataSchema = z.object({
  fechaEntrevista: z.coerce.date().optional(),
  nombrePaciente: z.string().optional(),
  edad: z.preprocess(preprocessOptionalField, z.coerce.number().min(0).max(90).optional()),
  sexo: z.preprocess(preprocessOptionalField, z.enum(['Masculino', 'Femenino']).optional()),
  estadoCivil: z.preprocess(preprocessOptionalField, z.enum(['Soltero/a', 'Casado/a', 'Concubinato estable']).optional()),
  ocupacion: z.preprocess(preprocessOptionalField, z.enum(['Estudiante', 'Trabajo dependiente', 'Trabajo independiente', 'Desempleado', 'Otra']).optional()),
  grupoFamiliar: z.string().optional(),
  motivoConsulta: z.string().optional(),
  derivante: z.preprocess(preprocessOptionalField, z.enum(['Psiquiatra', 'Pediatra', 'Familia', 'Asistente social', 'Consulta espontánea']).optional()),
  presentacion: z.string().optional(),
  diagnosticoTexto: z.string().optional(),
  nivelPersonalidad: z.preprocess(preprocessOptionalField, z.enum(['Saludable', 'Neurótico', 'Borderline', 'Psicótico']).optional()),
  etiologia: z.string().optional(),
  malestarPaciente: z.preprocess(preprocessOptionalField, z.coerce.number().optional()),
  atribucionPaciente: z.preprocess(preprocessOptionalField, z.enum(['Psicológicas', 'Sociales', 'Familia', 'Trabajo', 'Biológicas', 'Otros']).optional()),
  ayudaBuscada: z.array(z.string()).optional(),
  ayudaBuscadaOtro: z.string().optional(),
  gravedadTerapeuta: z.preprocess(preprocessOptionalField, z.enum(['Ausencia', 'Leve', 'Moderada', 'Grave', 'Extrema']).optional()),
  funcionamientoGlobal: z.preprocess(preprocessOptionalField, z.coerce.number().optional()),
  apoyoSocial: z.preprocess(preprocessOptionalField, z.coerce.number().optional()),
  medicacionPrev: z.string().optional(),
  antecedentesSM: z.string().optional(),
  biologicos: z.string().optional(),
  estrategia: z.string().optional(),
  posicionTerap: z.preprocess(preprocessOptionalField, z.coerce.number().optional().nullable()),
  derivacion: z.preprocess(preprocessOptionalField, z.enum(['Sin derivaciones', 'Psiquiatra', 'Asistente social', 'Psicopedagogo', 'Pediatra', 'Neuropediatra']).optional()),
}).superRefine((data, ctx) => {
  if (data.ayudaBuscada?.includes('7') && (!data.ayudaBuscadaOtro || data.ayudaBuscadaOtro.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ayudaBuscadaOtro'],
      message: 'Debe especificar la otra ayuda buscada.',
    });
  }
});

export type IntakeData = z.infer<typeof intakeDataSchema>;

// Compatibility type for the form
export type IntakeFormValues = IntakeData;
