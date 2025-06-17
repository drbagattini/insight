-- Archivo completo para sincronización entre auth.users y public.users
-- Incluye tres triggers para gestionar inserción, actualización y eliminación

-- TRIGGER 1: AFTER INSERT en auth.users
-- Función para manejar la creación de usuarios nuevos y sincronizar con public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Importante para acceder a auth.users y public.users con permisos suficientes
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, first_name, last_name, image_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'userrole', 'psicologo'), -- Role desde app_metadata o default
    COALESCE(NEW.raw_user_meta_data->>'given_name', NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', 'Usuario'), -- Nombre desde user_metadata o default
    COALESCE(NEW.raw_user_meta_data->>'family_name', NEW.raw_user_meta_data->>'last_name', ''), -- Apellido desde user_metadata o default
    NEW.raw_user_meta_data->>'avatar_url' -- URL de avatar desde user_metadata
  )
  ON CONFLICT (id) DO UPDATE SET -- Si ya existe el usuario por ID, actualiza sus detalles
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    image_url = EXCLUDED.image_url,
    updated_at = timezone('utc'::text, now()); -- Actualizar el timestamp
  
  RETURN NEW;
END;
$$;

-- Eliminar el trigger si existe para garantizar que el script sea idempotente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear el trigger para ejecutar la función después de insertar un nuevo usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Sincroniza datos de usuario nuevo desde auth.users a public.users al momento de la creación.';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Se ejecuta después de insertar un nuevo usuario en auth.users para llamar a handle_new_user().';


-- TRIGGER 2: AFTER UPDATE en auth.users
-- Función para sincronizar actualizaciones de datos desde auth.users a public.users
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo actualiza si el email o los metadatos han cambiado
  IF NEW.email <> OLD.email OR 
     NEW.raw_user_meta_data::text <> OLD.raw_user_meta_data::text OR
     NEW.raw_app_meta_data::text <> OLD.raw_app_meta_data::text THEN
     
    UPDATE public.users 
    SET 
      email = NEW.email,
      first_name = COALESCE(NEW.raw_user_meta_data->>'given_name', NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', first_name),
      last_name = COALESCE(NEW.raw_user_meta_data->>'family_name', NEW.raw_user_meta_data->>'last_name', last_name),
      image_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', image_url),
      -- No actualizamos el rol por defecto, ya que podría haber sido modificado intencionalmente
      -- role = COALESCE(NEW.raw_app_meta_data->>'userrole', role),
      updated_at = timezone('utc'::text, now())
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Eliminar el trigger si existe
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Crear el trigger para ejecutar la función después de actualizar un usuario
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

COMMENT ON FUNCTION public.handle_user_update() IS 'Sincroniza cambios desde auth.users a public.users cuando se actualiza un usuario.';
COMMENT ON TRIGGER on_auth_user_updated ON auth.users IS 'Se ejecuta después de actualizar un usuario en auth.users para llamar a handle_user_update().';


-- TRIGGER 3: BEFORE DELETE en auth.users
-- Función para eliminar el registro correspondiente en public.users antes de borrar en auth
CREATE OR REPLACE FUNCTION public.handle_user_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Elimina el usuario correspondiente de public.users
  DELETE FROM public.users WHERE id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- Eliminar el trigger si existe
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

-- Crear el trigger para ejecutar la función antes de eliminar un usuario
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_deleted();

COMMENT ON FUNCTION public.handle_user_deleted() IS 'Elimina el usuario correspondiente de public.users cuando se elimina de auth.users.';
COMMENT ON TRIGGER on_auth_user_deleted ON auth.users IS 'Se ejecuta antes de eliminar un usuario de auth.users para llamar a handle_user_deleted().';

-- Permisos adicionales (comentados - depende de la configuración específica de Supabase)
-- GRANT USAGE ON SCHEMA public TO postgres;
-- GRANT SELECT ON auth.users TO postgres;
-- GRANT INSERT, UPDATE, DELETE, SELECT ON public.users TO postgres;
