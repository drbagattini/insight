// app/api/credits/test-direct-purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const directPurchaseSchema = z.object({
  amount_usd: z.number().min(1).max(100),
  credits: z.number().min(1)
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
    const { amount_usd, credits } = directPurchaseSchema.parse(body);

    // Simular compra exitosa - agregar créditos directamente
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
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
        .from('wallets')
        .insert({
          user_id: userId,
          balance: credits
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
        .from('wallets')
        .update({
          balance: wallet.balance + credits
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
    const { data: newWallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .single();

    const { error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: newWallet?.id || wallet?.id,
        user_id: userId,
        type: 'credit',
        amount: credits,
        description: `Compra directa de ${credits} créditos por $${amount_usd} USD`,
        metadata: {
          amount_usd: amount_usd,
          amount_uyu: amount_usd * 40, // Aproximación
          credits: credits,
          purchase_type: 'direct',
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
      message: `¡Compra exitosa! Se agregaron ${credits.toLocaleString()} créditos a tu cuenta por $${amount_usd} USD.`,
      credits_added: credits,
      amount_paid: amount_usd
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in direct purchase API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
