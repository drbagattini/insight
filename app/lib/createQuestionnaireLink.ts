import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export const createQuestionnaireLink = async (pacienteId: string, cuestionarioId: string) => {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const token = uuidv4();
  // Calcular fecha de expiración (7 días)
  const expira_en = new Date();
  expira_en.setDate(expira_en.getDate() + 7);

  const { error } = await supabaseAdmin
    .from('links_cuestionario')
    .insert({
      paciente_id: pacienteId,
      cuestionario_id: cuestionarioId,
      token,
      expira_en: expira_en.toISOString(),
      consumido: false,
    });

  if (error) throw error;

  return token;
};
