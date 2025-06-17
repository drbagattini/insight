-- Renombrar la columna full_name a name
BEGIN;

-- Verificar si la columna full_name existe
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'full_name'
    ) THEN
        -- Renombrar la columna
        ALTER TABLE public.patients RENAME COLUMN full_name TO name;
        RAISE NOTICE 'Column renamed successfully.';
    ELSE
        RAISE NOTICE 'Column full_name does not exist.';
    END IF;
END $$;

-- Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'patients'
ORDER BY ordinal_position;

COMMIT;
