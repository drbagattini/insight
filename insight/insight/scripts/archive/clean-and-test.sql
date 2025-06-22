-- 1. Limpiar usuarios de prueba
DELETE FROM public.users 
WHERE email LIKE 'test.%@example.com';

-- 2. Verificar políticas actuales
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 3. Probar inserción de paciente (debe funcionar)
INSERT INTO public.users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active
) VALUES (
    'test.paciente.' || extract(epoch from now()) || '@example.com',
    '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
    'paciente',
    'Test',
    'Paciente',
    true
) RETURNING *;

-- 4. Probar inserción de psicólogo (debe fallar)
INSERT INTO public.users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active
) VALUES (
    'test.psicologo.' || extract(epoch from now()) || '@example.com',
    '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
    'psicologo',
    'Test',
    'Psicologo',
    true
) RETURNING *;
