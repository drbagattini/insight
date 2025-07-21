-- Safe fix for envios_programados trigger only
-- DO NOT touch other tables' functions/triggers

-- Step 1: Drop only the problematic triggers for envios_programados
DROP TRIGGER IF EXISTS trg_update_envios_updated_at ON public.envios_programados;
DROP TRIGGER IF EXISTS trg_update_envios_actualizado_en ON public.envios_programados;

-- Step 2: Create a specific function for envios_programados (Spanish columns)
CREATE OR REPLACE FUNCTION update_actualizado_en_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the correct trigger for envios_programados
CREATE TRIGGER trg_update_envios_actualizado_en
  BEFORE UPDATE ON public.envios_programados
  FOR EACH ROW
  EXECUTE FUNCTION update_actualizado_en_column();

-- Step 4: Test with a safe update
DO $$
DECLARE
    test_record RECORD;
    old_time TIMESTAMP WITH TIME ZONE;
    new_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get first record
    SELECT * INTO test_record FROM public.envios_programados LIMIT 1;
    
    IF test_record.id IS NOT NULL THEN
        old_time := test_record.actualizado_en;
        
        -- Wait a moment to ensure timestamp difference
        PERFORM pg_sleep(0.1);
        
        -- Safe update that doesn't change data
        UPDATE public.envios_programados 
        SET canal = canal 
        WHERE id = test_record.id;
        
        -- Check new timestamp
        SELECT actualizado_en INTO new_time 
        FROM public.envios_programados 
        WHERE id = test_record.id;
        
        IF new_time > old_time THEN
            RAISE NOTICE 'SUCCESS: Trigger working! Updated from % to %', old_time, new_time;
        ELSE
            RAISE NOTICE 'ERROR: Trigger not working. Time unchanged: %', old_time;
        END IF;
    ELSE
        RAISE NOTICE 'No records found to test';
    END IF;
END $$;

SELECT 'Trigger fix completed for envios_programados' as status;
