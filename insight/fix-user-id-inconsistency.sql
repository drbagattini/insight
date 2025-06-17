-- Script para resolver la inconsistencia de IDs para dr.bagattini@centrouno.edu.uy
-- IMPORTANTE: Ejecutar este script en Supabase SQL Editor

-- 1. Primero, verificar el estado actual
SELECT 
    'auth.users' as tabla,
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'dr.bagattini@centrouno.edu.uy'

UNION ALL

SELECT 
    'public.users' as tabla,
    id,
    email,
    created_at::timestamp
FROM public.users 
WHERE email = 'dr.bagattini@centrouno.edu.uy';

-- 2. Actualizar el ID en public.users para que coincida con auth.users
-- NOTA: Descomentar y ejecutar solo después de verificar los datos anteriores
/*
UPDATE public.users 
SET id = '9ff1fb4f-de52-4a8d-aac8-95869a8ab0df'
WHERE email = 'dr.bagattini@centrouno.edu.uy' 
AND id = 'f1a8c1ad-d437-495f-8c25-93dfe8c4310d';
*/

-- 3. Verificar que no haya pacientes asociados al ID antiguo
-- Si los hay, también necesitarán ser actualizados
/*
SELECT COUNT(*) as patient_count 
FROM patients 
WHERE psychologist_id = 'f1a8c1ad-d437-495f-8c25-93dfe8c4310d';
*/

-- 4. Si hay pacientes, actualizar sus referencias
/*
UPDATE patients 
SET psychologist_id = '9ff1fb4f-de52-4a8d-aac8-95869a8ab0df'
WHERE psychologist_id = 'f1a8c1ad-d437-495f-8c25-93dfe8c4310d';
*/
