-- Crear tabla para almacenar alertas clínicas de Ohio Youth Scales
-- Esta tabla almacena alertas calculadas automáticamente basadas en respuestas de cuestionarios

CREATE TABLE IF NOT EXISTS alertas_clinicas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    respuesta_id UUID REFERENCES respuestas(id) ON DELETE CASCADE,
    
    -- Tipo de alerta
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('tdah', 'sustancias', 'autolesion')),
    
    -- Severidad de la alerta
    severidad VARCHAR(10) NOT NULL CHECK (severidad IN ('warning', 'danger')),
    
    -- Mensaje descriptivo de la alerta
    mensaje TEXT NOT NULL,
    
    -- Evidencia que generó la alerta (JSON con items y valores)
    evidencia JSONB NOT NULL,
    
    -- Recomendaciones clínicas (JSON array)
    recomendaciones JSONB NOT NULL,
    
    -- Estado de la alerta
    activa BOOLEAN DEFAULT true,
    revisada BOOLEAN DEFAULT false,
    revisada_por UUID REFERENCES users(id),
    fecha_revision TIMESTAMPTZ,
    notas_revision TEXT,
    
    -- Timestamps
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_paciente_id ON alertas_clinicas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_tipo ON alertas_clinicas(tipo);
CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_severidad ON alertas_clinicas(severidad);
CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_activa ON alertas_clinicas(activa);
CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_fecha_creacion ON alertas_clinicas(fecha_creacion);

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_alertas_clinicas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alertas_clinicas_updated_at
    BEFORE UPDATE ON alertas_clinicas
    FOR EACH ROW
    EXECUTE FUNCTION update_alertas_clinicas_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE alertas_clinicas ENABLE ROW LEVEL SECURITY;

-- Política RLS: Los usuarios solo pueden ver alertas de sus pacientes
CREATE POLICY alertas_clinicas_select_policy ON alertas_clinicas
    FOR SELECT
    USING (
        paciente_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- Política RLS: Los usuarios solo pueden insertar alertas para sus pacientes
CREATE POLICY alertas_clinicas_insert_policy ON alertas_clinicas
    FOR INSERT
    WITH CHECK (
        paciente_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- Política RLS: Los usuarios solo pueden actualizar alertas de sus pacientes
CREATE POLICY alertas_clinicas_update_policy ON alertas_clinicas
    FOR UPDATE
    USING (
        paciente_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- Comentarios para documentación
COMMENT ON TABLE alertas_clinicas IS 'Almacena alertas clínicas calculadas automáticamente desde cuestionarios Ohio Youth Scales';
COMMENT ON COLUMN alertas_clinicas.tipo IS 'Tipo de alerta: tdah, sustancias, autolesion';
COMMENT ON COLUMN alertas_clinicas.severidad IS 'Severidad: warning (amarillo), danger (rojo)';
COMMENT ON COLUMN alertas_clinicas.evidencia IS 'JSON con items del cuestionario que generaron la alerta';
COMMENT ON COLUMN alertas_clinicas.recomendaciones IS 'JSON array con recomendaciones clínicas';
COMMENT ON COLUMN alertas_clinicas.activa IS 'Si la alerta está activa (visible en el dashboard)';
COMMENT ON COLUMN alertas_clinicas.revisada IS 'Si la alerta ha sido revisada por un clínico';
