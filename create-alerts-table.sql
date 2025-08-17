-- Create clinical alerts table for Ohio Youth Scales
CREATE TABLE IF NOT EXISTS public.alertas_clinicas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    respuesta_id UUID REFERENCES public.respuestas(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('tdah', 'sustancias', 'autolesion')),
    severidad VARCHAR(20) NOT NULL CHECK (severidad IN ('warning', 'danger')),
    mensaje TEXT NOT NULL,
    evidencia JSONB,
    recomendaciones JSONB,
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_paciente_id ON public.alertas_clinicas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_respuesta_id ON public.alertas_clinicas(respuesta_id);
CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_tipo ON public.alertas_clinicas(tipo);
CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_severidad ON public.alertas_clinicas(severidad);
CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_activa ON public.alertas_clinicas(activa);
CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_fecha_creacion ON public.alertas_clinicas(fecha_creacion);

-- Enable Row Level Security
ALTER TABLE public.alertas_clinicas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view alerts for their patients" ON public.alertas_clinicas
    FOR SELECT USING (
        paciente_id IN (
            SELECT id FROM public.patients 
            WHERE psychologist_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert alerts for their patients" ON public.alertas_clinicas
    FOR INSERT WITH CHECK (
        paciente_id IN (
            SELECT id FROM public.patients 
            WHERE psychologist_id = auth.uid()
        )
    );

CREATE POLICY "Users can update alerts for their patients" ON public.alertas_clinicas
    FOR UPDATE USING (
        paciente_id IN (
            SELECT id FROM public.patients 
            WHERE psychologist_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.alertas_clinicas TO authenticated;
GRANT ALL ON public.alertas_clinicas TO service_role;
