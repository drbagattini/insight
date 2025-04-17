-- Crear un usuario específico para la API en public.users
BEGIN;

-- Insertar el usuario API en public.users
INSERT INTO public.users (
    id,
    email,
    role,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000000', -- ID fijo para el usuario API
    'api@insight.local',
    'admin', -- Usando rol admin en lugar de api
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = now();

-- Verificar que el usuario existe
SELECT * FROM public.users WHERE email = 'api@insight.local';

COMMIT;
