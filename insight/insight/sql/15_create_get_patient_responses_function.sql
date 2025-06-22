-- 15_create_get_patient_responses_function.sql
-- Función para listar respuestas de pacientes con filtros y paginación
create or replace function get_patient_responses(
  patient_id uuid,
  qcode text default null,
  from_date timestamptz default now() - interval '30 days',
  to_date timestamptz default now(),
  max_results integer default 25,
  start_index integer default 0
) returns table (
  id uuid,
  date timestamptz,
  questionnaire text,
  score integer
) language sql security definer as $$
  select
    r.id,
    r.enviado_en as date,
    c.codigo as questionnaire,
    r.puntuacion as score
  from
    public.respuestas r
    join public.cuestionarios c on c.id = r.cuestionario_id
  where
    r.paciente_id = patient_id
    and (qcode is null or c.codigo = qcode)
    and r.enviado_en between from_date and to_date
  order by r.enviado_en desc
  limit max_results offset start_index;
$$;
