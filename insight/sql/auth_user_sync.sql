-- Function to handle new user creation and sync to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Important for accessing auth.users and inserting into public.users
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, first_name, last_name, image_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'userrole', 'psicologo'), -- Role from app_metadata or default
    COALESCE(NEW.raw_user_meta_data->>'given_name', NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', 'Usuario'), -- Name from user_metadata or default
    COALESCE(NEW.raw_user_meta_data->>'family_name', NEW.raw_user_meta_data->>'last_name', ''), -- Last name from user_metadata or default
    NEW.raw_user_meta_data->>'avatar_url' -- Avatar URL from user_metadata
  )
  ON CONFLICT (id) DO UPDATE SET -- If user already exists by ID, update their details
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    image_url = EXCLUDED.image_url,
    updated_at = timezone('utc'::text, now()); -- Update the timestamp
  RETURN NEW;
END;
$$;

-- Trigger to execute the function after a new user is inserted into auth.users
-- Drop the trigger first if it exists to ensure the script is idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant usage on the public schema and select on auth.users to the postgres role if needed,
-- though SECURITY DEFINER on the function usually handles permissions.
-- This is more for completeness and might depend on your specific Supabase setup.
-- GRANT USAGE ON SCHEMA public TO postgres;
-- GRANT SELECT ON auth.users TO postgres; -- Or the role Supabase uses for triggers if different
-- GRANT INSERT, UPDATE, SELECT ON public.users TO postgres;

COMMENT ON FUNCTION public.handle_new_user() IS 'Synchronizes new user data from auth.users to public.users upon user creation.';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Fires after a new user is inserted into auth.users to call handle_new_user().';
