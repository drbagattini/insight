-- Comenzamos una transacción
BEGIN;

-- 1. Primero verificamos si ya existe un psicólogo
SELECT id, email, role 
FROM public.users 
WHERE role = 'psicologo'
LIMIT 1;

-- 2. Si no existe ningún psicólogo, creamos uno de prueba
DO $$
DECLARE
    psychologist_id UUID;
BEGIN
    -- Intentamos obtener un psicólogo existente
    SELECT id INTO psychologist_id
    FROM public.users
    WHERE role = 'psicologo'
    LIMIT 1;

    -- Si no existe, creamos uno nuevo
    IF psychologist_id IS NULL THEN
        INSERT INTO public.users (
            email,
            role,
            metadata
        ) VALUES (
            'psicologo.test@example.com',
            'psicologo',
            '{"nombre": "Dr. Test", "especialidad": "Psicología Clínica"}'::jsonb
        ) RETURNING id INTO psychologist_id;
        
        RAISE NOTICE 'Nuevo psicólogo creado con ID: %', psychologist_id;
    ELSE
        RAISE NOTICE 'Usando psicólogo existente con ID: %', psychologist_id;
    END IF;

    -- 3. Creamos el paciente de prueba asociado a este psicólogo
    INSERT INTO public.patients (
        psychologist_id,
        full_name,
        email,
        whatsapp,
        metadata
    ) VALUES (
        psychologist_id,  -- Usamos el ID del psicólogo que obtuvimos o creamos
        'Paciente de Prueba',
        'paciente.test@example.com',
        '+5491122334455',
        '{"notas": "Paciente de prueba para verificar RLS"}'::jsonb
    );
END $$;

-- 4. Verificamos la creación correcta
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.unique_code,
    u.email as psychologist_email,
    u.role as psychologist_role
FROM public.patients p
JOIN public.users u ON p.psychologist_id = u.id
WHERE p.full_name = 'Paciente de Prueba';

COMMIT;
