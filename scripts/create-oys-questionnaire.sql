-- Crear cuestionario OYS-PADRES-40 (Ohio Youth Scales - Padres/Tutores - 40 ítems)
INSERT INTO cuestionarios (codigo, titulo, descripcion, activo, items)
VALUES (
  'OYS-PADRES-40',
  'Ohio Youth Scales - Padres/Tutores (40 ítems)',
  'Cuestionario consolidado OYS para padres y tutores que evalúa severidad de problemas (20 ítems) y funcionamiento (20 ítems) en jóvenes',
  true,
  jsonb_build_array(
    -- Preguntas de Problem Severity (PS) - Primeros 20 ítems
    jsonb_build_object('id', 1, 'texto', 'Problemas de comportamiento agresivo', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 2, 'texto', 'Problemas de atención/concentración', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 3, 'texto', 'Problemas de ansiedad', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 4, 'texto', 'Problemas de estado de ánimo/depresión', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 5, 'texto', 'Problemas de conducta desafiante', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 6, 'texto', 'Problemas con el uso de sustancias', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 7, 'texto', 'Problemas de autolesión', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 8, 'texto', 'Pensamientos sobre la muerte o suicidio', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 9, 'texto', 'Problemas de sueño', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 10, 'texto', 'Problemas de alimentación', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 11, 'texto', 'Problemas de hiperactividad', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 12, 'texto', 'Problemas de impulsividad', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 13, 'texto', 'Problemas de relaciones con pares', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 14, 'texto', 'Problemas de comunicación', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 15, 'texto', 'Problemas de control de impulsos', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 16, 'texto', 'Problemas de regulación emocional', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 17, 'texto', 'Problemas de adaptación social', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 18, 'texto', 'Problemas de autoestima', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 19, 'texto', 'Problemas de motivación', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 20, 'texto', 'Problemas de manejo del estrés', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    
    -- Preguntas de Functioning (F) - Últimos 20 ítems
    jsonb_build_object('id', 21, 'texto', 'Funcionamiento en el hogar', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 22, 'texto', 'Funcionamiento en la escuela/trabajo', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 23, 'texto', 'Funcionamiento con amigos', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 24, 'texto', 'Funcionamiento en actividades recreativas', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 25, 'texto', 'Funcionamiento en relaciones familiares', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 26, 'texto', 'Funcionamiento en el cuidado personal', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 27, 'texto', 'Funcionamiento en responsabilidades', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 28, 'texto', 'Funcionamiento en comunicación', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 29, 'texto', 'Funcionamiento en resolución de problemas', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 30, 'texto', 'Funcionamiento en manejo de emociones', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 31, 'texto', 'Funcionamiento en independencia', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 32, 'texto', 'Funcionamiento en toma de decisiones', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 33, 'texto', 'Funcionamiento en actividades diarias', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 34, 'texto', 'Funcionamiento en relaciones sociales', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 35, 'texto', 'Funcionamiento en autocontrol', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 36, 'texto', 'Funcionamiento en adaptabilidad', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 37, 'texto', 'Funcionamiento en expresión emocional', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 38, 'texto', 'Funcionamiento en cooperación', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 39, 'texto', 'Funcionamiento en seguimiento de reglas', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 40, 'texto', 'Funcionamiento general', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien'))
  )
)
ON CONFLICT (codigo) DO NOTHING;

-- Crear también el cuestionario para jóvenes
INSERT INTO cuestionarios (codigo, titulo, descripcion, activo, items)
VALUES (
  'OYS-JOVENES-40',
  'Ohio Youth Scales - Jóvenes (40 ítems)',
  'Cuestionario consolidado OYS para jóvenes que evalúa severidad de problemas (20 ítems) y funcionamiento (20 ítems)',
  true,
  jsonb_build_array(
    -- Mismas preguntas pero adaptadas para autoreporte del joven
    jsonb_build_object('id', 1, 'texto', 'Problemas de comportamiento agresivo', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 2, 'texto', 'Problemas de atención/concentración', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 3, 'texto', 'Problemas de ansiedad', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 4, 'texto', 'Problemas de estado de ánimo/depresión', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 5, 'texto', 'Problemas de conducta desafiante', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 6, 'texto', 'Problemas con el uso de sustancias', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 7, 'texto', 'Problemas de autolesión', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 8, 'texto', 'Pensamientos sobre la muerte o suicidio', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 9, 'texto', 'Problemas de sueño', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 10, 'texto', 'Problemas de alimentación', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 11, 'texto', 'Problemas de hiperactividad', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 12, 'texto', 'Problemas de impulsividad', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 13, 'texto', 'Problemas de relaciones con pares', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 14, 'texto', 'Problemas de comunicación', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 15, 'texto', 'Problemas de control de impulsos', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 16, 'texto', 'Problemas de regulación emocional', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 17, 'texto', 'Problemas de adaptación social', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 18, 'texto', 'Problemas de autoestima', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 19, 'texto', 'Problemas de motivación', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    jsonb_build_object('id', 20, 'texto', 'Problemas de manejo del estrés', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Nunca', '1 - Rara vez', '2 - A veces', '3 - Frecuentemente', '4 - Muy frecuentemente')),
    
    -- Preguntas de Functioning (F) - Últimos 20 ítems (autoreporte)
    jsonb_build_object('id', 21, 'texto', 'Mi funcionamiento en el hogar', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 22, 'texto', 'Mi funcionamiento en la escuela/trabajo', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 23, 'texto', 'Mi funcionamiento con amigos', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 24, 'texto', 'Mi funcionamiento en actividades recreativas', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 25, 'texto', 'Mi funcionamiento en relaciones familiares', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 26, 'texto', 'Mi funcionamiento en el cuidado personal', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 27, 'texto', 'Mi funcionamiento en responsabilidades', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 28, 'texto', 'Mi funcionamiento en comunicación', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 29, 'texto', 'Mi funcionamiento en resolución de problemas', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 30, 'texto', 'Mi funcionamiento en manejo de emociones', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 31, 'texto', 'Mi funcionamiento en independencia', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 32, 'texto', 'Mi funcionamiento en toma de decisiones', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 33, 'texto', 'Mi funcionamiento en actividades diarias', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 34, 'texto', 'Mi funcionamiento en relaciones sociales', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 35, 'texto', 'Mi funcionamiento en autocontrol', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 36, 'texto', 'Mi funcionamiento en adaptabilidad', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 37, 'texto', 'Mi funcionamiento en expresión emocional', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 38, 'texto', 'Mi funcionamiento en cooperación', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 39, 'texto', 'Mi funcionamiento en seguimiento de reglas', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien')),
    jsonb_build_object('id', 40, 'texto', 'Mi funcionamiento general', 'tipo', 'escala', 'opciones', jsonb_build_array('0 - Muy mal', '1 - Mal', '2 - Regular', '3 - Bien', '4 - Muy bien'))
  )
)
ON CONFLICT (codigo) DO NOTHING;

-- Verificar que se crearon correctamente
SELECT codigo, titulo, activo FROM cuestionarios WHERE codigo IN ('OYS-PADRES-40', 'OYS-JOVENES-40');
