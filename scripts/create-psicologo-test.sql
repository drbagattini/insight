-- IMPORTANTE: Ejecutar esto mientras estés autenticado como admin
INSERT INTO public.users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active
) VALUES (
    'psicologo.test@example.com',
    -- Este es un hash de ejemplo para la contraseña 'test123'
    '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
    'psicologo',
    'Psicólogo',
    'De Prueba',
    true
);

-- Verificar que se creó correctamente
SELECT role, COUNT(*) as total
FROM public.users
GROUP BY role
ORDER BY role;
