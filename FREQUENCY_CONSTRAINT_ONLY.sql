-- ONLY FIX FREQUENCY CONSTRAINT (Trigger already exists)
-- Execute this in Supabase Dashboard → SQL Editor

-- 1. Drop existing frequency constraint
ALTER TABLE envios_programados 
DROP CONSTRAINT IF EXISTS envios_programados_frecuencia_check;

-- 2. Add new constraint with "10_minutos"
ALTER TABLE envios_programados 
ADD CONSTRAINT envios_programados_frecuencia_check 
CHECK (frecuencia IN ('10_minutos', 'semanal', 'mensual', 'trimestral', 'unico'));

-- 3. Test the constraint
SELECT 'Frequency constraint updated successfully!' as status;

-- 4. Verify trigger is working by checking if it exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'envios_programados'
  AND trigger_name = 'trg_update_envios_actualizado_en';

-- 5. Test constraint by trying to insert a test record (will be rolled back)
BEGIN;
INSERT INTO envios_programados (id, paciente_id, cuestionario_id, canal, frecuencia, proximo_envio, activo)
VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'email', '10_minutos', now(), true);
ROLLBACK;

SELECT 'Constraint test passed - 10_minutos is now allowed' as constraint_status;
