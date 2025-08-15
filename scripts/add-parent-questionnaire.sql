-- Script para agregar el cuestionario de padres/tutores a la base de datos
-- Ejecutar este script en Supabase para agregar el nuevo cuestionario

INSERT INTO cuestionarios (
  codigo,
  titulo,
  descripcion,
  items,
  activo,
  creado_en,
  actualizado_en
) VALUES (
  'CUESTIONARIO-PADRES',
  'Cuestionario de Evaluación para Padres/Tutores',
  'Cuestionario diseñado para ser completado por padres o tutores para evaluar el comportamiento y bienestar del menor a su cargo.',
  '[
    {
      "id": 1,
      "orden": 1,
      "texto": "¿Con qué frecuencia su hijo/a muestra comportamientos de preocupación excesiva?"
    },
    {
      "id": 2,
      "orden": 2,
      "texto": "¿Su hijo/a tiene dificultades para concentrarse en las tareas escolares?"
    },
    {
      "id": 3,
      "orden": 3,
      "texto": "¿Observa cambios significativos en el apetito de su hijo/a?"
    },
    {
      "id": 4,
      "orden": 4,
      "texto": "¿Su hijo/a presenta dificultades para conciliar el sueño?"
    },
    {
      "id": 5,
      "orden": 5,
      "texto": "¿Ha notado cambios en el estado de ánimo de su hijo/a?"
    },
    {
      "id": 6,
      "orden": 6,
      "texto": "¿Su hijo/a evita actividades sociales que antes disfrutaba?"
    },
    {
      "id": 7,
      "orden": 7,
      "texto": "¿Observa comportamientos agresivos o irritabilidad en su hijo/a?"
    },
    {
      "id": 8,
      "orden": 8,
      "texto": "¿Su hijo/a expresa sentimientos de tristeza o desesperanza?"
    },
    {
      "id": 9,
      "orden": 9,
      "texto": "¿Ha notado cambios en el rendimiento académico de su hijo/a?"
    },
    {
      "id": 10,
      "orden": 10,
      "texto": "¿Su hijo/a presenta síntomas físicos sin causa médica aparente?"
    }
  ]'::jsonb,
  true,
  NOW(),
  NOW()
);

-- Verificar que el cuestionario se insertó correctamente
SELECT id, codigo, titulo, activo FROM cuestionarios WHERE codigo = 'CUESTIONARIO-PADRES';
