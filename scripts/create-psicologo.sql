-- 1. Verificar políticas actuales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';

-- 2. Asegurar que existe la política para admin
CREATE POLICY IF NOT EXISTS "Allow admin to insert any user" ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM public.users WHERE role = 'admin'
        )
    );

-- 3. Crear usuario psicólogo de prueba
-- IMPORTANTE: Ejecutar esto mientras estás autenticado como admin
INSERT INTO public.users (
    email,
    password_hash,
    role,
    nombre,
    apellido
) VALUES (
    'psicologo.prueba@example.com',
    -- Este es un hash de ejemplo, deberías usar uno seguro real
    '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
    'psicologo',
    'Psicólogo',
    'De Prueba'
);

-- 4. Verificar roles después de la inserción
SELECT role, COUNT(*) as total
FROM public.users
GROUP BY role
ORDER BY role;
