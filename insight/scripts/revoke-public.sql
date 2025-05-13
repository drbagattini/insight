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

-- 3. Revocar todos los permisos públicos
REVOKE ALL ON public.users FROM public;
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.users FROM authenticated;

-- 4. Otorgar permisos específicos
GRANT INSERT ON public.users TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.users TO authenticated;

-- 5. Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 6. Crear política de inserción para anon
CREATE POLICY "users_insert_anon" ON public.users
    FOR INSERT 
    TO anon
    WITH CHECK (
        role = 'paciente'
    );

-- 7. Crear política de inserción para admin
CREATE POLICY "users_insert_admin" ON public.users
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- 8. Otras políticas necesarias
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

-- 9. Verificar políticas
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

-- 10. Limpiar usuarios de prueba
DELETE FROM public.users 
WHERE email LIKE 'test.%@example.com';

-- 11. Probar inserción de paciente (debe funcionar)
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

-- 12. Probar inserción de psicólogo (debe fallar)
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
