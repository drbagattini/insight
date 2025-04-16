-- 1. Probar inserción de paciente (debería funcionar por la política existente)
INSERT INTO public.users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active
) VALUES (
    'nuevo.paciente@test.com',
    '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
    'paciente',
    'Nuevo',
    'Paciente',
    true
);

-- 2. Verificar que se insertó correctamente
SELECT role, COUNT(*) as total
FROM public.users
GROUP BY role
ORDER BY role;

-- 3. Intentar insertar un psicólogo (debería fallar por la política)
INSERT INTO public.users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active
) VALUES (
    'test.psicologo@test.com',
    '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
    'psicologo',  -- Esto debería fallar
    'Test',
    'Psicologo',
    true
);
