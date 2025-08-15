-- Script final para agregar soporte completo de destinatarios + Ohio Youth Scales
-- Ejecutar este script en Supabase para implementar la funcionalidad completa

-- 1. Agregar columna destinatario a la tabla cuestionarios
ALTER TABLE cuestionarios 
ADD COLUMN IF NOT EXISTS destinatario VARCHAR(20) DEFAULT 'paciente';

-- 2. Agregar columna destinatario a la tabla envios_programados
ALTER TABLE envios_programados 
ADD COLUMN IF NOT EXISTS destinatario VARCHAR(20) DEFAULT 'paciente';

-- 3. Agregar comentarios para documentación
COMMENT ON COLUMN cuestionarios.destinatario IS 'Destinatario del cuestionario: paciente, padre_tutor, o ambos';
COMMENT ON COLUMN envios_programados.destinatario IS 'Destinatario del envío: paciente o padre_tutor';

-- 4. Actualizar cuestionarios existentes (todos son para pacientes por defecto)
UPDATE cuestionarios 
SET destinatario = 'paciente' 
WHERE destinatario IS NULL;

-- 5. Actualizar envíos programados existentes (todos son para pacientes por defecto)
UPDATE envios_programados 
SET destinatario = 'paciente' 
WHERE destinatario IS NULL;

-- 6. Insertar los 4 cuestionarios Ohio Youth Scales

-- 6.1 OYS Problem Severity - Padre/Tutor
INSERT INTO cuestionarios (codigo, titulo, descripcion, destinatario, items, activo) VALUES (
  'OYS-PS-P-SF20',
  'Ohio Youth Scales – Problemas (Padre/Tutor) – Forma Corta (20 ítems)',
  'Gravedad/frecuencia de problemas conductuales y emocionales en los últimos 30 días (informante: padre/tutor).',
  'padre_tutor',
  '[
    {"id": 1, "orden": 1, "texto": "Discutir con otros"},
    {"id": 2, "orden": 2, "texto": "Meterse en peleas"},
    {"id": 3, "orden": 3, "texto": "Gritar, insultar o chillar a otros"},
    {"id": 4, "orden": 4, "texto": "Arrebatos de ira"},
    {"id": 5, "orden": 5, "texto": "Negarse a hacer lo que piden docentes o padres"},
    {"id": 6, "orden": 6, "texto": "Causar problemas sin motivo"},
    {"id": 7, "orden": 7, "texto": "Consumo de drogas o alcohol"},
    {"id": 8, "orden": 8, "texto": "Quebrantar reglas o la ley (volver después del horario, robar)"},
    {"id": 9, "orden": 9, "texto": "Faltar a la escuela o a clases"},
    {"id": 10, "orden": 10, "texto": "Mentir"},
    {"id": 11, "orden": 11, "texto": "No puede quedarse quieto/a, tiene demasiada energía"},
    {"id": 12, "orden": 12, "texto": "Hacerse daño (cortarse o rasguñarse, tomar pastillas)"},
    {"id": 13, "orden": 13, "texto": "Hablar o pensar sobre la muerte"},
    {"id": 14, "orden": 14, "texto": "Sentirse sin valor o inútil"},
    {"id": 15, "orden": 15, "texto": "Sentirse solo/a y sin amigos"},
    {"id": 16, "orden": 16, "texto": "Sentirse ansioso/a o temeroso/a"},
    {"id": 17, "orden": 17, "texto": "Preocuparse de que vaya a pasar algo malo"},
    {"id": 18, "orden": 18, "texto": "Sentirse triste o deprimido/a"},
    {"id": 19, "orden": 19, "texto": "Pesadillas"},
    {"id": 20, "orden": 20, "texto": "Problemas con la alimentación"}
  ]'::jsonb,
  true
);

-- 6.2 OYS Functioning - Padre/Tutor
INSERT INTO cuestionarios (codigo, titulo, descripcion, destinatario, items, activo) VALUES (
  'OYS-F-P-SF20',
  'Ohio Youth Scales – Funcionamiento (Padre/Tutor) – Forma Corta (20 ítems)',
  'Nivel de funcionamiento en áreas de la vida diaria (informante: padre/tutor).',
  'padre_tutor',
  '[
    {"id": 1, "orden": 1, "texto": "Llevarse bien con los amigos"},
    {"id": 2, "orden": 2, "texto": "Llevarse bien con la familia"},
    {"id": 3, "orden": 3, "texto": "Salir o desarrollar relaciones con novios/as"},
    {"id": 4, "orden": 4, "texto": "Llevarse bien con adultos fuera de la familia (docentes, directivos)"},
    {"id": 5, "orden": 5, "texto": "Mantenerse aseado/a y con buena apariencia"},
    {"id": 6, "orden": 6, "texto": "Atender necesidades de salud y mantener buenos hábitos (tomar medicación, cepillarse los dientes)"},
    {"id": 7, "orden": 7, "texto": "Controlar las emociones y evitar meterse en problemas"},
    {"id": 8, "orden": 8, "texto": "Estar motivado/a y terminar tareas"},
    {"id": 9, "orden": 9, "texto": "Participar en pasatiempos (colecciones, arte, etc.)"},
    {"id": 10, "orden": 10, "texto": "Participar en actividades recreativas (deportes, natación, bicicleta)"},
    {"id": 11, "orden": 11, "texto": "Cumplir tareas del hogar (ordenar la habitación, otras tareas)"},
    {"id": 12, "orden": 12, "texto": "Asistir a la escuela y obtener calificaciones aprobatorias"},
    {"id": 13, "orden": 13, "texto": "Aprender habilidades útiles para futuros trabajos"},
    {"id": 14, "orden": 14, "texto": "Sentirse bien consigo mismo/a"},
    {"id": 15, "orden": 15, "texto": "Pensar con claridad y tomar buenas decisiones"},
    {"id": 16, "orden": 16, "texto": "Concentrarse, prestar atención y completar tareas"},
    {"id": 17, "orden": 17, "texto": "Ganar dinero y aprender a usarlo con prudencia"},
    {"id": 18, "orden": 18, "texto": "Hacer cosas sin supervisión o restricciones"},
    {"id": 19, "orden": 19, "texto": "Asumir responsabilidad por las propias acciones"},
    {"id": 20, "orden": 20, "texto": "Capacidad para expresar sentimientos"}
  ]'::jsonb,
  true
);

-- 6.3 OYS Problem Severity - Joven
INSERT INTO cuestionarios (codigo, titulo, descripcion, destinatario, items, activo) VALUES (
  'OYS-PS-Y-SF20',
  'Ohio Youth Scales – Problemas (Joven) – Forma Corta (20 ítems)',
  'Gravedad/frecuencia de problemas en los últimos 30 días (autorreporte del joven).',
  'paciente',
  '[
    {"id": 1, "orden": 1, "texto": "Discutir con otros"},
    {"id": 2, "orden": 2, "texto": "Meterse en peleas"},
    {"id": 3, "orden": 3, "texto": "Gritar, insultar o chillar a otros"},
    {"id": 4, "orden": 4, "texto": "Arrebatos de ira"},
    {"id": 5, "orden": 5, "texto": "Negarme a hacer lo que piden docentes o padres"},
    {"id": 6, "orden": 6, "texto": "Causar problemas sin motivo"},
    {"id": 7, "orden": 7, "texto": "Consumo de drogas o alcohol"},
    {"id": 8, "orden": 8, "texto": "Quebrantar reglas o la ley (volver después del horario, robar)"},
    {"id": 9, "orden": 9, "texto": "Faltar a la escuela o a clases"},
    {"id": 10, "orden": 10, "texto": "Mentir"},
    {"id": 11, "orden": 11, "texto": "No puedo quedarme quieto/a, tengo demasiada energía"},
    {"id": 12, "orden": 12, "texto": "Hacerme daño (cortarme o rasguñarme, tomar pastillas)"},
    {"id": 13, "orden": 13, "texto": "Hablar o pensar sobre la muerte"},
    {"id": 14, "orden": 14, "texto": "Sentirme sin valor o inútil"},
    {"id": 15, "orden": 15, "texto": "Sentirme solo/a y sin amigos"},
    {"id": 16, "orden": 16, "texto": "Sentirme ansioso/a o temeroso/a"},
    {"id": 17, "orden": 17, "texto": "Preocuparme de que vaya a pasar algo malo"},
    {"id": 18, "orden": 18, "texto": "Sentirme triste o deprimido/a"},
    {"id": 19, "orden": 19, "texto": "Pesadillas"},
    {"id": 20, "orden": 20, "texto": "Problemas con la alimentación"}
  ]'::jsonb,
  true
);

-- 6.4 OYS Functioning - Joven
INSERT INTO cuestionarios (codigo, titulo, descripcion, destinatario, items, activo) VALUES (
  'OYS-F-Y-SF20',
  'Ohio Youth Scales – Funcionamiento (Joven) – Forma Corta (20 ítems)',
  'Nivel de funcionamiento en áreas de la vida diaria (autorreporte del joven).',
  'paciente',
  '[
    {"id": 1, "orden": 1, "texto": "Llevarme bien con mis amigos"},
    {"id": 2, "orden": 2, "texto": "Llevarme bien con mi familia"},
    {"id": 3, "orden": 3, "texto": "Salir o desarrollar relaciones con novios/as"},
    {"id": 4, "orden": 4, "texto": "Llevarme bien con adultos fuera de mi familia (docentes, directivos)"},
    {"id": 5, "orden": 5, "texto": "Mantenerme aseado/a y con buena apariencia"},
    {"id": 6, "orden": 6, "texto": "Atender mis necesidades de salud y mantener buenos hábitos (tomar medicación, cepillarme los dientes)"},
    {"id": 7, "orden": 7, "texto": "Controlar mis emociones y evitar meterme en problemas"},
    {"id": 8, "orden": 8, "texto": "Estar motivado/a y terminar tareas"},
    {"id": 9, "orden": 9, "texto": "Participar en pasatiempos (colecciones, arte, etc.)"},
    {"id": 10, "orden": 10, "texto": "Participar en actividades recreativas (deportes, natación, bicicleta)"},
    {"id": 11, "orden": 11, "texto": "Cumplir tareas del hogar (ordenar mi habitación, otras tareas)"},
    {"id": 12, "orden": 12, "texto": "Asistir a la escuela y obtener calificaciones aprobatorias"},
    {"id": 13, "orden": 13, "texto": "Aprender habilidades útiles para futuros trabajos"},
    {"id": 14, "orden": 14, "texto": "Sentirme bien conmigo mismo/a"},
    {"id": 15, "orden": 15, "texto": "Pensar con claridad y tomar buenas decisiones"},
    {"id": 16, "orden": 16, "texto": "Concentrarme, prestar atención y completar tareas"},
    {"id": 17, "orden": 17, "texto": "Ganar dinero y aprender a usarlo con prudencia"},
    {"id": 18, "orden": 18, "texto": "Hacer cosas sin supervisión o restricciones"},
    {"id": 19, "orden": 19, "texto": "Asumir responsabilidad por mis acciones"},
    {"id": 20, "orden": 20, "texto": "Capacidad para expresar mis sentimientos"}
  ]'::jsonb,
  true
);

-- 7. Verificar inserción
SELECT codigo, titulo, destinatario, activo 
FROM cuestionarios 
WHERE codigo LIKE 'OYS-%'
ORDER BY codigo;
