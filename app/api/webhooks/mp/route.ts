// app/api/webhooks/mp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Inicializar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
});

const payment = new Payment(client);

// Verificar firma del webhook
function verifySignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string
): boolean {
  try {
    // Extraer ts y v1 del header x-signature
    const parts = xSignature.split(',');
    let ts = '';
    let hash = '';
    
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key && value) {
        if (key.trim() === 'ts') {
          ts = value.trim();
        } else if (key.trim() === 'v1') {
          hash = value.trim();
        }
      }
    }

    if (!ts || !hash) {
      console.error('Missing ts or v1 in signature');
      return false;
    }

    // Construir el manifest
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    
    // Calcular HMAC-SHA256
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    console.log('Signature verification:', {
      manifest,
      expectedHash,
      receivedHash: hash,
      valid: expectedHash === hash
    });

    return expectedHash === hash;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Webhook received:', body);

    // Headers de seguridad
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');

    if (!xSignature || !xRequestId) {
      console.error('Missing security headers');
      return NextResponse.json({ error: 'Missing security headers' }, { status: 401 });
    }

    // Verificar que tenemos el webhook secret
    if (!process.env.MP_WEBHOOK_SECRET) {
      console.error('MP_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verificar firma
    const dataId = body.data?.id || body.id;
    if (!dataId) {
      console.error('Missing data ID in webhook');
      return NextResponse.json({ error: 'Missing data ID' }, { status: 400 });
    }

    const isValidSignature = verifySignature(
      xSignature,
      xRequestId,
      dataId.toString(),
      process.env.MP_WEBHOOK_SECRET
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Procesar según el tipo de evento
    const { type, action } = body;

    if (type === 'payment') {
      await handlePaymentWebhook(dataId);
    } else if (type === 'merchant_order') {
      await handleMerchantOrderWebhook(dataId);
    } else {
      console.log('Unhandled webhook type:', type);
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handlePaymentWebhook(paymentId: string) {
  try {
    console.log('Processing payment webhook:', paymentId);

    // Consultar el pago en Mercado Pago
    const paymentData = await payment.get({ id: paymentId });
    
    if (!paymentData) {
      console.error('Payment not found:', paymentId);
      return;
    }

    console.log('Payment data:', paymentData);

    const { status, external_reference, transaction_amount, currency_id } = paymentData;

    if (!external_reference) {
      console.error('No external_reference in payment');
      return;
    }

    // Buscar la orden en nuestra base de datos
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('external_reference', external_reference)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', external_reference, orderError);
      return;
    }

    // Mapear estado de MP a nuestro estado
    let orderStatus = 'pending';
    if (status === 'approved') {
      orderStatus = 'approved';
    } else if (status === 'rejected' || status === 'cancelled') {
      orderStatus = 'rejected';
    }

    // Actualizar la orden
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        status: orderStatus,
        mp_payment_id: paymentId,
        mp_status: status,
        processed_at: new Date().toISOString(),
        metadata: {
          ...order.metadata,
          mp_payment_data: paymentData
        }
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return;
    }

    // Si el pago fue aprobado, procesar créditos
    if (orderStatus === 'approved') {
      await processApprovedPayment(order, paymentData);
    }

  } catch (error) {
    console.error('Error handling payment webhook:', error);
  }
}

async function handleMerchantOrderWebhook(merchantOrderId: string) {
  console.log('Processing merchant order webhook:', merchantOrderId);
  // Implementar si necesitas manejar merchant orders
}

async function processApprovedPayment(order: any, paymentData: any) {
  try {
    console.log('Processing approved payment for order:', order.id);

    // Obtener el plan de créditos
    const planId = order.plan_id;
    if (!planId) {
      console.error('No plan_id in order');
      return;
    }

    // Buscar el plan en los planes definidos
    const CREDIT_PLANS = [
      { id: 'basic', credits: 500, price_uyu: 500, price_usd: 12 },
      { id: 'pro', credits: 1200, price_uyu: 1000, price_usd: 24 },
      { id: 'premium', credits: 2500, price_uyu: 1800, price_usd: 43 }
    ];

    let plan = CREDIT_PLANS.find(p => p.id === planId);
    
    // Si es una compra directa, calcular créditos desde el metadata
    if (!plan && planId && planId.startsWith('direct_')) {
      // Para compras directas, extraer créditos del título o metadata
      const orderMetadata = order.metadata;
      let credits = 0;
      
      if (orderMetadata && orderMetadata.items && orderMetadata.items[0]) {
        const title = orderMetadata.items[0].title;
        const creditMatch = title.match(/(\d+)\s*créditos/);
        if (creditMatch) {
          credits = parseInt(creditMatch[1]);
        }
      }
      
      if (credits > 0) {
        plan = {
          id: planId,
          credits: credits,
          price_uyu: paymentData.transaction_amount,
          price_usd: Math.round(paymentData.transaction_amount / 45)
        };
      }
    }
    
    if (!plan) {
      console.error('Plan not found:', planId);
      return;
    }

    // Agregar créditos al usuario
    const { error: creditError } = await supabase.rpc('add_credits', {
      p_user_id: order.user_id,
      p_amount: plan.credits,
      p_description: `Compra de plan ${plan.id} - ${plan.credits} créditos`,
      p_metadata: {
        plan_id: planId,
        mp_payment_id: paymentData.id,
        order_id: order.id,
        amount_paid: paymentData.transaction_amount,
        currency: paymentData.currency_id
      }
    });

    if (creditError) {
      console.error('Error adding credits:', creditError);
      return;
    }

    console.log(`Successfully added ${plan.credits} credits to user ${order.user_id}`);

  } catch (error) {
    console.error('Error processing approved payment:', error);
  }
}
