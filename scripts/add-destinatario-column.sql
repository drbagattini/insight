-- Script para agregar la columna destinatario a la tabla envios_programados
-- Ejecutar este script en Supabase para soportar envíos a padres/tutores

-- Agregar la columna destinatario con valor por defecto 'paciente'
ALTER TABLE envios_programados 
ADD COLUMN IF NOT EXISTS destinatario VARCHAR(20) DEFAULT 'paciente';

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN envios_programados.destinatario IS 'Destinatario del cuestionario: paciente o padre_tutor';

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'envios_programados' 
AND column_name = 'destinatario';
