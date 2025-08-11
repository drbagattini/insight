// app/api/credits/test-purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { CREDIT_PLANS } from '@/types/credits';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const testPurchaseSchema = z.object({
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
    const { plan_id } = testPurchaseSchema.parse(body);

    // Obtener plan seleccionado
    const selectedPlan = CREDIT_PLANS.find(plan => plan.id === plan_id);
    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    // Simular compra exitosa - agregar créditos directamente
    const { data: wallet, error: walletError } = await supabase
      .from('credit_wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError && walletError.code !== 'PGRST116') {
      console.error('Error fetching wallet:', walletError);
      return NextResponse.json(
        { error: 'Error al obtener wallet' },
        { status: 500 }
      );
    }

    // Crear wallet si no existe
    if (!wallet) {
      const { error: createWalletError } = await supabase
        .from('credit_wallets')
        .insert({
          user_id: userId,
          balance: selectedPlan.credits,
          total_purchased: selectedPlan.credits,
          total_used: 0
        });

      if (createWalletError) {
        console.error('Error creating wallet:', createWalletError);
        return NextResponse.json(
          { error: 'Error al crear wallet' },
          { status: 500 }
        );
      }
    } else {
      // Actualizar wallet existente
      const { error: updateWalletError } = await supabase
        .from('credit_wallets')
        .update({
          balance: wallet.balance + selectedPlan.credits,
          total_purchased: wallet.total_purchased + selectedPlan.credits
        })
        .eq('user_id', userId);

      if (updateWalletError) {
        console.error('Error updating wallet:', updateWalletError);
        return NextResponse.json(
          { error: 'Error al actualizar wallet' },
          { status: 500 }
        );
      }
    }

    // Registrar transacción
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'purchase',
        amount: selectedPlan.credits,
        description: `Compra de prueba - Plan ${selectedPlan.name}`,
        metadata: {
          plan_id: selectedPlan.id,
          plan_name: selectedPlan.name,
          price_usd: selectedPlan.price_usd,
          price_uyu: selectedPlan.price_uyu,
          test_purchase: true
        }
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return NextResponse.json(
        { error: 'Error al registrar transacción' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `¡Compra de prueba exitosa! Se agregaron ${selectedPlan.credits} créditos a tu cuenta.`,
      credits_added: selectedPlan.credits,
      plan: selectedPlan.name
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in test purchase API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
