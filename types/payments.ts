// types/payments.ts
export interface PaymentPreference {
  id: string;
  user_id: string;
  external_reference: string;
  preference_id: string;
  init_point: string;
  plan_type: string;
  amount_usd: number;
  amount_uyu: number;
  credits: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  mp_payment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePreferenceRequest {
  plan_id: string;
}

export interface CreatePreferenceResponse {
  preference_id: string;
  init_point: string;
  external_reference: string;
}

export interface MercadoPagoItem {
  id: string;
  title: string;
  description: string;
  quantity: number;
  currency_id: string;
  unit_price: number;
}

export interface MercadoPagoPreference {
  items: MercadoPagoItem[];
  external_reference: string;
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  notification_url: string;
  auto_return: 'approved' | 'all';
  payment_methods: {
    excluded_payment_types: Array<{ id: string }>;
    installments: number;
  };
  metadata: {
    user_id: string;
    plan_id: string;
    credits: number;
  };
}

export interface MercadoPagoWebhookData {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: number;
  user_id: number;
  version: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

export interface MercadoPagoPayment {
  id: number;
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
  status_detail: string;
  external_reference: string;
  transaction_amount: number;
  currency_id: string;
  date_created: string;
  date_approved?: string;
  payer: {
    id?: string;
    email?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  payment_method_id: string;
  payment_type_id: string;
  metadata: Record<string, any>;
}

export interface PaymentVerificationResult {
  success: boolean;
  payment?: MercadoPagoPayment;
  error?: string;
}

// Configuración de Mercado Pago para Uruguay
export const MP_CONFIG = {
  CURRENCY: 'UYU',
  COUNTRY: 'UY',
  EXCLUDED_PAYMENT_TYPES: [
    { id: 'ticket' }, // Excluir pagos en efectivo
    { id: 'atm' }     // Excluir cajeros automáticos
  ],
  MAX_INSTALLMENTS: 12,
  WEBHOOK_EVENTS: [
    'payment.created',
    'payment.updated'
  ]
} as const;

// URLs de retorno
export const getPaymentUrls = (baseUrl: string) => ({
  success: `${baseUrl}/credits?payment=success`,
  failure: `${baseUrl}/credits?payment=failure`,
  pending: `${baseUrl}/credits?payment=pending`,
  notification: `${baseUrl}/api/payments/mp-webhook`
});

// Mapeo de estados de Mercado Pago a estados internos
export const mapMPStatusToInternal = (mpStatus: string): PaymentPreference['status'] => {
  switch (mpStatus) {
    case 'approved':
      return 'approved';
    case 'rejected':
    case 'cancelled':
    case 'refunded':
    case 'charged_back':
      return 'rejected';
    case 'pending':
    case 'authorized':
    case 'in_process':
    case 'in_mediation':
    default:
      return 'pending';
  }
};
