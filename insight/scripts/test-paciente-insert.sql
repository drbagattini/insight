-- 1. Mostrar recuento antes de la inserción
SELECT role, COUNT(*) as total_antes
FROM public.users
GROUP BY role
ORDER BY role;

-- 2. Intentar insertar un paciente (sin autenticación)
INSERT INTO public.users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active
) VALUES (
    'nuevo.paciente@test.com',
    -- Hash para la contraseña 'test123'
    '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
    'paciente',
    'Nuevo',
    'Paciente',
    true
);

-- 3. Verificar el recuento después de la inserción
SELECT role, COUNT(*) as total_despues
FROM public.users
GROUP BY role
ORDER BY role;

-- 4. Verificar el nuevo paciente
SELECT email, role, created_at
FROM public.users
WHERE email = 'nuevo.paciente@test.com';
