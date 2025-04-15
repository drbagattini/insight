-- Primero eliminamos las políticas existentes
DROP POLICY IF EXISTS "allow_anonymous_access_by_code" ON public.patients;
DROP POLICY IF EXISTS "psicologos_select_own_patients" ON public.patients;
DROP POLICY IF EXISTS "psicologos_insert_own_patients" ON public.patients;
DROP POLICY IF EXISTS "psicologos_update_own_patients" ON public.patients;
DROP POLICY IF EXISTS "psicologos_delete_own_patients" ON public.patients;

-- Recreamos las políticas correctamente
-- 1. Política para acceso anónimo (solo SELECT con código único)
CREATE POLICY "allow_anonymous_access_by_code"
ON public.patients
FOR SELECT
TO public
USING (
    active = true AND
    unique_code IS NOT NULL
);

-- 2. Política para psicólogos (SELECT)
CREATE POLICY "psicologos_select_own_patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
    psychologist_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 3. Política para psicólogos (INSERT)
CREATE POLICY "psicologos_insert_own_patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (
    psychologist_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 4. Política para psicólogos (UPDATE)
CREATE POLICY "psicologos_update_own_patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (
    psychologist_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 5. Política para psicólogos (DELETE/SOFT DELETE)
CREATE POLICY "psicologos_delete_own_patients"
ON public.patients
FOR DELETE
TO authenticated
USING (
    psychologist_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Creamos una vista segura para acceso anónimo
CREATE OR REPLACE VIEW public.anonymous_patient_view AS
SELECT
    id,
    full_name,
    unique_code,
    active
FROM public.patients
WHERE active = true;

-- Verificamos la configuración
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'patients';

-- Pruebas de acceso
-- 1. Acceso anónimo por código único (debería mostrar datos limitados)
SELECT * FROM public.patients 
WHERE unique_code = 'THWlRwcHvsDVNGln';

-- 2. Acceso anónimo sin código único (no debería mostrar nada)
SELECT * FROM public.patients 
WHERE id = '51a08215-a2f2-43bc-b188-06e34768ff2e';

-- 3. Vista anónima (debería mostrar solo campos seguros)
SELECT * FROM public.anonymous_patient_view 
WHERE unique_code = 'THWlRwcHvsDVNGln';
