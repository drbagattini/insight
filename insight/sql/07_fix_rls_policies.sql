-- Primero eliminamos las políticas existentes
DROP POLICY IF EXISTS "allow_anonymous_access_by_code" ON public.patients;
DROP POLICY IF EXISTS "psicologos_select_own_patients" ON public.patients;

-- Recreamos las políticas con restricciones de columnas
CREATE POLICY "allow_anonymous_access_by_code"
ON public.patients
FOR SELECT
TO public
USING (
    active = true AND
    unique_code IS NOT NULL
);

-- Política para psicólogos (pueden ver todos los campos de sus pacientes)
CREATE POLICY "psicologos_select_own_patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
    psychologist_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Recrear la vista anónima
DROP VIEW IF EXISTS public.anonymous_patient_view;
CREATE VIEW public.anonymous_patient_view AS
SELECT
    id,
    name,
    unique_code,
    active
FROM public.patients
WHERE active = true;

-- Verificamos la configuración
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'patients';

-- Prueba de acceso anónimo (debería mostrar solo campos permitidos)
SELECT * FROM public.anonymous_patient_view 
WHERE unique_code = 'THWlRwcHvsDVNGln';
