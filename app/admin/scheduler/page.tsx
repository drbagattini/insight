import React from 'react';
import { Metadata } from 'next';
import SchedulerAdmin from '@/components/admin/SchedulerAdmin';
import { FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Administración del Programador | Insight',
  description: 'Panel de administración para el sistema de envíos programados de cuestionarios',
};

export default function SchedulerAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <nav className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-sm font-medium text-gray-900">
                Administración del Programador
              </span>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sistema de Envíos Programados
          </h1>
          <p className="text-gray-600">
            Administra y monitorea el sistema automático de envío de cuestionarios recurrentes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <SchedulerAdmin />
          
          {/* Additional admin sections could go here */}
          <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Configuración de Producción
            </h2>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Edge Function (Recomendado)</h3>
                <p className="mb-2">
                  Para producción, configura la Edge Function <code className="bg-gray-100 px-2 py-1 rounded">automatic-scheduler</code> en Supabase:
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Ejecuta <code className="bg-gray-100 px-2 py-1 rounded">supabase functions deploy automatic-scheduler</code></li>
                  <li>Configura la variable <code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_APP_URL</code> en Vault</li>
                  <li>Programa la Edge Function con pg_cron ejecutando el script SQL proporcionado</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Alternativa: Cron Externo</h3>
                <p>
                  Como alternativa, puedes configurar un cron job externo que llame a:
                  <br />
                  <code className="bg-gray-100 px-2 py-1 rounded">POST /api/test/scheduler</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
