-- OPCIÓN 1: Agregar campo destinatario directamente en la tabla cuestionarios
-- Ventajas: Simple, directo, fácil de consultar
-- Desventajas: Modifica estructura principal

-- Agregar columna destinatario a la tabla cuestionarios
ALTER TABLE cuestionarios 
ADD COLUMN IF NOT EXISTS destinatario VARCHAR(20) DEFAULT 'paciente';

-- Agregar comentario
COMMENT ON COLUMN cuestionarios.destinatario IS 'Destinatario del cuestionario: paciente, padre_tutor, o ambos';

-- Actualizar cuestionarios existentes (todos son para pacientes por defecto)
UPDATE cuestionarios 
SET destinatario = 'paciente' 
WHERE destinatario IS NULL;

-- Ejemplo de cómo marcar un cuestionario para padres:
-- UPDATE cuestionarios 
-- SET destinatario = 'padre_tutor' 
-- WHERE codigo = 'CUESTIONARIO-PADRES';

-- Verificar la estructura
SELECT id, codigo, titulo, destinatario 
FROM cuestionarios 
ORDER BY codigo;
