CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserta en public.users usando el ID de auth.users
  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,                                 -- El ID de auth.users
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',  -- Intenta obtener first_name de la metadata
    NEW.raw_user_meta_data->>'last_name',   -- Intenta obtener last_name de la metadata
    COALESCE(NEW.raw_user_meta_data->>'role', 'paciente') -- Rol por defecto 'paciente'
  )
  ON CONFLICT (id) DO NOTHING; -- Si ya existe un registro con ese ID en public.users, no hagas nada.

  -- Opcional: si necesitas mantener la lógica de actualizar email_confirmed_at en auth.users
  -- UPDATE auth.users
  -- SET email_confirmed_at = NOW()
  -- WHERE id = NEW.id AND NEW.email_confirmed_at IS NULL; -- Solo si no está ya confirmado

  RETURN NEW;
END;
$$;
