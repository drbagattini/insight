-- 1. Primero verificamos si tenemos algún psicólogo
SELECT id, email, role 
FROM public.users 
WHERE role = 'psicologo'
LIMIT 1;

-- 2. Insertamos un paciente de prueba (ajusta el psychologist_id con un ID real de la consulta anterior)
INSERT INTO public.patients (
    psychologist_id,
    full_name,
    email,
    whatsapp,
    metadata
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- REEMPLAZA ESTO con un ID real de psicólogo
    'Paciente de Prueba',
    'test@example.com',
    '+5491122334455',
    '{"notas": "Paciente de prueba para verificar RLS"}'::jsonb
) RETURNING *;

-- 3. Verificamos que se creó correctamente
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.unique_code,
    u.email as psychologist_email
FROM public.patients p
JOIN public.users u ON p.psychologist_id = u.id
WHERE p.full_name = 'Paciente de Prueba';

-- 4. Probamos la política RLS intentando acceder como anónimo al paciente por su código único
SELECT id, full_name, unique_code
FROM public.patients
WHERE unique_code = (
    SELECT unique_code 
    FROM public.patients 
    WHERE full_name = 'Paciente de Prueba'
);
