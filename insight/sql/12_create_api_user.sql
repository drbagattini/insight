-- Crear un usuario específico para la API
BEGIN;

-- Verificar si el usuario ya existe
DO $$ 
BEGIN 
    -- Intentar crear el usuario en auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) 
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'api@insight.local',
        crypt('your-secure-password-here', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"role": "api"}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
    ON CONFLICT (email) DO NOTHING;

    -- Insertar en la tabla users personalizada
    INSERT INTO public.users (
        id,
        email,
        role,
        created_at,
        updated_at
    )
    SELECT 
        id,
        email,
        'api',
        created_at,
        updated_at
    FROM auth.users 
    WHERE email = 'api@insight.local'
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'API user created or already exists';
END $$;

-- Verificar que el usuario existe
SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE email = 'api@insight.local'
) as api_user_exists;

COMMIT;
