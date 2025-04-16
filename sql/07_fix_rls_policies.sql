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
)
WITH CHECK (false);  -- No permitir inserciones anónimas

-- Política para psicólogos (pueden ver todos los campos de sus pacientes)
CREATE POLICY "psicologos_select_own_patients"
ON public.patients
FOR SELECT
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

-- Habilitamos RLS en la vista
ALTER VIEW public.anonymous_patient_view SET (security_invoker = true);

-- Política para la vista anónima
CREATE POLICY "allow_anonymous_view_access"
ON public.anonymous_patient_view
FOR SELECT
TO public
USING (true);

-- Verificamos la configuración
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'patients';

-- Prueba de acceso anónimo (debería mostrar solo campos permitidos)
SELECT * FROM public.anonymous_patient_view 
WHERE unique_code = 'THWlRwcHvsDVNGln';
