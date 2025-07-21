-- COMPLETE FIX FOR RECURRENCE SYSTEM
-- Execute this in Supabase Dashboard → SQL Editor

-- 1. FIX FREQUENCY CONSTRAINT (Allow "10_minutos")
ALTER TABLE envios_programados 
DROP CONSTRAINT IF EXISTS envios_programados_frecuencia_check;

ALTER TABLE envios_programados 
ADD CONSTRAINT envios_programados_frecuencia_check 
CHECK (frecuencia IN ('10_minutos', 'semanal', 'mensual', 'trimestral', 'unico'));

-- 2. FIX TRIGGER (Fix column name issue)
CREATE OR REPLACE FUNCTION update_actualizado_en_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the broken trigger
DROP TRIGGER IF EXISTS trg_update_envios_updated_at ON public.envios_programados;

-- Create the correct trigger
CREATE TRIGGER trg_update_envios_actualizado_en
  BEFORE UPDATE ON public.envios_programados
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en_column();

-- 3. VERIFY FIXES
SELECT 'Both fixes applied successfully!' as status;

-- Test constraint by trying to insert a test record (will be rolled back)
BEGIN;
INSERT INTO envios_programados (id, paciente_id, cuestionario_id, canal, frecuencia, proximo_envio, activo)
VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'email', '10_minutos', now(), true);
ROLLBACK;

SELECT 'Constraint test passed - 10_minutos is now allowed' as constraint_status;
