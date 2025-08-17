// app/api/payments/create-preference/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { CREDIT_PLANS } from '@/types/credits';
import { MP_CONFIG, getPaymentUrls } from '@/types/payments';
import type { 
  CreatePreferenceRequest, 
  CreatePreferenceResponse, 
  MercadoPagoPreference 
} from '@/types/payments';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schema de validación
const createPreferenceSchema = z.object({
  plan_id: z.enum(['basic', 'intermediate', 'premium']).optional(),
  purchase_type: z.enum(['plan', 'direct']).optional(),
  amount_usd: z.number().min(1).max(100).optional(),
  credits: z.number().min(1).optional(),
  description: z.string().optional()
});

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
    console.log('[DEBUG] Request body:', body);
    const { plan_id, purchase_type, amount_usd, credits, description } = createPreferenceSchema.parse(body);
    console.log('[DEBUG] Parsed data:', { plan_id, purchase_type, amount_usd, credits, description });

    let selectedPlan;
    let purchaseData;

    if (purchase_type === 'direct') {
      // Compra directa
      if (!amount_usd || !credits) {
        return NextResponse.json(
          { error: 'Datos de compra directa incompletos' },
          { status: 400 }
        );
      }
      purchaseData = {
        id: `direct-${Date.now()}`,
        title: `Compra directa de ${credits} créditos`,
        price_usd: amount_usd,
        price_uyu: amount_usd * 40,
        credits: credits,
        description: description || `${credits} créditos por $${amount_usd} USD`
      };
    } else {
      // Compra por plan
      if (!plan_id) {
        return NextResponse.json(
          { error: 'Plan ID requerido' },
          { status: 400 }
        );
      }
      selectedPlan = CREDIT_PLANS.find(plan => plan.id === plan_id);
      if (!selectedPlan) {
        return NextResponse.json(
          { error: 'Plan no encontrado' },
          { status: 404 }
        );
      }
      purchaseData = selectedPlan;
    }

    // Verificar variables de entorno
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    if (!accessToken) {
      console.error('Missing MercadoPago configuration: MERCADOPAGO_ACCESS_TOKEN is not set');
      return NextResponse.json(
        { error: 'Configuración de pagos no disponible' },
        { status: 500 }
      );
    }

    // Generar referencia externa única
    const referenceId = purchase_type === 'direct' ? `direct-${Date.now()}` : plan_id;
    const externalReference = `${userId}-${referenceId}-${Date.now()}`;
    const urls = getPaymentUrls(baseUrl);

    // Crear preferencia de Mercado Pago
    const preference: MercadoPagoPreference = {
      items: [
        {
          id: purchaseData.id,
          title: purchase_type === 'direct' ? (purchaseData as any).title : `Plan ${(purchaseData as any).name} - ${purchaseData.credits} créditos`,
          description: purchaseData.description,
          quantity: 1,
          currency_id: MP_CONFIG.CURRENCY,
          unit_price: purchaseData.price_uyu
        }
      ],
      external_reference: externalReference,
      auto_return: 'approved',
      back_urls: {
        success: urls.success,
        failure: urls.failure,
        pending: urls.pending
      },
      notification_url: urls.notification,
      payment_methods: {
        excluded_payment_types: [...MP_CONFIG.EXCLUDED_PAYMENT_TYPES],
        installments: MP_CONFIG.MAX_INSTALLMENTS
      },
      metadata: {
        user_id: userId,
        purchase_type: purchase_type || 'plan',
        plan_id: selectedPlan?.id || '',
        credits: purchaseData.credits,
        amount_usd: purchase_type === 'direct' ? amount_usd : null
      } as any
    };

    // Llamar a la API de Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json();
      console.error('MercadoPago API error:', errorData);
      return NextResponse.json(
        { error: 'Error al crear preferencia de pago' },
        { status: 500 }
      );
    }

    const mpData = await mpResponse.json();

    // Guardar preferencia en base de datos
    const { error: dbError } = await supabase
      .from('payment_preferences')
      .insert({
        user_id: userId,
        external_reference: externalReference,
        preference_id: mpData.id,
        init_point: mpData.init_point,
        plan_type: purchase_type === 'direct' ? 'direct' : selectedPlan?.id,
        amount_usd: purchaseData.price_usd,
        amount_uyu: purchaseData.price_uyu,
        credits: purchaseData.credits,
        status: 'pending'
      });

    if (dbError) {
      console.error('Error saving payment preference:', dbError);
      return NextResponse.json(
        { error: 'Error al guardar preferencia' },
        { status: 500 }
      );
    }

    const response: CreatePreferenceResponse = {
      preference_id: mpData.id,
      init_point: mpData.init_point,
      external_reference: externalReference
    };

    return NextResponse.json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in create preference API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
