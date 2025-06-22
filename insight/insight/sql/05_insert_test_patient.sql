-- Insertamos un paciente de prueba con el ID real del psicólogo
INSERT INTO public.patients (
    psychologist_id,
    full_name,
    email,
    whatsapp,
    metadata
) VALUES (
    '65b10101-b443-4306-b5bf-cbfa7c49a2b9', -- ID del psicólogo que obtuvimos
    'Paciente de Prueba 2',
    'test2@example.com',
    '+5491122334455',
    '{"notas": "Paciente de prueba para verificar RLS"}'::jsonb
) RETURNING *;

-- Verificamos que se creó correctamente y está asociado al psicólogo
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.unique_code,
    u.email as psychologist_email
FROM public.patients p
JOIN public.users u ON p.psychologist_id = u.id
WHERE p.full_name = 'Paciente de Prueba 2';
