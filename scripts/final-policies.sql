-- 1. Eliminar la política temporal
DROP POLICY IF EXISTS "temp_allow_all_inserts" ON public.users;

-- 2. Crear la política final para pacientes
CREATE POLICY "allow_insert_paciente_only" ON public.users
    FOR INSERT 
    TO public
    WITH CHECK (
        role = 'paciente' -- Solo permite insertar usuarios con rol 'paciente'
        AND auth.role() IS NULL -- Asegura que no hay usuario autenticado
    );

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

-- 4. Probar inserción de paciente
INSERT INTO public.users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active
) VALUES (
    'test.paciente.final@example.com',
    '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
    'paciente',
    'Test',
    'Paciente',
    true
);
