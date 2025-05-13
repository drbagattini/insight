-- 1. Verificar políticas actuales
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

-- 2. Verificar permisos actuales
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'users'
ORDER BY grantee, privilege_type;

-- 3. Deshabilitar RLS temporalmente
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. Borrar todas las políticas existentes
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

-- 5. Otorgar permisos mínimos
-- anon solo puede insertar
GRANT INSERT ON public.users TO anon;
-- authenticated puede hacer todo
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
-- Necesario para la secuencia del id
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO anon, authenticated;

-- 6. Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas simplificadas

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

-- 8. Verificar nuevas políticas
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

-- 9. Verificar nuevos permisos
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'users'
ORDER BY grantee, privilege_type;
