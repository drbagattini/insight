// components/credits/CreditBalance.tsx
'use client';

import { useCredits } from '@/hooks/useCredits';
import { Coins, FileText, Mic, MessageSquare, Loader2, Brain, BarChart3 } from 'lucide-react';

export default function CreditBalance() {
  const { data: credits, isLoading, error } = useCredits();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <p className="text-red-600">Error al cargar el balance de créditos</p>
        </div>
      </div>
    );
  }

  const balance = credits?.balance || 0;
  const usage = credits?.usage || {
    supervision_sessions: 0,
    sessions_45min: 0,
    synthesis_evolutions: 0,
    reports: 0
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Coins className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Balance de Créditos</h2>
              <p className="text-sm text-gray-500">Créditos disponibles para usar</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{balance.toLocaleString()}</div>
            <div className="text-sm text-gray-500">créditos</div>
          </div>
        </div>
      </div>

      {/* Equivalencias */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Con tu saldo actual puedes:</h3>
        <div className="flex flex-col md:flex-row md:flex-wrap gap-4">
          {/* 1º Sesiones de Supervisión IA */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg md:flex-1 md:min-w-0">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Brain className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{usage.supervision_sessions}</div>
              <div className="text-sm text-gray-500">Sesiones de supervisión con IA</div>
              <div className="text-xs text-gray-400">80 créditos c/u</div>
            </div>
          </div>

          {/* 2º Transcripciones de sesiones */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg md:flex-1 md:min-w-0">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mic className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{usage.sessions_45min}</div>
              <div className="text-sm text-gray-500">Transcripción de sesiones</div>
              <div className="text-xs text-gray-400">45 créditos c/u</div>
            </div>
          </div>

          {/* 3º Síntesis de evoluciones */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg md:flex-1 md:min-w-0">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{usage.synthesis_evolutions}</div>
              <div className="text-sm text-gray-500">Informe de Síntesis de evolución Clínica</div>
              <div className="text-xs text-gray-400">0.75 créditos c/u</div>
            </div>
          </div>

          {/* 4º Informes clínicos */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg md:flex-1 md:min-w-0">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{usage.reports}</div>
              <div className="text-sm text-gray-500">Informes clínicos por IA</div>
              <div className="text-xs text-gray-400">8 créditos c/u</div>
            </div>
          </div>
        </div>

        {/* Mensaje de créditos bajos */}
        {balance < 100 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Coins className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Créditos bajos
                </h3>
                <div className="mt-1 text-sm text-yellow-700">
                  Te quedan pocos créditos. Considera recargar para continuar usando todas las funcionalidades.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
