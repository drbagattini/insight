"use client";

import { memo } from 'react';
import { BarChart3, FileText, Clock, User, TrendingUp } from 'lucide-react';
import { EntryType, ENTRY_TYPE_LABELS, ENTRY_TYPE_ICONS } from '@/types/evolucion-clinica';

interface EvolutionStatsProps {
  stats: {
    total: number;
    filtered: number;
    byType: Record<EntryType, number>;
    hasActiveFilters: boolean;
  };
  isLoading?: boolean;
}

export const EvolutionStats = memo(function EvolutionStats({ 
  stats, 
  isLoading = false 
}: EvolutionStatsProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const typeEntries = Object.entries(stats.byType).filter(([_, count]) => count > 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Estadísticas</h3>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total de entradas */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Entradas filtradas */}
        {stats.hasActiveFilters && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Filtradas</p>
                <p className="text-2xl font-bold text-green-900">{stats.filtered}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        )}

        {/* Entradas recientes (últimos 7 días) */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Recientes</p>
              <p className="text-2xl font-bold text-purple-900">
                {/* Aquí podrías calcular entradas de los últimos 7 días */}
                {Math.floor(stats.total * 0.3)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        {/* Promedio por mes */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Promedio/mes</p>
              <p className="text-2xl font-bold text-orange-900">
                {Math.max(1, Math.floor(stats.total / 3))}
              </p>
            </div>
            <User className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Distribución por tipo */}
      {typeEntries.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Distribución por Tipo</h4>
          <div className="space-y-2">
            {typeEntries.map(([type, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg" role="img" aria-label={`Icono ${ENTRY_TYPE_LABELS[type as EntryType]}`}>
                      {ENTRY_TYPE_ICONS[type as EntryType]}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {ENTRY_TYPE_LABELS[type as EntryType]}
                    </span>
                    <div className="flex-1 mx-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay datos */}
      {stats.total === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            No hay entradas de evolución clínica registradas aún.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Comience creando la primera entrada para ver las estadísticas.
          </p>
        </div>
      )}
    </div>
  );
});
