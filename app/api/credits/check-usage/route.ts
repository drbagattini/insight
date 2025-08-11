// app/api/credits/check-usage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';
import {
  CREDIT_PLANS,
  FAIR_USE_WARN_THRESHOLD,
  type FairUseCheckResult
} from '@/types/credits';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function monthStartISO(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0));
  return d.toISOString();
}

function normalizeUsageFromTransactions(transactions: any[]) {
  let reports = 0;
  let transcription_minutes = 0;
  let chat_tokens = 0;

  for (const t of transactions || []) {
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

    // Heurísticas para transacciones históricas sin usage_type
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { category, quantity } = await request.json();

    if (!['reports', 'transcription_minutes', 'chat_tokens'].includes(category)) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 });
    }

    const userId = session.user.id;
    const monthStart = monthStartISO();

    // Obtener plan activo del mes (último aprobado en el mes actual)
    const { data: activePlan, error: planErr } = await supabase
      .from('payment_preferences')
      .select('plan_type, created_at, status')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .gte('created_at', monthStart)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planErr) {
      console.error('[fair-use] error fetching plan:', planErr);
    }

    if (!activePlan?.plan_type) {
      const res: FairUseCheckResult = {
        status: 'no_plan',
        category,
        plan_type: null,
        limit: null,
        used: 0,
        proposed: qty,
        remaining: null,
        warn_threshold: FAIR_USE_WARN_THRESHOLD,
        message: 'Sin plan activo para este mes: no se aplican límites de fair use.'
      };
      return NextResponse.json(res);
    }

    const plan = CREDIT_PLANS.find(p => p.id === activePlan.plan_type);
    if (!plan?.fair_use?.monthly) {
      const res: FairUseCheckResult = {
        status: 'no_plan',
        category,
        plan_type: activePlan.plan_type,
        limit: null,
        used: 0,
        proposed: qty,
        remaining: null,
        warn_threshold: FAIR_USE_WARN_THRESHOLD,
        message: 'El plan activo no define límites de fair use.'
      };
      return NextResponse.json(res);
    }

    // Obtener uso del mes
    const { data: transactions, error: txErr } = await supabase
      .from('wallet_transactions')
      .select('description, metadata, created_at, type')
      .eq('user_id', userId)
      .eq('type', 'debit')
      .gte('created_at', monthStart)
      .order('created_at', { ascending: false });

    if (txErr) {
      console.error('[fair-use] error fetching transactions:', txErr);
      return NextResponse.json({ error: 'Error obteniendo uso' }, { status: 500 });
    }

    const used = normalizeUsageFromTransactions(transactions || []);

    const limits = plan.fair_use.monthly;
    const warn_threshold = plan.fair_use.warn_threshold ?? FAIR_USE_WARN_THRESHOLD;

    let limit: number;
    let usedValue: number;
    switch (category) {
      case 'reports':
        limit = limits.reports;
        usedValue = used.reports;
        break;
      case 'transcription_minutes':
        limit = limits.transcription_minutes;
        usedValue = used.transcription_minutes;
        break;
      case 'chat_tokens':
        limit = limits.chat_tokens;
        usedValue = used.chat_tokens;
        break;
      default:
        return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 });
    }

    const proposed = usedValue + qty;
    let status: FairUseCheckResult['status'] = 'ok';

    if (proposed > limit) {
      status = 'block';
    } else if (proposed / limit >= warn_threshold) {
      status = 'warn';
    }

    const res: FairUseCheckResult = {
      status,
      category,
      plan_type: activePlan.plan_type,
      limit,
      used: usedValue,
      proposed,
      remaining: Math.max(0, limit - usedValue),
      warn_threshold,
      message:
        status === 'block'
          ? 'Has superado el límite mensual de uso para tu plan.'
          : status === 'warn'
          ? 'Estás cerca de alcanzar el límite mensual de uso de tu plan.'
          : undefined
    };

    const statusCode = status === 'block' ? 429 : 200;
    return NextResponse.json(res, { status: statusCode });
  } catch (error) {
    console.error('Error in /api/credits/check-usage:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
