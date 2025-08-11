// app/api/credits/balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { calculateCreditUsage } from '@/types/credits';
import type { CreditBalance } from '@/types/credits';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
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

    // Obtener o crear billetera del usuario
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      // No existe billetera, crearla
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          balance: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating wallet:', createError);
        return NextResponse.json(
          { error: 'Error al crear billetera' },
          { status: 500 }
        );
      }

      wallet = newWallet;
    } else if (walletError) {
      console.error('Error fetching wallet:', walletError);
      return NextResponse.json(
        { error: 'Error al obtener balance' },
        { status: 500 }
      );
    }

    // Calcular equivalencias de uso
    const usage = calculateCreditUsage(wallet.balance);

    const response: CreditBalance = {
      balance: wallet.balance,
      usage
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in credits balance API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
