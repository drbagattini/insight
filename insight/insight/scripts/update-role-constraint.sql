-- Script final para unificar roles en español y configurar políticas

-- 1. Hacer backup de los usuarios actuales
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- Mostrar roles actuales antes del cambio
SELECT role, COUNT(*) as total_antes
FROM public.users
GROUP BY role
ORDER BY role;

BEGIN;

-- 2. Eliminar todas las restricciones y políticas existentes
DROP POLICY IF EXISTS "Allow insert for new users" ON public.users;
DROP POLICY IF EXISTS "Allow admin to insert any user" ON public.users;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 3. Actualizar roles existentes a español
UPDATE public.users SET role = CASE 
    WHEN LOWER(role) IN ('user', 'paciente') THEN 'paciente'
    WHEN LOWER(role) IN ('psychologist', 'psicologo') THEN 'psicologo'
    WHEN LOWER(role) = 'admin' THEN 'admin'
    ELSE role
END;

-- 4. Configurar la columna role y agregar constraint
ALTER TABLE public.users
    ALTER COLUMN role SET DEFAULT 'paciente';

ALTER TABLE public.users
    ADD CONSTRAINT users_role_check
        CHECK (role IN ('paciente', 'psicologo', 'admin'));

-- 5. Crear las políticas de inserción
-- Permitir insertar pacientes sin autenticación
CREATE POLICY "Allow insert for new users" ON public.users
    FOR INSERT
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

-- 6. Verificar que no hayan quedado roles inválidos
DO $$
DECLARE
    invalid_roles_count integer;
BEGIN
    SELECT COUNT(*) INTO invalid_roles_count
    FROM public.users
    WHERE role NOT IN ('paciente', 'psicologo', 'admin');
    
    IF invalid_roles_count > 0 THEN
        RAISE EXCEPTION 'Se encontraron % registros con roles inválidos', invalid_roles_count;
    END IF;
END
$$;

-- 7. Verificar los roles y políticas después de los cambios
SELECT role, COUNT(*) as total_despues
FROM public.users
GROUP BY role
ORDER BY role;

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

COMMIT;
