"use client";

import React from 'react';
import { Eye, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ResponseRow } from '@/types/patient-responses'; // Ensure this type matches the hook's output

interface PaginationState {
  currentPage: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface ResponsesTableProps {
  responses: ResponseRow[];
  isLoading: boolean;
  pagination: PaginationState;
  onSelectResponse: (id: string) => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setLimit: (limit: number) => void;
}

export const ResponsesTable: React.FC<ResponsesTableProps> = ({
  responses,
  isLoading,
  pagination,
  onSelectResponse,
  goToPage,
  nextPage,
  prevPage,
  setLimit,
}) => {
  if (isLoading && responses.length === 0) { // Show loader only if initial load or no previous data
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isLoading && responses.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg shadow">
        <BarChart2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay respuestas</h3>
        <p className="mt-1 text-sm text-gray-500">No se encontraron respuestas para los filtros seleccionados o el paciente aún no tiene respuestas.</p>
      </div>
    );
  }

  const pageLimits = [5, 10, 25, 50];

  return (
    <div className="shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <div className={`overflow-x-auto ${isLoading ? 'opacity-50' : ''}`}>
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Fecha y Hora
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Cuestionario
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Puntaje
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {responses.map((row) => {
              const date = new Date(row.date);
              const formattedDate = date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              
              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                    <div className="font-medium">{formattedDate}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {row.questionnaire}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {/* Simplified score display as max_score is not available per row yet */}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                      {row.score}
                    </span>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      onClick={() => onSelectResponse(row.id)}
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <Eye className="h-4 w-4 mr-1.5" />
                      Ver detalles
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      {pagination.totalPages > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-lg">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={prevPage}
              disabled={pagination.currentPage === 1 || isLoading}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={nextPage}
              disabled={pagination.currentPage === pagination.totalPages || isLoading}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(pagination.currentPage - 1) * pagination.limit + 1}</span>
                {' - '}
                <span className="font-medium">{Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}</span>
                {' de '}
                <span className="font-medium">{pagination.totalCount}</span> resultados
              </p>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-2">Resultados por página:</span>
              <select 
                value={pagination.limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                disabled={isLoading}
                className="block w-auto pl-3 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-100"
              >
                {pageLimits.map(limit => (
                  <option key={limit} value={limit}>{limit}</option>
                ))}
              </select>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm ml-4" aria-label="Pagination">
                <button
                  onClick={prevPage}
                  disabled={pagination.currentPage === 1 || isLoading}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                {/* Current page info (can be expanded to show page numbers if needed) */}
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                  Página {pagination.currentPage} de {pagination.totalPages}
                </span>
                <button
                  onClick={nextPage}
                  disabled={pagination.currentPage === pagination.totalPages || isLoading}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Siguiente</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
