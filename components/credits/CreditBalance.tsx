// components/credits/CreditBalance.tsx
'use client';

import { useState } from 'react';
import { useCredits } from '@/hooks/useCredits';
import { Coins, FileText, Mic, MessageSquare, Loader2, Brain, BarChart3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DirectPurchase from './DirectPurchase';

export default function CreditBalance() {
  const { data: credits, isLoading, error } = useCredits();
  const [showDirectPurchase, setShowDirectPurchase] = useState(false);

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
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Coins className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-baseline space-x-3">
                <h2 className="text-2xl font-semibold text-gray-900">Balance de Créditos</h2>
                <span className="text-gray-300 text-xl">=</span>
                <span className="text-3xl font-bold text-gray-900">{balance.toLocaleString()}</span>
                <span className="text-lg text-gray-600">créditos</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Créditos disponibles para usar</p>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <Button 
              onClick={() => setShowDirectPurchase(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              Comprar Créditos
            </Button>
          </div>
        </div>
      </div>

      {/* Equivalencias */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Con tu saldo actual puedes:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1º Supervisión IA */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Brain className="h-5 w-5 text-sky-600" />
              </div>
              <div className="text-xs font-medium text-sky-600 uppercase tracking-wide">Supervisión IA</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{usage.supervision_sessions}</div>
            <div className="text-sm text-gray-600">sesiones de supervisión con IA</div>
            <div className="text-xs text-gray-400 mt-1">80 créditos c/u</div>
          </div>

          {/* 2º Transcripción de sesiones */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Mic className="h-5 w-5 text-sky-600" />
              </div>
              <div className="text-xs font-medium text-sky-600 uppercase tracking-wide">Transcripción de sesiones</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{usage.sessions_45min}</div>
            <div className="text-sm text-gray-600">sesiones de 45 minutos</div>
            <div className="text-xs text-gray-400 mt-1">45 créditos c/u</div>
          </div>

          {/* 3º Síntesis de evoluciones */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-sky-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-sky-600" />
              </div>
              <div className="text-xs font-medium text-sky-600 uppercase tracking-wide">Síntesis de evoluciones</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{usage.synthesis_evolutions}</div>
            <div className="text-sm text-gray-600">informes de síntesis de evolución</div>
            <div className="text-xs text-gray-400 mt-1">0.75 créditos c/u</div>
          </div>

          {/* 4º Informes IA */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-sky-100 rounded-lg">
                <FileText className="h-5 w-5 text-sky-600" />
              </div>
              <div className="text-xs font-medium text-sky-600 uppercase tracking-wide">Informes IA</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{usage.reports}</div>
            <div className="text-sm text-gray-600">informes clínicos por IA</div>
            <div className="text-xs text-gray-400 mt-1">8 créditos c/u</div>
          </div>
        </div>

        {/* Sistema de alertas por niveles */}
        {balance > 100 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <div className="p-1 bg-green-100 rounded-lg mr-3 mt-0.5">
                <Coins className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Créditos disponibles
                </h3>
                <div className="mt-1 text-sm text-green-700">
                  Tienes suficientes créditos para usar todas las funcionalidades.
                </div>
              </div>
            </div>
          </div>
        )}
        
        {balance > 0 && balance <= 50 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <div className="p-1 bg-yellow-100 rounded-lg mr-3 mt-0.5">
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
        
        {balance === 0 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="p-1 bg-red-100 rounded-lg mr-3 mt-0.5">
                <Coins className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Sin créditos
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  No tienes créditos disponibles. Compra créditos para usar las funcionalidades de IA.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Direct Purchase Modal */}
      <DirectPurchase 
        isOpen={showDirectPurchase}
        onClose={() => setShowDirectPurchase(false)}
      />
    </div>
  );
}
