-- Fix OYS questionnaire titles to remove "(Forma Completa)"
UPDATE cuestionarios 
SET titulo = 'Ohio Youth Scales - Padres/Tutores'
WHERE codigo = 'OYS-PADRES-40' AND titulo LIKE '%Forma Completa%';

UPDATE cuestionarios 
SET titulo = 'Ohio Youth Scales - Jóvenes'
WHERE codigo = 'OYS-JOVENES-40' AND titulo LIKE '%Forma Completa%';

-- Also update the nombre field if it exists and contains the same text
UPDATE cuestionarios 
SET nombre = 'Ohio Youth Scales - Padres/Tutores'
WHERE codigo = 'OYS-PADRES-40' AND nombre LIKE '%Forma Completa%';

UPDATE cuestionarios 
SET nombre = 'Ohio Youth Scales - Jóvenes'
WHERE codigo = 'OYS-JOVENES-40' AND nombre LIKE '%Forma Completa%';

-- Verify the changes
SELECT codigo, titulo, nombre FROM cuestionarios WHERE codigo IN ('OYS-PADRES-40', 'OYS-JOVENES-40');
