-- Eliminar las políticas de inserción existentes
DROP POLICY IF EXISTS "allow_anonymous_patient_insert" ON users;
DROP POLICY IF EXISTS "allow_admin_insert" ON users;

-- Política para insertar pacientes (sin autenticación requerida)
CREATE POLICY "allow_anonymous_patient_insert" ON users
  FOR INSERT TO public
  WITH CHECK (
    role = 'paciente'
  );

-- Política para insertar psicólogos durante el login con Google
CREATE POLICY "allow_google_auth_insert" ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Permitir insertar psicólogos durante el proceso de autenticación
    role = 'psicologo'
  );

-- Política para que los admin puedan insertar cualquier tipo de usuario
CREATE POLICY "allow_admin_insert" ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.jwt()->>'role' = 'admin'
  );
