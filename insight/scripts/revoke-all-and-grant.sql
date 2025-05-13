-- 1. Revocar TODOS los permisos
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

-- 2. Deshabilitar RLS temporalmente
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Borrar todas las políticas existentes
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

-- 4. Actualizar constraint de roles
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('paciente', 'psicologo', 'admin'));

-- 5. Establecer rol por defecto
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'paciente';

-- 6. Otorgar permisos mínimos
-- anon solo puede insertar
GRANT INSERT ON public.users TO anon;
-- authenticated puede hacer todo
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
-- Necesario para la secuencia del id
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO anon, authenticated;

-- 7. Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 8. Crear políticas simplificadas

-- Permitir a anon insertar solo pacientes
CREATE POLICY "allow_anon_insert_paciente"
ON public.users
FOR INSERT
TO anon
WITH CHECK (role = 'paciente');

-- Permitir a admin insertar cualquier rol
CREATE POLICY "allow_admin_any_role"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Permitir lectura autenticada (admin ve todo, usuario ve su propio perfil)
CREATE POLICY "allow_auth_read"
ON public.users
FOR SELECT 
TO authenticated
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    OR id = auth.uid()
);

-- Permitir actualización de datos propios
CREATE POLICY "allow_self_update"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Permitir eliminación de cuenta propia
CREATE POLICY "allow_self_delete"
ON public.users
FOR DELETE
TO authenticated
USING (id = auth.uid());

-- 9. Verificar permisos
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'users'
ORDER BY grantee, privilege_type;

-- 10. Verificar políticas
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

-- 11. Limpiar usuarios de prueba
DELETE FROM public.users 
WHERE email LIKE 'test.%@example.com';

-- 12. Probar inserción de paciente (debe funcionar)
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

-- 13. Probar inserción de psicólogo (debe fallar)
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
