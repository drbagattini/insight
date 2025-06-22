-- 14_create_questionarios_and_respuestas_tables.sql
-- Migración: tablas para plantillas de cuestionarios, programación de envíos, enlaces públicos y respuestas

-- Tabla de cuestionarios (plantillas)
CREATE TABLE IF NOT EXISTS public.cuestionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    items JSONB NOT NULL,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para actualizar 'actualizado_en'
DROP TRIGGER IF EXISTS trg_update_cuestionarios_updated_at ON public.cuestionarios;
CREATE TRIGGER trg_update_cuestionarios_updated_at
  BEFORE UPDATE ON public.cuestionarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insertar plantilla WHO-5 (Índice de Bienestar WHO-5)
INSERT INTO public.cuestionarios (codigo, titulo, descripcion, items)
VALUES (
  'WHO-5',
  'Índice de Bienestar WHO-5',
  '',
  '[
    {"id": 1, "texto": "Me he sentido alegre y de buen humor"},
    {"id": 2, "texto": "Me he sentido tranquilo y relajado"},
    {"id": 3, "texto": "Me he sentido activo y enérgico"},
    {"id": 4, "texto": "Me he despertado fresco y descansado"},
    {"id": 5, "texto": "Mi vida cotidiana ha estado llena de cosas que me interesan"}
  ]'
);

-- Tabla de envíos programados por paciente y cuestionario
CREATE TABLE IF NOT EXISTS public.envios_programados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    cuestionario_id UUID NOT NULL REFERENCES public.cuestionarios(id) ON DELETE CASCADE,
    canal TEXT NOT NULL CHECK (canal IN ('email','whatsapp','ambos')),
    frecuencia TEXT NOT NULL CHECK (frecuencia IN ('semanal','mensual','trimestral')),
    proximo_envio TIMESTAMPTZ NOT NULL,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para actualizar 'actualizado_en'
DROP TRIGGER IF EXISTS trg_update_envios_updated_at ON public.envios_programados;
CREATE TRIGGER trg_update_envios_updated_at
  BEFORE UPDATE ON public.envios_programados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabla de enlaces públicos para cuestionario (acceso sin login)
CREATE TABLE IF NOT EXISTS public.links_cuestionario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    cuestionario_id UUID NOT NULL REFERENCES public.cuestionarios(id) ON DELETE CASCADE,
    token UUID UNIQUE NOT NULL,
    expira_en TIMESTAMPTZ NOT NULL,
    consumido BOOLEAN NOT NULL DEFAULT false,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de respuestas de cuestionarios
CREATE TABLE IF NOT EXISTS public.respuestas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    cuestionario_id UUID NOT NULL REFERENCES public.cuestionarios(id) ON DELETE CASCADE,
    enviado_desde TEXT NOT NULL CHECK (enviado_desde IN ('email','whatsapp')),
    enviado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    respuestas JSONB NOT NULL,
    puntuacion INT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS si es necesario
ALTER TABLE public.cuestionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envios_programados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links_cuestionario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respuestas ENABLE ROW LEVEL SECURITY;

-- NOTA: Políticas RLS se configurarán en migraciones posteriores según roles y contexto.
`