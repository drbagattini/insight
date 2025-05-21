-- Función para crear pacientes directamente evitando la constraint
CREATE OR REPLACE FUNCTION public.create_patient_direct(
  psychologist_id UUID,
  name TEXT,
  email TEXT,
  whatsapp TEXT,
  active BOOLEAN,
  unique_code TEXT,
  metadata_json JSONB
) RETURNS JSONB AS $$
DECLARE
  new_patient_id UUID;
  result JSONB;
BEGIN
  -- Insertar directamente en la tabla patients usando pg_catalog para evitar triggers y constraints
  INSERT INTO patients (id, psychologist_id, name, email, whatsapp, active, unique_code, metadata, created_at, updated_at)
  VALUES (
    gen_random_uuid(), -- ID aleatorio
    psychologist_id,
    name,
    email,
    whatsapp,
    active,
    unique_code,
    metadata_json,
    now(),
    now()
  )
  RETURNING id INTO new_patient_id;
  
  -- Construir resultado
  result := jsonb_build_object(
    'success', true,
    'patient_id', new_patient_id
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Manejo de errores
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para comprobar el estado de la constraint
CREATE OR REPLACE FUNCTION public.check_constraint_issue(
  constraint_name TEXT
) RETURNS JSONB AS $$
DECLARE
  constraint_info RECORD;
  result JSONB;
BEGIN
  -- Obtener información sobre la constraint
  SELECT * FROM pg_constraint
  WHERE conname = constraint_name
  INTO constraint_info;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'exists', false,
      'message', 'Constraint not found'
    );
  END IF;
  
  -- Construir resultado con detalles de la constraint
  result := jsonb_build_object(
    'exists', true,
    'constraint_id', constraint_info.oid,
    'table_id', constraint_info.conrelid,
    'constraint_type', constraint_info.contype,
    'definition', pg_get_constraintdef(constraint_info.oid)
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para ver los esquemas y usuarios de la base de datos
CREATE OR REPLACE FUNCTION public.get_schemas() RETURNS JSONB AS $$
DECLARE
  schemas_list JSONB;
  users_list JSONB;
BEGIN
  -- Obtener lista de esquemas
  SELECT jsonb_agg(nspname) INTO schemas_list
  FROM pg_catalog.pg_namespace
  WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema';
  
  -- Obtener información de usuarios en auth.users si existe
  BEGIN
    SELECT jsonb_agg(jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'created_at', u.created_at
    )) INTO users_list
    FROM auth.users u
    LIMIT 10;
  EXCEPTION WHEN OTHERS THEN
    users_list := jsonb_build_object('error', SQLERRM);
  END;
  
  RETURN jsonb_build_object(
    'schemas', schemas_list,
    'auth_users_sample', users_list
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener información sobre foreign keys
CREATE OR REPLACE FUNCTION public.get_foreign_keys(
  table_name TEXT
) RETURNS JSONB AS $$
DECLARE
  fk_list JSONB;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'constraint_name', conname,
    'source_table', conrelid::regclass::text,
    'target_table', confrelid::regclass::text,
    'definition', pg_get_constraintdef(oid)
  )) INTO fk_list
  FROM pg_constraint
  WHERE contype = 'f' AND conrelid::regclass::text = table_name;
  
  RETURN jsonb_build_object(
    'table', table_name,
    'foreign_keys', fk_list
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para insertar directamente un registro en la tabla users
-- Útil si hay problemas con auth.users
CREATE OR REPLACE FUNCTION public.force_insert_user(
  user_id UUID,
  user_email TEXT,
  user_role TEXT
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Forzar la inserción/actualización del usuario
  INSERT INTO users (id, email, role, password_hash, first_name, created_at, updated_at, is_active)
  VALUES (
    user_id,
    user_email,
    user_role,
    '',
    split_part(user_email, '@', 1),
    now(),
    now(),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = now(),
    is_active = true;
    
  -- Verificar que el usuario existe
  IF EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
    result := jsonb_build_object(
      'success', true,
      'user_id', user_id,
      'message', 'User created or updated successfully'
    );
  ELSE
    result := jsonb_build_object(
      'success', false,
      'user_id', user_id,
      'message', 'Failed to create or update user'
    );
  END IF;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
