-- Crear tabla para almacenar metadata de archivos adjuntos
CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES public.evolucion_clinica(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  public_url TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_file_attachments_patient_id ON file_attachments(patient_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_entry_id ON file_attachments(entry_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_created_at ON file_attachments(created_at);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_file_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_file_attachments_updated_at
  BEFORE UPDATE ON file_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_file_attachments_updated_at();

-- Agregar políticas RLS (Row Level Security)
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

-- Política para permitir que los usuarios vean solo archivos de sus pacientes
CREATE POLICY "Users can view file attachments for their patients" ON file_attachments
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE psychologist_id = auth.uid()
    )
  );

-- Política para permitir que los usuarios inserten archivos para sus pacientes
CREATE POLICY "Users can insert file attachments for their patients" ON file_attachments
  FOR INSERT WITH CHECK (
    patient_id IN (
      SELECT id FROM public.patients WHERE psychologist_id = auth.uid()
    )
  );

-- Política para permitir que los usuarios actualicen archivos de sus pacientes
CREATE POLICY "Users can update file attachments for their patients" ON file_attachments
  FOR UPDATE USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE psychologist_id = auth.uid()
    )
  );

-- Política para permitir que los usuarios eliminen archivos de sus pacientes
CREATE POLICY "Users can delete file attachments for their patients" ON file_attachments
  FOR DELETE USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE psychologist_id = auth.uid()
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE file_attachments IS 'Almacena metadata de archivos adjuntos a evoluciones clínicas';
COMMENT ON COLUMN file_attachments.patient_id IS 'ID del paciente al que pertenece el archivo';
COMMENT ON COLUMN file_attachments.entry_id IS 'ID de la entrada de evolución clínica (opcional)';
COMMENT ON COLUMN file_attachments.file_name IS 'Nombre original del archivo';
COMMENT ON COLUMN file_attachments.file_path IS 'Ruta del archivo en Supabase Storage';
COMMENT ON COLUMN file_attachments.file_size IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN file_attachments.file_type IS 'Tipo MIME del archivo';
COMMENT ON COLUMN file_attachments.public_url IS 'URL pública del archivo en Supabase Storage';
COMMENT ON COLUMN file_attachments.uploaded_by IS 'Email del usuario que subió el archivo';
