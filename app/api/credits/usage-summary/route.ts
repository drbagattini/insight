// app/api/credits/usage-summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';
import {
  CREDIT_PLANS,
  FAIR_USE_WARN_THRESHOLD
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    const monthStart = monthStartISO();

    // Obtener plan activo del mes
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
      console.error('[usage-summary] error fetching plan:', planErr);
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
      console.error('[usage-summary] error fetching transactions:', txErr);
      return NextResponse.json({ error: 'Error obteniendo uso' }, { status: 500 });
    }

    const usage = normalizeUsageFromTransactions(transactions || []);

    // Si no hay plan activo, retornar sin límites
    if (!activePlan?.plan_type) {
      return NextResponse.json({
        plan_type: null,
        limits: null,
        usage,
        warn_threshold: FAIR_USE_WARN_THRESHOLD
      });
    }

    const plan = CREDIT_PLANS.find(p => p.id === activePlan.plan_type);
    if (!plan?.fair_use?.monthly) {
      return NextResponse.json({
        plan_type: activePlan.plan_type,
        limits: null,
        usage,
        warn_threshold: FAIR_USE_WARN_THRESHOLD
      });
    }

    return NextResponse.json({
      plan_type: activePlan.plan_type,
      limits: plan.fair_use.monthly,
      usage,
      warn_threshold: plan.fair_use.warn_threshold ?? FAIR_USE_WARN_THRESHOLD
    });

  } catch (error) {
    console.error('Error in /api/credits/usage-summary:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
