-- 1. Eliminar política anterior
DROP POLICY IF EXISTS "allow_insert_paciente_only" ON public.users;

-- 2. Crear política más simple
CREATE POLICY "allow_insert_paciente_only" ON public.users
    FOR INSERT 
    TO public
    WITH CHECK (role = 'paciente');

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

-- 4. Probar inserción directa
INSERT INTO public.users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active
) VALUES (
    'test.paciente.simple@example.com',
    '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
    'paciente',
    'Test',
    'Paciente',
    true
);
