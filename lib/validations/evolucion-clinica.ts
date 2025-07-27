import { z } from 'zod';
import { EntryType, ManualEntryType } from '@/types/evolucion-clinica';

// Validación para crear nueva entrada
export const createEvolutionEntrySchema = z.object({
  entry_type: z.enum(['clinica', 'sesion'] as const),
  content: z.string()
    .min(1, 'El contenido no puede estar vacío')
    .max(5000, 'El contenido no puede exceder 5000 caracteres')
    .trim(),
  tags: z.array(z.string().trim().min(1).max(50))
    .max(10, 'Máximo 10 tags permitidos')
    .optional()
    .default([]),
  metadata: z.record(z.any()).optional().default({}),
});

// Validación para actualizar entrada
export const updateEvolutionEntrySchema = z.object({
  content: z.string()
    .min(1, 'El contenido no puede estar vacío')
    .max(5000, 'El contenido no puede exceder 5000 caracteres')
    .trim()
    .optional(),
  tags: z.array(z.string().trim().min(1).max(50))
    .max(10, 'Máximo 10 tags permitidos')
    .optional(),
  metadata: z.record(z.any()).optional(),
});

// Validación para filtros
export const evolutionFiltersSchema = z.object({
  type: z.enum(['all', 'clinica', 'supervision', 'sesion', 'paciente'] as const).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido').optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido').optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

// Tipos inferidos
export type CreateEvolutionEntryInput = z.infer<typeof createEvolutionEntrySchema>;
export type UpdateEvolutionEntryInput = z.infer<typeof updateEvolutionEntrySchema>;
export type EvolutionFiltersInput = z.infer<typeof evolutionFiltersSchema>;

// Función helper para validar entrada
export function validateEvolutionEntry(data: unknown): CreateEvolutionEntryInput {
  return createEvolutionEntrySchema.parse(data);
}

// Función helper para validar actualización
export function validateEvolutionUpdate(data: unknown): UpdateEvolutionEntryInput {
  return updateEvolutionEntrySchema.parse(data);
}

// Función helper para validar filtros
export function validateEvolutionFilters(data: unknown): EvolutionFiltersInput {
  return evolutionFiltersSchema.parse(data);
}
