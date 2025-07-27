-- Migración para agregar el tipo 'sintesis_evolutiva_ia' a la tabla evolucion_clinica
-- Fecha: 2025-01-27

-- Eliminar la restricción CHECK existente
ALTER TABLE public.evolucion_clinica 
DROP CONSTRAINT IF EXISTS evolucion_clinica_entry_type_check;

-- Agregar nueva restricción CHECK que incluye 'sintesis_evolutiva_ia'
ALTER TABLE public.evolucion_clinica 
ADD CONSTRAINT evolucion_clinica_entry_type_check 
CHECK (entry_type IN ('clinica', 'supervision', 'sesion', 'paciente', 'sintesis_evolutiva_ia'));

-- Verificar que la migración fue exitosa
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'evolucion_clinica_entry_type_check';
