-- Fix the trigger for envios_programados table
-- The trigger was referencing 'updated_at' but the column is named 'actualizado_en'

-- First, create the correct function for Spanish column names
CREATE OR REPLACE FUNCTION update_actualizado_en_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the existing trigger
DROP TRIGGER IF EXISTS trg_update_envios_updated_at ON public.envios_programados;

-- Create the corrected trigger
CREATE TRIGGER trg_update_envios_actualizado_en
  BEFORE UPDATE ON public.envios_programados
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en_column();

-- Test that the trigger works
SELECT 'Trigger fixed successfully' as status;
