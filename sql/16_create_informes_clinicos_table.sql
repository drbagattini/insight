-- Crear tabla para informes clínicos
CREATE TABLE IF NOT EXISTS informes_clinicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  psicologo_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL, -- Markdown content
  fecha_generacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'finalizado')),
  metadatos JSONB DEFAULT '{}', -- Para datos adicionales como configuración de IA
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_informes_clinicos_paciente_id ON informes_clinicos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_informes_clinicos_psicologo_id ON informes_clinicos(psicologo_id);
CREATE INDEX IF NOT EXISTS idx_informes_clinicos_fecha_generacion ON informes_clinicos(fecha_generacion DESC);

-- Habilitar Row Level Security
ALTER TABLE informes_clinicos ENABLE ROW LEVEL SECURITY;

-- Política RLS: Los psicólogos solo pueden ver/editar sus propios informes
CREATE POLICY "Psychologists can manage their own reports" ON informes_clinicos
  FOR ALL USING (psicologo_id = auth.uid());

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_informes_clinicos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_informes_clinicos_updated_at
  BEFORE UPDATE ON informes_clinicos
  FOR EACH ROW
  EXECUTE FUNCTION update_informes_clinicos_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE informes_clinicos IS 'Tabla para almacenar informes clínicos generados con IA';
COMMENT ON COLUMN informes_clinicos.contenido IS 'Contenido del informe en formato Markdown';
COMMENT ON COLUMN informes_clinicos.metadatos IS 'Metadatos adicionales como configuración de IA, versión del prompt, etc.';
COMMENT ON COLUMN informes_clinicos.estado IS 'Estado del informe: borrador o finalizado';
