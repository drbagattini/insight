-- 1. Ver TODOS los roles distintos que existen (incluyendo mayúsculas/minúsculas)
SELECT DISTINCT role, 
       LENGTH(role) as longitud,
       LOWER(role) as en_minusculas,
       UPPER(role) as en_mayusculas,
       COUNT(*) as total,
       string_agg(email, ', ') as emails
FROM public.users 
GROUP BY role
ORDER BY role;

-- 2. Buscar cualquier variación de 'psicolog' en el campo role
SELECT *
FROM public.users
WHERE role ILIKE '%psicolog%'
   OR role ILIKE '%psycholog%';
