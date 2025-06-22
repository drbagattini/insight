-- 1. Ver políticas actuales
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

-- 2. Eliminar y recrear las políticas de inserción
DROP POLICY IF EXISTS "Allow insert for new users" ON public.users;
DROP POLICY IF EXISTS "Allow admin to insert any user" ON public.users;

-- Permitir insertar pacientes sin autenticación
CREATE POLICY "Allow insert for new users" ON public.users
    FOR INSERT
    TO public
    WITH CHECK (role = 'paciente');

-- Permitir a admin insertar cualquier rol
CREATE POLICY "Allow admin to insert any user" ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- 3. Verificar las políticas actualizadas
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
