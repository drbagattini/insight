-- 1. Deshabilitar RLS temporalmente
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "temp_allow_all_inserts" ON public.users;
DROP POLICY IF EXISTS "allow_insert_paciente_only" ON public.users;
DROP POLICY IF EXISTS "Allow insert for new users" ON public.users;
DROP POLICY IF EXISTS "Allow admin to insert any user" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.users;
DROP POLICY IF EXISTS "Allow users to delete their own account" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own data" ON public.users;

-- 3. Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas desde cero
-- Política para insertar pacientes sin autenticación
CREATE POLICY "allow_public_insert_paciente" ON public.users
    FOR INSERT 
    TO public
    WITH CHECK (role = 'paciente');

-- Política para lectura autenticada
CREATE POLICY "allow_auth_read" ON public.users
    FOR SELECT
    TO public
    USING (
        auth.uid() IS NOT NULL 
        AND (
            role = 'admin' 
            OR auth.uid()::text = id::text
        )
    );

-- Política para actualización propia
CREATE POLICY "allow_self_update" ON public.users
    FOR UPDATE
    TO public
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- Política para eliminación propia
CREATE POLICY "allow_self_delete" ON public.users
    FOR DELETE
    TO public
    USING (auth.uid()::text = id::text);

-- 5. Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- 6. Verificar políticas
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

-- 7. Probar inserción de paciente
INSERT INTO public.users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active
) VALUES (
    'test.paciente.reset@example.com',
    '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
    'paciente',
    'Test',
    'Paciente',
    true
) RETURNING *;

-- 8. Probar inserción de psicólogo (debería fallar)
INSERT INTO public.users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active
) VALUES (
    'test.psicologo.reset@example.com',
    '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
    'psicologo',
    'Test',
    'Psicologo',
    true
) RETURNING *;
