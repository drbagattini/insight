-- Add destinatario column to cuestionarios table
ALTER TABLE cuestionarios 
ADD COLUMN IF NOT EXISTS destinatario TEXT CHECK (destinatario IN ('paciente', 'padre_tutor'));

-- Add comment for documentation
COMMENT ON COLUMN cuestionarios.destinatario IS 'Destinatario del cuestionario: paciente o padre_tutor';

-- Update existing OYS questionnaires with correct recipients
UPDATE cuestionarios 
SET destinatario = 'padre_tutor' 
WHERE codigo IN ('OYS-PS-P-SF20', 'OYS-F-P-SF20', 'OYS-PADRES-40');

UPDATE cuestionarios 
SET destinatario = 'paciente' 
WHERE codigo IN ('OYS-PS-Y-SF20', 'OYS-F-Y-SF20', 'OYS-JOVENES-40');

-- Verify the updates
SELECT codigo, titulo, destinatario, activo 
FROM cuestionarios 
WHERE codigo LIKE 'OYS%' 
ORDER BY codigo;
