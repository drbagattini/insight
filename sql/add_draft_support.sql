-- Agregar soporte para borradores en la tabla evolucion_clinica
-- Ejecutar este script en Supabase SQL Editor

-- Agregar columna is_draft
ALTER TABLE public.evolucion_clinica 
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;

-- Agregar comentario a la columna
COMMENT ON COLUMN public.evolucion_clinica.is_draft IS 'Indica si la entrada es un borrador (true) o está finalizada (false)';

-- Crear índice para consultas de borradores
CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_is_draft 
ON public.evolucion_clinica(is_draft);

-- Crear índice compuesto para consultas por paciente y estado de borrador
CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_patient_draft 
ON public.evolucion_clinica(paciente_id, is_draft, created_at DESC);

-- Actualizar el trigger de updated_at para incluir cambios en is_draft
-- (El trigger ya existe, solo verificamos que funcione correctamente)

-- Verificar que todas las entradas existentes estén marcadas como finalizadas
UPDATE public.evolucion_clinica 
SET is_draft = FALSE 
WHERE is_draft IS NULL;
