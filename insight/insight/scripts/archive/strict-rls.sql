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
DROP POLICY IF EXISTS "allow_public_insert_paciente" ON public.users;
DROP POLICY IF EXISTS "allow_auth_read" ON public.users;
DROP POLICY IF EXISTS "allow_self_update" ON public.users;
DROP POLICY IF EXISTS "allow_self_delete" ON public.users;

-- 3. Habilitar RLS en modo restrictivo
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- 4. Crear política por defecto que deniega todo
CREATE POLICY "deny_by_default" ON public.users
    FOR ALL
    TO public
    USING (false)
    WITH CHECK (false);

-- 5. Crear política específica para pacientes
CREATE POLICY "allow_insert_paciente" ON public.users
    FOR INSERT 
    TO public
    WITH CHECK (
        role = 'paciente'
        AND auth.uid() IS NULL -- Asegurarse que no hay usuario autenticado
    );

-- 6. Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- 7. Verificar políticas
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

-- 8. Probar inserción de paciente
INSERT INTO public.users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active
) VALUES (
    'test.paciente.strict@example.com',
    '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
    'paciente',
    'Test',
    'Paciente',
    true
) RETURNING *;

-- 9. Probar inserción de psicólogo (debería fallar)
INSERT INTO public.users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active
) VALUES (
    'test.psicologo.strict@example.com',
    '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
    'psicologo',
    'Test',
    'Psicologo',
    true
) RETURNING *;
