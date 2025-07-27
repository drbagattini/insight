-- Crear bucket para archivos de pacientes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-files',
  'patient-files',
  true,
  52428800, -- 50MB en bytes
  ARRAY[
    'application/pdf',
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'audio/m4a',
    'audio/mp4',
    'audio/x-m4a'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para el bucket
CREATE POLICY "Users can view files for their patients" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'patient-files' AND
    (storage.foldername(name))[1] = 'patients' AND
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM public.patients WHERE psychologist_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files for their patients" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'patient-files' AND
    (storage.foldername(name))[1] = 'patients' AND
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM public.patients WHERE psychologist_id = auth.uid()
    )
  );

CREATE POLICY "Users can update files for their patients" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'patient-files' AND
    (storage.foldername(name))[1] = 'patients' AND
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM public.patients WHERE psychologist_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files for their patients" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'patient-files' AND
    (storage.foldername(name))[1] = 'patients' AND
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM public.patients WHERE psychologist_id = auth.uid()
    )
  );
