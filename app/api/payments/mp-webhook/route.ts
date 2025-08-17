// app/api/payments/mp-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { mapMPStatusToInternal } from '@/types/payments';
import type { MercadoPagoWebhookData, MercadoPagoPayment } from '@/types/payments';
import { sendBalanceUpdate } from '@/lib/sse-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verificar firma del webhook
function verifyWebhookSignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Obtener detalles del pago desde Mercado Pago
async function getPaymentDetails(paymentId: string): Promise<MercadoPagoPayment | null> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('MercadoPago access token not configured');
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch payment ${paymentId}:`, response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return null;
  }
}

// Procesar pago aprobado
async function processApprovedPayment(payment: MercadoPagoPayment) {
  const { external_reference } = payment;
  
  // Buscar preferencia de pago
  const { data: preference, error: prefError } = await supabase
    .from('payment_preferences')
    .select('*')
    .eq('external_reference', external_reference)
    .eq('status', 'pending')
    .single();

  if (prefError || !preference) {
    console.error('Payment preference not found:', external_reference);
    return;
  }

  // Actualizar estado de la preferencia
  const { error: updateError } = await supabase
    .from('payment_preferences')
    .update({
      status: 'approved',
      mp_payment_id: payment.id.toString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', preference.id);

  if (updateError) {
    console.error('Error updating payment preference:', updateError);
    return;
  }

  // Acreditar créditos al usuario
  const { error: creditError } = await supabase.rpc('credit_user_credits', {
    p_user_id: preference.user_id,
    p_credits_amount: preference.credits,
    p_description: `Compra de plan ${preference.plan_type} - ${preference.credits} créditos`,
    p_metadata: {
      payment_id: payment.id,
      external_reference: external_reference,
      plan_type: preference.plan_type,
      amount_uyu: preference.amount_uyu
    }
  });

  if (creditError) {
    console.error('Error crediting user credits:', creditError);
    // Revertir estado de preferencia si falla la acreditación
    await supabase
      .from('payment_preferences')
      .update({ status: 'pending' })
      .eq('id', preference.id);
    return;
  }

  console.log(`Credits successfully added for user ${preference.user_id}: ${preference.credits} credits`);

  // Enviar actualización en tiempo real
  try {
    // Obtener nuevo balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', preference.user_id)
      .single();

    if (wallet) {
      sendBalanceUpdate(preference.user_id, wallet.balance, {
        type: 'credit',
        amount: preference.credits,
        description: `Compra de plan ${preference.plan_type}`,
        payment_id: payment.id
      });
    }
  } catch (sseError) {
    console.error('Error sending SSE update for payment:', sseError);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-signature');
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    // Verificar firma del webhook (opcional pero recomendado)
    if (webhookSecret && !verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const webhookData: MercadoPagoWebhookData = JSON.parse(body);

    // Solo procesar eventos de pago
    if (webhookData.type !== 'payment') {
      return NextResponse.json({ message: 'Event type not handled' });
    }

    const paymentId = webhookData.data.id;
    console.log(`Processing payment webhook for payment ID: ${paymentId}`);

    // Obtener detalles del pago
    const payment = await getPaymentDetails(paymentId);
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Procesar según el estado del pago
    const internalStatus = mapMPStatusToInternal(payment.status);

    if (internalStatus === 'approved') {
      await processApprovedPayment(payment);
    } else if (internalStatus === 'rejected') {
      // Actualizar preferencia como rechazada
      await supabase
        .from('payment_preferences')
        .update({
          status: 'rejected',
          mp_payment_id: payment.id.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('external_reference', payment.external_reference);
    }

    return NextResponse.json({ message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Método GET para verificación del webhook (requerido por Mercado Pago)
export async function GET() {
  return NextResponse.json({ message: 'Webhook endpoint active' });
}
