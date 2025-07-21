-- Script to update the frequency check constraint to allow "10_minutos"
-- Run this in Supabase SQL Editor

-- First, drop the existing check constraint
DO $$ 
BEGIN
    -- Try to drop the constraint if it exists
    BEGIN
        ALTER TABLE envios_programados DROP CONSTRAINT IF EXISTS envios_programados_frecuencia_check;
        RAISE NOTICE 'Dropped existing frequency check constraint';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'No existing frequency check constraint found or error: %', SQLERRM;
    END;
    
    -- Create new constraint with "10_minutos" included
    ALTER TABLE envios_programados 
    ADD CONSTRAINT envios_programados_frecuencia_check 
    CHECK (frecuencia IN ('10_minutos', 'semanal', 'mensual', 'trimestral', 'unico'));
    
    RAISE NOTICE 'Added new frequency check constraint with 10_minutos support';
    
    -- Test the constraint by showing current valid values
    RAISE NOTICE 'Valid frequency values: 10_minutos, semanal, mensual, trimestral, unico';
    
END $$;
