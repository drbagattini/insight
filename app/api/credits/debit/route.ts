// app/api/credits/debit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { CREDIT_COSTS, CREDIT_PLANS, FAIR_USE_WARN_THRESHOLD } from '@/types/credits';
import type { DebitCreditsRequest } from '@/types/credits';
import { sendBalanceUpdate } from '../sse/route';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function monthStartISO(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0));
  return d.toISOString();
}

// Schema de validación
const debitSchema = z.object({
  type: z.enum(['report', 'transcription', 'supervisor_chat', 'synthesis']),
  quantity: z.number().positive(),
  description: z.string().min(1),
  metadata: z.record(z.any()).optional()
});

// Función para calcular créditos necesarios
function calculateCreditsNeeded(type: string, quantity: number): number {
  switch (type) {
    case 'report':
      return CREDIT_COSTS.REPORT;
    case 'transcription':
      return Math.ceil(quantity * CREDIT_COSTS.WHISPER_PER_MINUTE);
    case 'supervisor_chat':
      return Math.ceil(quantity / 1000 * CREDIT_COSTS.CHAT_PER_1K_TOKENS);
    case 'synthesis':
      return CREDIT_COSTS.SYNTHESIS;
    default:
      throw new Error(`Tipo de operación no válido: ${type}`);
  }
}

async function getActivePlanTypeForThisMonth(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('payment_preferences')
    .select('plan_type, created_at, status')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .gte('created_at', monthStartISO())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[credits/debit] error fetching active plan:', error);
    return null;
  }
  return data?.plan_type ?? null;
}

async function getThisMonthUsage(userId: string) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('description, metadata, created_at')
    .eq('user_id', userId)
    .eq('type', 'debit')
    .gte('created_at', monthStartISO())
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[credits/debit] error fetching month usage:', error);
    return { reports: 0, transcription_minutes: 0, chat_tokens: 0 };
  }
  let reports = 0;
  let transcription_minutes = 0;
  let chat_tokens = 0;
  for (const t of data || []) {
    const md = (t.metadata || {}) as Record<string, any>;
    const usageType = md.usage_type as string | undefined;
    if (usageType === 'report') {
      reports += Number(md.usage_quantity ?? 1);
      continue;
    }
    if (usageType === 'transcription') {
      const minutes = Number(md.usage_quantity ?? md.duration_minutes ?? 0);
      transcription_minutes += isFinite(minutes) ? minutes : 0;
      continue;
    }
    if (usageType === 'supervisor_chat') {
      const tokens = Number(md.usage_quantity ?? md.tokens_used ?? 0);
      chat_tokens += isFinite(tokens) ? tokens : 0;
      continue;
    }
    // Heurística legacy
    const desc: string = String(t.description || '').toLowerCase();
    if (desc.includes('transcripción')) {
      const minutes = Number(md.duration_minutes ?? 0);
      transcription_minutes += isFinite(minutes) ? minutes : 0;
    } else if (desc.includes('informe')) {
      reports += 1;
    } else if (typeof md.tokens_used === 'number') {
      chat_tokens += md.tokens_used;
    }
  }
  return { reports, transcription_minutes, chat_tokens };
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Validar datos de entrada
    const body = await request.json();
    const validatedData = debitSchema.parse(body) as DebitCreditsRequest;

    // Fair-use: obtener plan activo del mes
    const activePlanType = await getActivePlanTypeForThisMonth(userId);
    const plan = activePlanType ? CREDIT_PLANS.find(p => p.id === activePlanType) : undefined;

    // Si hay plan y define límites, validar uso antes de debitar
    if (plan?.fair_use?.monthly) {
      const usage = await getThisMonthUsage(userId);
      const limits = plan.fair_use.monthly;
      const warnThreshold = plan.fair_use.warn_threshold ?? FAIR_USE_WARN_THRESHOLD;

      // Determinar categoría y cantidades
      let category: 'reports' | 'transcription_minutes' | 'chat_tokens';
      let attemptQty: number;
      switch (validatedData.type) {
        case 'report':
          category = 'reports';
          attemptQty = 1; // cada informe cuenta como 1
          break;
        case 'transcription':
          category = 'transcription_minutes';
          attemptQty = Math.ceil(validatedData.quantity);
          break;
        case 'supervisor_chat':
          category = 'chat_tokens';
          attemptQty = Math.ceil(validatedData.quantity);
          break;
      }

      const used = usage[category];
      const limit = limits[category];
      const proposed = used + attemptQty;

      if (proposed > limit) {
        const res = NextResponse.json(
          {
            error: 'Límite mensual de uso superado para tu plan',
            fair_use: {
              status: 'block',
              plan_type: activePlanType,
              category,
              limit,
              used,
              proposed,
              remaining: Math.max(0, limit - used)
            }
          },
          { status: 429 }
        );
        res.headers.set('X-Fair-Use-Status', 'block');
        return res;
      }

      if (proposed / limit >= warnThreshold) {
        // Adjuntar advertencia vía header. Continuamos con el débito.
        // No retornamos aún; se envía al final con los datos de la transacción
        (request as any)._fairUseWarning = {
          status: 'warn',
          plan_type: activePlanType,
          category,
          limit,
          used,
          proposed,
          remaining: Math.max(0, limit - used)
        };
      }
    }

    // Calcular créditos necesarios
    const creditsNeeded = calculateCreditsNeeded(validatedData.type, validatedData.quantity);

    // Iniciar transacción
    const { data, error } = await supabase.rpc('debit_user_credits', {
      p_user_id: userId,
      p_credits_amount: creditsNeeded,
      p_description: validatedData.description,
      p_metadata: {
        ...(validatedData.metadata || {}),
        usage_type: validatedData.type,
        usage_quantity:
          validatedData.type === 'report'
            ? 1
            : Math.ceil(validatedData.quantity)
      }
    });

    if (error) {
      if (error.message.includes('insufficient_credits')) {
        return NextResponse.json(
          { 
            error: 'Créditos insuficientes',
            credits_needed: creditsNeeded,
            current_balance: 0 // Se podría obtener del error si se modifica la función
          },
          { status: 402 } // Payment Required
        );
      }

      console.error('Error debiting credits:', error);
      return NextResponse.json(
        { error: 'Error al debitar créditos' },
        { status: 500 }
      );
    }

    // Enviar actualización en tiempo real
    try {
      sendBalanceUpdate(userId, data?.new_balance || 0, {
        type: 'debit',
        amount: creditsNeeded,
        description: validatedData.description,
        transaction_id: data?.transaction_id
      });
    } catch (sseError) {
      console.error('Error sending SSE update:', sseError);
    }

    const response = NextResponse.json({
      success: true,
      credits_debited: creditsNeeded,
      new_balance: data?.new_balance || 0,
      transaction_id: data?.transaction_id,
      fair_use_warning: (request as any)._fairUseWarning || undefined
    });
    if ((request as any)._fairUseWarning) {
      response.headers.set('X-Fair-Use-Status', 'warn');
    }
    return response;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in credits debit API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
