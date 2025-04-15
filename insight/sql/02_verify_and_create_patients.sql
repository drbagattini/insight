-- Primero verificamos las tablas existentes
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public';

-- Aseguramos que tenemos la extensión uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN;

-- Eliminamos la tabla si existe (solo en desarrollo)
DROP TABLE IF EXISTS public.patients CASCADE;

-- Crear la tabla de pacientes con la estructura completa
CREATE TABLE public.patients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    psychologist_id UUID REFERENCES public.users(id) NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    whatsapp TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    unique_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(12), 'base64'),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_patients_updated_at ON public.patients;
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Políticas RLS

-- 1. Psicólogos pueden ver solo sus pacientes
CREATE POLICY "psicologos_select_own_patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
    psychologist_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 2. Psicólogos pueden insertar sus propios pacientes
CREATE POLICY "psicologos_insert_own_patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (
    psychologist_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 3. Psicólogos pueden actualizar sus propios pacientes
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

-- 4. Psicólogos pueden desactivar (soft delete) sus propios pacientes
CREATE POLICY "psicologos_delete_own_patients"
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

-- 5. Política para acceso anónimo por unique_code (solo lectura)
CREATE POLICY "allow_anonymous_access_by_code"
ON public.patients
FOR SELECT
TO public
USING (
    active = true AND
    unique_code IS NOT NULL
);

-- Índices para optimización
CREATE INDEX idx_patients_psychologist_id ON public.patients(psychologist_id);
CREATE INDEX idx_patients_unique_code ON public.patients(unique_code);
CREATE INDEX idx_patients_active ON public.patients(active);

-- Verificación final
SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' 
    AND tablename = 'patients'
) as patients_table_exists;

SELECT COUNT(*) as total_patients FROM public.patients;

COMMIT;
