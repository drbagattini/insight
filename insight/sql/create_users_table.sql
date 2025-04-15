-- Crear la tabla users si no existe
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('paciente', 'psicologo', 'admin')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Crear índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

-- Crear políticas RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para insertar usuarios (cualquiera puede registrarse)
CREATE POLICY users_insert_policy ON users
  FOR INSERT
  WITH CHECK (true);

-- Política para leer usuarios (solo pueden ver su propia información)
CREATE POLICY users_select_policy ON users
  FOR SELECT
  USING (
    auth.uid() = id OR
    auth.jwt()->>'role' = 'admin' OR
    (auth.jwt()->>'role' = 'psicologo' AND role = 'paciente')
  );

-- Política para actualizar usuarios (solo pueden actualizar su propia información)
CREATE POLICY users_update_policy ON users
  FOR UPDATE
  USING (auth.uid() = id OR auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.uid() = id OR auth.jwt()->>'role' = 'admin');

-- Política para eliminar usuarios (solo admin)
CREATE POLICY users_delete_policy ON users
  FOR DELETE
  USING (auth.jwt()->>'role' = 'admin');

-- Función para actualizar el timestamp de última actualización
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el timestamp automáticamente
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
