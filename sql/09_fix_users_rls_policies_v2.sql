-- Primero, eliminar todas las políticas existentes de la tabla users
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_delete_policy ON users;

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para insertar usuarios (permitir registro anónimo de pacientes)
CREATE POLICY "allow_anonymous_patient_insert" ON users
  FOR INSERT TO public
  WITH CHECK (
    role = 'paciente'
  );

-- Política para insertar usuarios como admin
CREATE POLICY "allow_admin_insert" ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.jwt()->>'role' = 'admin'
  );

-- Política para leer usuarios
CREATE POLICY "allow_read_own_or_patients" ON users
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id OR
    auth.jwt()->>'role' = 'admin' OR
    (auth.jwt()->>'role' = 'psicologo' AND role = 'paciente')
  );

-- Política para actualizar usuarios
CREATE POLICY "allow_update_own_or_admin" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.uid() = id OR auth.jwt()->>'role' = 'admin');

-- Política para eliminar usuarios
CREATE POLICY "allow_delete_admin_only" ON users
  FOR DELETE TO authenticated
  USING (auth.jwt()->>'role' = 'admin');
