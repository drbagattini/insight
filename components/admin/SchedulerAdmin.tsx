'use client';

import React, { useState } from 'react';
import { FiPlay, FiClock, FiSettings, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface SchedulerResult {
  success: boolean;
  message: string;
  result?: {
    processed: number;
  };
  error?: string;
  timestamp: string;
}

export default function SchedulerAdmin() {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SchedulerResult | null>(null);
  const [testHistory, setTestHistory] = useState<SchedulerResult[]>([]);

  const handleManualTrigger = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/test/scheduler', {
        method: 'GET',
      });
      
      const result = await response.json();
      setLastResult(result);
      
      // Add to history
      setTestHistory(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
      
    } catch (error) {
      const errorResult: SchedulerResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to trigger manual test',
        timestamp: new Date().toISOString()
      };
      
      setLastResult(errorResult);
      setTestHistory(prev => [errorResult, ...prev.slice(0, 4)]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <FiSettings className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Administración del Programador de Cuestionarios
        </h2>
      </div>

      {/* Manual trigger section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FiPlay className="h-5 w-5" />
          Ejecución Manual
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Ejecuta manualmente el procesador de envíos programados para probar el sistema.
        </p>

        <button
          onClick={handleManualTrigger}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Procesando...
            </>
          ) : (
            <>
              <FiPlay className="h-4 w-4" />
              Ejecutar Ahora
            </>
          )}
        </button>
      </div>

      {/* Results section */}
      {lastResult && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            {lastResult.success ? (
              <FiCheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <FiAlertCircle className="h-5 w-5 text-red-600" />
            )}
            Último Resultado
          </h3>
          
          <div className={`p-4 rounded-lg border ${
            lastResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`font-medium ${
                  lastResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {lastResult.message}
                </p>
                
                {lastResult.result && (
                  <p className={`text-sm mt-1 ${
                    lastResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Envíos procesados: {lastResult.result.processed}
                  </p>
                )}
                
                {lastResult.error && (
                  <p className="text-sm text-red-700 mt-1 font-mono">
                    Error: {lastResult.error}
                  </p>
                )}
              </div>
              
              <span className={`text-xs ${
                lastResult.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatTimestamp(lastResult.timestamp)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* History section */}
      {testHistory.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <FiClock className="h-5 w-5" />
            Historial (últimas 5 ejecuciones)
          </h3>
          
          <div className="space-y-3">
            {testHistory.map((result, index) => (
              <div 
                key={index}
                className={`p-3 rounded-md border text-sm ${
                  result.success 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <FiCheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <FiAlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    )}
                    <span className={
                      result.success ? 'text-gray-700' : 'text-red-700'
                    }>
                      {result.result ? `${result.result.processed} envíos procesados` : result.message}
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {formatTimestamp(result.timestamp)}
                  </span>
                </div>
                
                {result.error && (
                  <p className="text-red-600 text-xs mt-1 ml-6 font-mono">
                    {result.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Information section */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">ℹ️ Información del Sistema</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• El sistema procesa automáticamente cada hora los envíos programados</li>
          <li>• Los envíos recurrentes (semanal, mensual, trimestral) se reprograman automáticamente</li>
          <li>• Los envíos únicos se marcan como inactivos después de ejecutarse</li>
          <li>• El endpoint manual permite probar el sistema sin esperar al cron automático</li>
        </ul>
      </div>
    </div>
  );
}
