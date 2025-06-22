-- 1. Primero, intentamos acceder al paciente usando su código único
-- Esto debería FUNCIONAR debido a la política "allow_anonymous_access_by_code"
SELECT 
    id,
    full_name,
    unique_code
FROM public.patients
WHERE unique_code = 'THWlRwcHvsDVNGln';

-- 2. Intentamos acceder al paciente SIN usar el código único
-- Esto debería FALLAR debido a las políticas RLS
SELECT 
    id,
    full_name,
    unique_code
FROM public.patients
WHERE id = '51a08215-a2f2-43bc-b188-06e34768ff2e';

-- 3. Intentamos acceder a datos sensibles usando el código único
-- Esto debería mostrar solo los campos permitidos
SELECT 
    id,
    full_name,
    email,           -- No debería mostrarse
    whatsapp,        -- No debería mostrarse
    unique_code,
    psychologist_id  -- No debería mostrarse
FROM public.patients
WHERE unique_code = 'THWlRwcHvsDVNGln';
