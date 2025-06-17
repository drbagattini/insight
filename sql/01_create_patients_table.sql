-- Create patients table
CREATE TABLE public.patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    psychologist_id UUID REFERENCES public.users(id) NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    whatsapp TEXT,
    active BOOLEAN DEFAULT true,
    unique_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(12), 'base64'),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Psicólogos pueden ver solo sus pacientes
CREATE POLICY "psicologos_select_own_patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
    psychologist_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Psicólogos pueden insertar sus propios pacientes
CREATE POLICY "psicologos_insert_own_patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (
    psychologist_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Psicólogos pueden actualizar sus propios pacientes
CREATE POLICY "psicologos_update_own_patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (
    psychologist_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
    psychologist_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Psicólogos pueden eliminar sus propios pacientes (soft delete recomendado)
CREATE POLICY "psicologos_delete_own_patients"
ON public.patients
FOR DELETE
TO authenticated
USING (
    psychologist_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Índices para mejor rendimiento
CREATE INDEX idx_patients_psychologist_id ON public.patients(psychologist_id);
CREATE INDEX idx_patients_unique_code ON public.patients(unique_code);
CREATE INDEX idx_patients_active ON public.patients(active);
