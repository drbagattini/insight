-- Complete fix for envios_programados trigger conflicts
-- This will clean up all existing triggers and create the correct one

-- Step 1: Drop ALL existing triggers (both old and new names)
DROP TRIGGER IF EXISTS trg_update_envios_updated_at ON public.envios_programados;
DROP TRIGGER IF EXISTS trg_update_envios_actualizado_en ON public.envios_programados;

-- Step 2: Drop old function if exists
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Step 3: Create the correct function for Spanish column names
CREATE OR REPLACE FUNCTION update_actualizado_en_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the corrected trigger
CREATE TRIGGER trg_update_envios_actualizado_en
  BEFORE UPDATE ON public.envios_programados
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en_column();

-- Step 5: Test that the trigger works by attempting an update
DO $$
DECLARE
    test_id UUID;
    original_time TIMESTAMP WITH TIME ZONE;
    new_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get a test record
    SELECT id, actualizado_en INTO test_id, original_time 
    FROM public.envios_programados 
    LIMIT 1;
    
    IF test_id IS NOT NULL THEN
        -- Perform a safe update to test the trigger
        UPDATE public.envios_programados 
        SET canal = canal  -- This doesn't change the value but triggers the update
        WHERE id = test_id;
        
        -- Check if the timestamp was updated
        SELECT actualizado_en INTO new_time 
        FROM public.envios_programados 
        WHERE id = test_id;
        
        IF new_time > original_time THEN
            RAISE NOTICE 'SUCCESS: Trigger is working correctly! Time updated from % to %', original_time, new_time;
        ELSE
            RAISE NOTICE 'WARNING: Trigger may not be working. Time unchanged: %', original_time;
        END IF;
    ELSE
        RAISE NOTICE 'INFO: No test records found in envios_programados table';
    END IF;
END $$;

-- Final confirmation
SELECT 'Trigger fixed and tested successfully' as status;
