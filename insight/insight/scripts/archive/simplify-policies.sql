-- 1. Eliminar todas las políticas existentes de inserción
DROP POLICY IF EXISTS "Allow insert for new users" ON public.users;
DROP POLICY IF EXISTS "Allow admin to insert any user" ON public.users;

-- 2. Crear una política simple que permita TODAS las inserciones (para probar)
CREATE POLICY "temp_allow_all_inserts" ON public.users
    FOR INSERT
    TO public
    WITH CHECK (true);

-- 3. Verificar las políticas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 4. Intentar una inserción simple
INSERT INTO public.users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active
) VALUES (
    'test.simple@example.com',
    '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
    'paciente',
    'Test',
    'Simple',
    true
);
