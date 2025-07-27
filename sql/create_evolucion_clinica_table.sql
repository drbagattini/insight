-- Tabla para el módulo de Evolución Clínica
-- Arquitectura estructurada para análisis futuros y escalabilidad

CREATE TABLE IF NOT EXISTS public.evolucion_clinica (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('clinica', 'supervision', 'sesion', 'paciente')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_paciente_id ON public.evolucion_clinica(paciente_id);
CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_author_id ON public.evolucion_clinica(author_id);
CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_entry_type ON public.evolucion_clinica(entry_type);
CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_created_at ON public.evolucion_clinica(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_tags ON public.evolucion_clinica USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_metadata ON public.evolucion_clinica USING GIN(metadata);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_evolucion_clinica_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_evolucion_clinica_updated_at
    BEFORE UPDATE ON public.evolucion_clinica
    FOR EACH ROW
    EXECUTE FUNCTION update_evolucion_clinica_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE public.evolucion_clinica IS 'Registro cronológico de evolución clínica del paciente con arquitectura estructurada para análisis futuros';
COMMENT ON COLUMN public.evolucion_clinica.entry_type IS 'Tipo de entrada: clinica, supervision, sesion, paciente';
COMMENT ON COLUMN public.evolucion_clinica.content IS 'Contenido principal de la nota clínica';
COMMENT ON COLUMN public.evolucion_clinica.metadata IS 'Datos adicionales flexibles en formato JSON';
COMMENT ON COLUMN public.evolucion_clinica.tags IS 'Etiquetas para categorización y análisis futuro';
