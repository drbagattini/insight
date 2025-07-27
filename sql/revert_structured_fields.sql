-- REVERTIR: Quitar campos estructurados que no se necesitan
-- Volver a la estructura original que ya funcionaba perfectamente

BEGIN;

-- Eliminar campos estructurados que agregué incorrectamente
ALTER TABLE public.evolucion_clinica 
DROP COLUMN IF EXISTS session_duration_minutes,
DROP COLUMN IF EXISTS mood_scale,
DROP COLUMN IF EXISTS anxiety_scale,
DROP COLUMN IF EXISTS energy_scale,
DROP COLUMN IF EXISTS progress_rating,
DROP COLUMN IF EXISTS session_type,
DROP COLUMN IF EXISTS primary_focus,
DROP COLUMN IF EXISTS risk_level;

-- Eliminar índices que ya no son necesarios
DROP INDEX IF EXISTS idx_evolucion_mood_scale;
DROP INDEX IF EXISTS idx_evolucion_anxiety_scale;
DROP INDEX IF EXISTS idx_evolucion_progress_rating;
DROP INDEX IF EXISTS idx_evolucion_session_type;
DROP INDEX IF EXISTS idx_evolucion_risk_level;
DROP INDEX IF EXISTS idx_evolucion_patient_mood_time;
DROP INDEX IF EXISTS idx_evolucion_patient_anxiety_time;
DROP INDEX IF EXISTS idx_evolucion_patient_progress_time;

-- Verificar que la tabla volvió a su estructura original
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'evolucion_clinica'
ORDER BY ordinal_position;

COMMIT;

-- Confirmación
SELECT 'Estructura revertida: evolucion_clinica volvió a su estado original' as status;
