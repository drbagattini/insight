-- Primero, eliminar la política existente
DROP POLICY IF EXISTS users_insert_policy ON users;

-- Crear una nueva política que solo permita insertar pacientes
CREATE POLICY users_insert_policy ON users
  FOR INSERT
  WITH CHECK (
    -- Permitir inserción anónima solo para pacientes
    (role = 'paciente') OR
    -- O permitir que los admins inserten cualquier rol
    (auth.jwt()->>'role' = 'admin')
  );

-- Asegurarse de que RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
