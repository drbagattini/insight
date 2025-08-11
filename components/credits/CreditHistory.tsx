// components/credits/CreditHistory.tsx
'use client';

import { useState } from 'react';
import { useCreditHistory } from '@/hooks/useCredits';
import { History, Plus, Minus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreditHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: history, isLoading, error } = useCreditHistory(currentPage, 20);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-UY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: 'credit' | 'debit') => {
    return type === 'credit' ? (
      <Plus className="h-4 w-4 text-green-600" />
    ) : (
      <Minus className="h-4 w-4 text-red-600" />
    );
  };

  const getTransactionColor = (type: 'credit' | 'debit') => {
    return type === 'credit' ? 'text-green-600' : 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-100 rounded-lg">
              <History className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Historial de Créditos</h2>
              <p className="text-sm text-gray-500">Registro de todas tus transacciones</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-100 rounded-lg">
              <History className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Historial de Créditos</h2>
              <p className="text-sm text-gray-500">Registro de todas tus transacciones</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center">
          <p className="text-red-600">Error al cargar el historial</p>
        </div>
      </div>
    );
  }

  const transactions = history?.transactions || [];
  const totalPages = Math.ceil((history?.total || 0) / 20);

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-100 rounded-lg">
              <History className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Historial de Créditos</h2>
              <p className="text-sm text-gray-500">
                {history?.total || 0} transacciones en total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions list */}
      <div className="divide-y divide-gray-200">
        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay transacciones aún</p>
            <p className="text-sm text-gray-400 mt-1">
              Las transacciones aparecerán aquí cuando uses o compres créditos
            </p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(transaction.created_at)}
                    </p>
                    {/* Metadata adicional */}
                    {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                      <div className="mt-1">
                        {transaction.metadata.plan_type && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                            Plan {transaction.metadata.plan_type}
                          </span>
                        )}
                        {transaction.metadata.tokens && (
                          <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full mr-2">
                            {transaction.metadata.tokens} tokens
                          </span>
                        )}
                        {transaction.metadata.minutes && (
                          <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mr-2">
                            {transaction.metadata.minutes} min
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${getTransactionColor(transaction.type)}`}>
                    {transaction.type === 'credit' ? '+' : '-'}
                    {transaction.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">créditos</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
