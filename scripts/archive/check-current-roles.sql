-- Verificar roles actuales y sus variaciones
SELECT role, 
       COUNT(*) as total,
       string_agg(DISTINCT email, ', ') as emails
FROM public.users 
GROUP BY role 
ORDER BY role;
