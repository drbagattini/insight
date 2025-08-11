// lib/credits.ts
import { CREDIT_COSTS, type FairUseCheckResult } from '@/types/credits';

/**
 * Función utilitaria para debitar créditos desde APIs del servidor
 */
export async function debitCredits(
  request: Request,
  type: 'report' | 'transcription' | 'supervisor_chat',
  quantity: number,
  description: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string; credits_needed?: number }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const debitResponse = await fetch(`${baseUrl}/api/credits/debit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        type,
        quantity,
        description,
        metadata: metadata || {}
      })
    });

    if (!debitResponse.ok) {
      const debitError = await debitResponse.json();
      
      if (debitResponse.status === 402) {
        // Créditos insuficientes
        return {
          success: false,
          error: 'Créditos insuficientes',
          credits_needed: calculateCreditsNeeded(type, quantity)
        };
      }
      
      return {
        success: false,
        error: debitError.error || 'Error al debitar créditos'
      };
    }

    return { success: true };
    
  } catch (error) {
    console.error('Error debiting credits:', error);
    return {
      success: false,
      error: 'Error interno al debitar créditos'
    };
  }
}

/**
 * Calcula los créditos necesarios para una operación
 */
export function calculateCreditsNeeded(type: 'report' | 'transcription' | 'supervisor_chat', quantity: number): number {
  switch (type) {
    case 'report':
      return CREDIT_COSTS.REPORT;
    case 'transcription':
      return Math.ceil(quantity * CREDIT_COSTS.WHISPER_PER_MINUTE);
    case 'supervisor_chat':
      return Math.ceil(quantity / 1000 * CREDIT_COSTS.CHAT_PER_1K_TOKENS);
    default:
      throw new Error(`Tipo de operación no válido: ${type}`);
  }
}

/**
 * Verifica si el usuario tiene créditos suficientes (sin debitarlos)
 */
export async function checkCreditsBalance(
  request: Request
): Promise<{ balance: number; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const balanceResponse = await fetch(`${baseUrl}/api/credits/balance`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    if (!balanceResponse.ok) {
      return {
        balance: 0,
        error: 'Error al obtener balance de créditos'
      };
    }

    const balanceData = await balanceResponse.json();
    return { balance: balanceData.balance || 0 };
    
  } catch (error) {
    console.error('Error checking credits balance:', error);
    return {
      balance: 0,
      error: 'Error interno al verificar balance'
    };
  }
}

/**
 * Verifica límites de fair-use antes de realizar una operación
 */
export async function checkFairUse(
  request: Request,
  type: 'report' | 'transcription' | 'supervisor_chat',
  quantity: number
): Promise<FairUseCheckResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Mapear tipos a categorías de fair-use
    let category: 'reports' | 'transcription_minutes' | 'chat_tokens';
    let checkQuantity: number;
    
    switch (type) {
      case 'report':
        category = 'reports';
        checkQuantity = 1; // cada informe cuenta como 1
        break;
      case 'transcription':
        category = 'transcription_minutes';
        checkQuantity = Math.ceil(quantity);
        break;
      case 'supervisor_chat':
        category = 'chat_tokens';
        checkQuantity = Math.ceil(quantity);
        break;
    }
    
    const checkResponse = await fetch(`${baseUrl}/api/credits/check-usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        category,
        quantity: checkQuantity
      })
    });

    if (!checkResponse.ok) {
      // Si hay error HTTP, intentar parsear la respuesta como FairUseCheckResult
      try {
        const errorResult = await checkResponse.json() as FairUseCheckResult;
        return errorResult;
      } catch {
        // Fallback si no se puede parsear
        return {
          status: 'ok',
          category,
          plan_type: null,
          limit: null,
          used: 0,
          proposed: checkQuantity,
          remaining: null,
          warn_threshold: 0.8,
          message: 'Error al verificar límites de uso'
        };
      }
    }

    const result = await checkResponse.json() as FairUseCheckResult;
    return result;
    
  } catch (error) {
    console.error('Error checking fair use:', error);
    return {
      status: 'ok',
      category: type === 'report' ? 'reports' : type === 'transcription' ? 'transcription_minutes' : 'chat_tokens',
      plan_type: null,
      limit: null,
      used: 0,
      proposed: quantity,
      remaining: null,
      warn_threshold: 0.8,
      message: 'Error interno al verificar límites'
    };
  }
}
