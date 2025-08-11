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
  plan_id: z.enum(['basic', 'intermediate', 'premium'])
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
    const { plan_id } = createPreferenceSchema.parse(body) as CreatePreferenceRequest;

    // Obtener plan seleccionado
    const selectedPlan = CREDIT_PLANS.find(plan => plan.id === plan_id);
    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
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
    const externalReference = `${userId}-${plan_id}-${Date.now()}`;
    const urls = getPaymentUrls(baseUrl);

    // Crear preferencia de Mercado Pago
    const preference: MercadoPagoPreference = {
      items: [
        {
          id: selectedPlan.id,
          title: `Plan ${selectedPlan.name} - ${selectedPlan.credits} créditos`,
          description: selectedPlan.description,
          quantity: 1,
          currency_id: MP_CONFIG.CURRENCY,
          unit_price: selectedPlan.price_uyu
        }
      ],
      external_reference: externalReference,
      back_urls: {
        success: urls.success,
        failure: urls.failure,
        pending: urls.pending
      },
      notification_url: urls.notification,
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_types: [...MP_CONFIG.EXCLUDED_PAYMENT_TYPES],
        installments: MP_CONFIG.MAX_INSTALLMENTS
      },
      metadata: {
        user_id: userId,
        plan_id: selectedPlan.id,
        credits: selectedPlan.credits
      }
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
        plan_type: selectedPlan.id,
        amount_usd: selectedPlan.price_usd,
        amount_uyu: selectedPlan.price_uyu,
        credits: selectedPlan.credits,
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
