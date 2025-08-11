// app/api/mp/create-preference/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Inicializar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
  }
});

const preference = new Preference(client);

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session?.user?.email) {
      console.log('No session or email found');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    const { plan_id, planId, items, external_reference } = body;
    
    const selectedPlanId = plan_id || planId;
    
    if (!selectedPlanId) {
      return NextResponse.json({ error: 'Plan ID requerido' }, { status: 400 });
    }
    
    // Definir planes disponibles
    const CREDIT_PLANS = [
      { id: 'basic', name: 'Plan Básico', credits: 500, price_uyu: 500, price_usd: 12 },
      { id: 'pro', name: 'Plan Pro', credits: 1200, price_uyu: 1000, price_usd: 24, popular: true },
      { id: 'premium', name: 'Plan Premium', credits: 2500, price_uyu: 1800, price_usd: 43 }
    ];
    
    // Verificar si es una compra directa
    let selectedPlan = CREDIT_PLANS.find(p => p.id === selectedPlanId);
    
    // Si no es un plan estándar, verificar si es compra directa
    if (!selectedPlan && selectedPlanId.startsWith('direct_')) {
      // Para compras directas, usar los items proporcionados
      if (!items || items.length === 0) {
        return NextResponse.json({ error: 'Items requeridos para compra directa' }, { status: 400 });
      }
      // Crear un "plan" temporal para compras directas
      selectedPlan = {
        id: selectedPlanId,
        name: 'Compra Directa',
        credits: 0, // Se calculará desde los items
        price_uyu: items[0].unit_price,
        price_usd: Math.round(items[0].unit_price / 45)
      };
    }
    
    if (!selectedPlan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }
    
    // Crear items basado en el plan si no se proporcionaron
    const planItems = items || [{
      id: selectedPlan.id,
      title: `${selectedPlan.name} - ${selectedPlan.credits} créditos`,
      quantity: 1,
      unit_price: selectedPlan.price_uyu
    }];
    
    if (!Array.isArray(planItems) || planItems.length === 0) {
      return NextResponse.json({ error: 'Items requeridos' }, { status: 400 });
    }

    // Obtener información del usuario
    console.log('Session user:', session.user);
    
    // Buscar por ID si existe, sino por email
    const userId = session.user.id;
    const userEmail = session.user.email;
    
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq(userId ? 'id' : 'email', userId || userEmail)
      .single();

    console.log('User query result:', { user, userError, searchBy: userId ? 'id' : 'email', searchValue: userId || userEmail });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Crear external_reference único
    const externalRef = external_reference || `order_${user.id}_${Date.now()}`;

    // Crear la preferencia de pago
    const preferenceData = {
      items: planItems.map((item: any) => ({
        id: item.id || selectedPlanId,
        title: item.title,
        quantity: item.quantity || 1,
        currency_id: 'UYU',
        unit_price: item.unit_price
      })),
      external_reference: externalRef,
      payer: {
        email: user.email,
        name: user.full_name || user.email.split('@')[0]
      },
      back_urls: {
        success: `${process.env.APP_URL}/pago/success`,
        pending: `${process.env.APP_URL}/pago/pending`, 
        failure: `${process.env.APP_URL}/pago/failure`
      },
      auto_return: 'approved',
      notification_url: `${process.env.APP_URL}/api/webhooks/mp`,
      statement_descriptor: 'INSIGHT_CREDITS',
      metadata: {
        user_id: user.id,
        plan_id: selectedPlanId,
        integration_type: 'checkout_pro'
      }
    };

    console.log('Creating MP preference:', preferenceData);

    const result = await preference.create({ body: preferenceData });

    if (!result.id || !result.init_point) {
      throw new Error('Error creating preference');
    }

    // Guardar la orden en estado pending
    const { error: orderError } = await supabase
      .from('payment_orders')
      .insert({
        id: result.id,
        user_id: user.id,
        external_reference: externalRef,
        status: 'pending',
        amount: planItems.reduce((sum: number, item: any) => sum + (item.unit_price * (item.quantity || 1)), 0),
        currency: 'UYU',
        plan_id: selectedPlanId,
        mp_preference_id: result.id,
        metadata: {
          items,
          mp_response: result
        }
      });

    if (orderError) {
      console.error('Error saving order:', orderError);
      // No fallar la request, solo loggear
    }

    return NextResponse.json({
      id: result.id,
      init_point: result.init_point,
      external_reference: externalRef
    });

  } catch (error) {
    console.error('Error creating MP preference:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
