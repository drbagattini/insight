// types/credits.ts
export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CreditPlan {
  id: string;
  name: string;
  credits: number;
  price_usd: number;
  price_uyu: number;
  description: string;
  popular?: boolean;
  equivalences: {
    supervision_sessions: number;
    sessions_45min: number;
    synthesis_evolutions: number;
    reports: number;
  };
  // Límites de fair-use mensuales para suscripción (no afectan el saldo de créditos)
  fair_use?: {
    monthly: {
      reports: number; // cantidad de informes/mes
      transcription_minutes: number; // minutos/mes
      chat_tokens: number; // tokens de chat/mes
      sessions_per_patient: number; // sesiones de supervisión/mes por paciente (aprox)
    };
    warn_threshold?: number; // default: FAIR_USE_WARN_THRESHOLD
  };
}

export interface CreditUsage {
  supervision_sessions: number;
  sessions_45min: number;
  synthesis_evolutions: number;
  reports: number;
}

export interface DebitCreditsRequest {
  type: 'report' | 'transcription' | 'supervisor_chat';
  quantity: number;
  description: string;
  metadata?: Record<string, any>;
}

export interface CreditBalance {
  balance: number;
  usage: CreditUsage;
}

export interface TransactionHistory {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
}

// Constantes del sistema de créditos
export const CREDIT_COSTS = {
  REPORT: 8,           // 8 créditos por informe
  WHISPER_PER_MINUTE: 1, // 1 crédito por minuto de audio
  CHAT_PER_1K_TOKENS: 1  // 1 crédito por cada 1,000 tokens
} as const;

// Tokens consumidos por una sesión típica de supervisión (chat)
// Recomendación: 80k tokens por sesión (~1 consulta completa)
export const TOKENS_PER_SUPERVISION_SESSION = 80_000;

// Umbral por defecto para advertencia de fair use (80%)
export const FAIR_USE_WARN_THRESHOLD = 0.8;

// Resultado estándar del chequeo de fair-use
export interface FairUseCheckResult {
  status: 'ok' | 'warn' | 'block' | 'no_plan';
  category: 'reports' | 'transcription_minutes' | 'chat_tokens';
  plan_type: string | null;
  limit: number | null;
  used: number; // uso actual del mes para la categoría
  proposed: number; // uso actual + intento
  remaining: number | null;
  warn_threshold: number; // valor [0-1]
  message?: string;
}

export const CREDIT_PLANS: CreditPlan[] = [
  {
    id: 'basic',
    name: 'Básico',
    credits: 800,
    price_usd: 8,
    price_uyu: 320, // $8 USD * 40 (tasa aproximada UYU)
    description: 'Ideal para empezar - 3 informes mensuales',
    equivalences: {
      supervision_sessions: 15, // 15 sesiones de supervisión (600 créditos)
      sessions_45min: 2, // 2 sesiones de 45min (90 créditos)
      synthesis_evolutions: 6, // 6 síntesis de evoluciones (4.5 créditos)
      reports: 3 // 3 informes por mes (24 créditos)
    },
    fair_use: {
      monthly: {
        reports: 3,
        transcription_minutes: 2 * 45,
        chat_tokens: 686000,
        sessions_per_patient: Math.floor(686000 / TOKENS_PER_SUPERVISION_SESSION)
      },
      warn_threshold: FAIR_USE_WARN_THRESHOLD
    }
  },
  {
    id: 'intermediate',
    name: 'Intermedio',
    credits: 1400,
    price_usd: 14,
    price_uyu: 560, // $14 USD * 40
    description: 'Para consulta semanal - 8 informes mensuales',
    popular: true,
    equivalences: {
      supervision_sessions: 25, // 25 sesiones de supervisión (1000 créditos)
      sessions_45min: 4, // 4 sesiones de 45min (180 créditos)
      synthesis_evolutions: 10, // 10 síntesis de evoluciones (7.5 créditos)
      reports: 8 // 8 informes por mes (64 créditos)
    },
    fair_use: {
      monthly: {
        reports: 8,
        transcription_minutes: 4 * 45,
        chat_tokens: 1156000,
        sessions_per_patient: Math.floor(1156000 / TOKENS_PER_SUPERVISION_SESSION)
      },
      warn_threshold: FAIR_USE_WARN_THRESHOLD
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    credits: 2500,
    price_usd: 25,
    price_uyu: 1000, // $25 USD * 40
    description: 'Uso intensivo - 12 informes mensuales + IA ilimitada',
    equivalences: {
      supervision_sessions: 40, // 40 sesiones de supervisión (1600 créditos)
      sessions_45min: 8, // 8 sesiones de 45min (360 créditos)
      synthesis_evolutions: 20, // 20 síntesis de evoluciones (15 créditos)
      reports: 12 // 12 informes por mes (96 créditos)
    },
    fair_use: {
      monthly: {
        reports: 12,
        transcription_minutes: 8 * 45,
        chat_tokens: 2044000,
        sessions_per_patient: Math.floor(2044000 / TOKENS_PER_SUPERVISION_SESSION)
      },
      warn_threshold: FAIR_USE_WARN_THRESHOLD
    }
  }
];

export const calculateCreditUsage = (balance: number): CreditUsage => {
  return {
    supervision_sessions: Math.floor(balance / 80), // 80 créditos por sesión de supervisión
    sessions_45min: Math.floor(balance / (45 * CREDIT_COSTS.WHISPER_PER_MINUTE)),
    synthesis_evolutions: Math.floor(balance / 0.75), // ~0.75 créditos por síntesis
    reports: Math.floor(balance / CREDIT_COSTS.REPORT)
  };
};
