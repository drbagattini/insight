-- 1. Deshabilitar RLS temporalmente
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Borrar todas las políticas existentes
DO $$ 
DECLARE 
    pol record;
BEGIN 
    FOR pol IN SELECT policyname 
               FROM pg_policies 
               WHERE tablename = 'users' 
               AND schemaname = 'public' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    END LOOP;
END $$;

-- 3. Actualizar constraint de roles
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('paciente', 'psicologo', 'admin'));

-- 4. Establecer rol por defecto
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'paciente';

-- 5. Habilitar RLS en modo estricto
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- 6. Crear políticas mínimas

-- Permitir inserción de pacientes sin autenticación
CREATE POLICY "Allow insert paciente unauth" ON public.users
    FOR INSERT 
    TO public
    WITH CHECK (role = 'paciente');

-- Permitir a admin insertar cualquier rol
CREATE POLICY "Allow admin to insert any user" ON public.users
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- Permitir lectura autenticada (admin ve todo, usuario ve su propio perfil)
CREATE POLICY "Allow authenticated read access" ON public.users
    FOR SELECT 
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
        OR id = auth.uid()
    );

-- Permitir actualización de datos propios
CREATE POLICY "Allow users to update their own data" ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Permitir eliminación de cuenta propia
CREATE POLICY "Allow users to delete their own account" ON public.users
    FOR DELETE
    TO authenticated
    USING (id = auth.uid());

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

-- 8. Probar inserción de paciente (debe funcionar)
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

-- 9. Probar inserción de psicólogo (debe fallar)
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
