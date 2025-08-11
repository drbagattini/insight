// app/api/credits/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';
import type { TransactionHistory } from '@/types/credits';

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
    const { searchParams } = new URL(request.url);
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Máximo 100
    const offset = (page - 1) * limit;

    // Obtener total de transacciones
    const { count, error: countError } = await supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('Error counting transactions:', countError);
      return NextResponse.json(
        { error: 'Error al obtener historial' },
        { status: 500 }
      );
    }

    // Obtener transacciones paginadas
    const { data: transactions, error: transactionsError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return NextResponse.json(
        { error: 'Error al obtener transacciones' },
        { status: 500 }
      );
    }

    const response: TransactionHistory = {
      transactions: transactions || [],
      total: count || 0,
      page,
      limit
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in credits history API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
