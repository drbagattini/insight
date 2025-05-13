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

-- 5. Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 6. Crear una única política de inserción
CREATE POLICY "users_insert_policy" ON public.users
    FOR INSERT 
    TO public
    WITH CHECK (
        -- Si no hay sesión, solo permitir pacientes
        (auth.uid() IS NULL AND role = 'paciente')
        OR
        -- Si hay sesión y es admin, permitir cualquier rol
        (auth.uid() IS NOT NULL AND 
         (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
    );

-- 7. Otras políticas necesarias
CREATE POLICY "users_select_policy" ON public.users
    FOR SELECT 
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
        OR id = auth.uid()
    );

CREATE POLICY "users_update_policy" ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "users_delete_policy" ON public.users
    FOR DELETE
    TO authenticated
    USING (id = auth.uid());

-- 8. Verificar políticas
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

-- 9. Limpiar usuarios de prueba
DELETE FROM public.users 
WHERE email LIKE 'test.%@example.com';

-- 10. Probar inserción de paciente (debe funcionar)
INSERT INTO public.users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active
) VALUES (
    'test.paciente.' || extract(epoch from now()) || '@example.com',
    '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
    'paciente',
    'Test',
    'Paciente',
    true
) RETURNING *;

-- 11. Probar inserción de psicólogo (debe fallar)
INSERT INTO public.users (
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active
) VALUES (
    'test.psicologo.' || extract(epoch from now()) || '@example.com',
    '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
    'psicologo',
    'Test',
    'Psicologo',
    true
) RETURNING *;
