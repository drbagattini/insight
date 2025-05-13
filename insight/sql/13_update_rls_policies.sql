-- Actualizar políticas RLS para permitir acceso admin
BEGIN;

-- Eliminar políticas existentes para patients
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios pacientes" ON patients;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios pacientes" ON patients;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios pacientes" ON patients;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios pacientes" ON patients;

-- Crear nuevas políticas que incluyan acceso admin
CREATE POLICY "Ver pacientes" ON patients
  FOR SELECT USING (
    auth.uid() = psychologist_id OR -- El psicólogo puede ver sus pacientes
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    ) -- Los admin pueden ver todos los pacientes
  );

CREATE POLICY "Insertar pacientes" ON patients
  FOR INSERT WITH CHECK (
    auth.uid() = psychologist_id OR -- El psicólogo puede insertar sus pacientes
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    ) -- Los admin pueden insertar para cualquier psicólogo
  );

CREATE POLICY "Actualizar pacientes" ON patients
  FOR UPDATE USING (
    auth.uid() = psychologist_id OR -- El psicólogo puede actualizar sus pacientes
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    ) -- Los admin pueden actualizar cualquier paciente
  );

CREATE POLICY "Eliminar pacientes" ON patients
  FOR DELETE USING (
    auth.uid() = psychologist_id OR -- El psicólogo puede eliminar sus pacientes
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    ) -- Los admin pueden eliminar cualquier paciente
  );

-- Verificar las políticas
SELECT * FROM pg_policies WHERE tablename = 'patients';

COMMIT;
