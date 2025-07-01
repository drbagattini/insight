-- OPD-CA2-SQ Seed Data - Part 1 (Items 1-20)
-- Insert questionnaire template into public.cuestionarios

INSERT INTO public.cuestionarios (codigo, nombre, descripcion, items, activo, created_at, updated_at)
VALUES (
  'OPD-CA2-SQ',
  'OPD-CA2-SQ - Cuestionario de Capacidades Operacionalizadas',
  'Cuestionario de 81 ítems que evalúa cuatro dimensiones de capacidades psicodinámicas según el modelo OPD.',
  '{
    "items": [
      {
        "orden": 1,
        "texto": "Mis ideas y pensamientos me hacen sentir bien.",
        "opciones_respuesta": [
          {"valor": 0, "texto": "No = no se aplica"},
          {"valor": 1, "texto": "más bien no = algo no se aplica"},
          {"valor": 2, "texto": "más o menos = se aplica parcialmente"},
          {"valor": 3, "texto": "más bien si = si se aplica"},
          {"valor": 4, "texto": "Sí = exactamente cierto"}
        ]
      },
      {
        "orden": 2,
        "texto": "Muchas veces automáticamente me apropio de los comentarios o acciones de los demás.",
        "opciones_respuesta": [
          {"valor": 0, "texto": "No = no se aplica"},
          {"valor": 1, "texto": "más bien no = algo no se aplica"},
          {"valor": 2, "texto": "más o menos = se aplica parcialmente"},
          {"valor": 3, "texto": "más bien si = si se aplica"},
          {"valor": 4, "texto": "Sí = exactamente cierto"}
        ]
      },
      {
        "orden": 3,
        "texto": "A veces me siento como un barril de pólvora que puede explotar con una pequeña chispa.",
        "opciones_respuesta": [
          {"valor": 0, "texto": "No = no se aplica"},
          {"valor": 1, "texto": "más bien no = algo no se aplica"},
          {"valor": 2, "texto": "más o menos = se aplica parcialmente"},
          {"valor": 3, "texto": "más bien si = si se aplica"},
          {"valor": 4, "texto": "Sí = exactamente cierto"}
        ]
      }
    ]
  }'::jsonb,
  true,
  NOW(),
  NOW()
);
