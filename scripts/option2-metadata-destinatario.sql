-- OPCIÓN 2: Usar campo metadata existente para almacenar información de destinatario
-- Ventajas: No modifica estructura, flexible, extensible
-- Desventajas: Requiere parsing JSON, menos directo

-- Verificar si existe campo metadata en cuestionarios
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cuestionarios' 
AND column_name = 'metadata';

-- Si no existe, agregarlo:
-- ALTER TABLE cuestionarios 
-- ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Ejemplo de cómo marcar un cuestionario para padres usando metadata:
-- UPDATE cuestionarios 
-- SET metadata = COALESCE(metadata, '{}') || '{"destinatario": "padre_tutor"}'::jsonb
-- WHERE codigo = 'CUESTIONARIO-PADRES';

-- Ejemplo de cómo marcar un cuestionario para ambos:
-- UPDATE cuestionarios 
-- SET metadata = COALESCE(metadata, '{}') || '{"destinatario": "ambos"}'::jsonb
-- WHERE codigo = 'CUESTIONARIO-MIXTO';

-- Query para obtener cuestionarios con su destinatario:
SELECT 
  id, 
  codigo, 
  titulo,
  COALESCE(metadata->>'destinatario', 'paciente') as destinatario,
  metadata
FROM cuestionarios 
ORDER BY codigo;
