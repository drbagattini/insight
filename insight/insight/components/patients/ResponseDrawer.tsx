"use client";

import React from 'react';
import { X } from 'lucide-react';
import type { ResponseDetail, ResponseItemDetail } from '@/types/patient-responses';

interface ResponseDrawerProps {
  open: boolean;
  onClose: () => void;
  data: ResponseDetail | null; // Can be null while loading or if error
  loading: boolean;
}

export const ResponseDrawer: React.FC<ResponseDrawerProps> = ({ open, onClose, data, loading }) => {
  if (!open) return null;

  // Function to determine the color for the overall score progress bar
  const getOverallScoreColor = (percentage: number) => {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-green-600';
  };

  // Placeholder for max score if not provided by data - this is an assumption
  const assumedMaxScorePerItem = 5;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-gray-800 bg-opacity-75 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
        <div className="relative w-screen max-w-2xl">
          {/* Close button inside panel for accessibility */}
          <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 sm:-ml-10 sm:pr-4">
            <button
              type="button"
              className="rounded-md text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
              onClick={onClose}
            >
              <span className="sr-only">Cerrar panel</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
            <div className="px-4 py-6 sm:px-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalles de la Respuesta
              </h2>
            </div>
            <div className="relative flex-1 px-4 sm:px-6">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
              )}
              {!loading && !data && (
                <div className="text-center py-10">
                  <p className="text-gray-500">No se pudieron cargar los detalles de la respuesta.</p>
                </div>
              )}
              {!loading && data && (
                <div className="space-y-6 pb-6">
                  {/* Header Info */}
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                      <h3 className="text-lg font-bold text-indigo-700">
                        {data.questionnaire_name || data.questionnaire_code || 'Cuestionario Desconocido'}
                      </h3>
                      <span className="text-sm text-gray-600 mt-1 sm:mt-0">
                        {new Date(data.date).toLocaleDateString('es-ES', {
                          year: 'numeric', month: 'long', day: 'numeric', 
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    {(() => {
                      // Define calculations directly inside the guarded block where 'data' is known to be non-null.
                      if (!Array.isArray(data.items)) {
                        // Handle case where items might not be an array, though type suggests it should be
                        return <p className="text-sm text-gray-700 mt-2">Error: Datos de items inválidos.</p>;
                      }
                      const calculatedMaxScore = data.items.length * assumedMaxScorePerItem;
                      const scoreIsNumber = typeof data.score === 'number';

                      const scorePercentage = scoreIsNumber ? Math.round((data.score! / calculatedMaxScore) * 100) : 0;

                      if (calculatedMaxScore > 0 && scoreIsNumber) {
                        return (
                          <div className="mt-3">
                            <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                              <span>Puntaje Total</span>
                              <span>{data.score} / {calculatedMaxScore}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full ${getOverallScoreColor(scorePercentage)}`}
                                style={{ width: `${scorePercentage}%` }}
                                aria-valuenow={scorePercentage}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              ></div>
                            </div>
                            <p className="mt-1 text-xs text-gray-500 text-right">{scorePercentage}% de la puntuación máxima asumida</p>
                          </div>
                        );
                      }
                      // If calculatedMaxScore is 0 or score is not a number, display score information differently.
                      return (
                        <p className="text-sm text-gray-700 mt-2">
                          Puntaje: <span className='font-semibold'>{scoreIsNumber ? data.score : 'No disponible'}</span>
                          {calculatedMaxScore === 0 && " (No se pudo determinar el puntaje máximo)"}
                        </p>
                      );
                    })()}
                  </div>

                  {/* Detailed Items */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3 pt-4 border-t border-gray-200">Respuestas Detalladas:</h4>
                    
                    {/* Tabla con scroll para respuestas detalladas */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <div className="max-h-[400px] overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">#</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pregunta</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Respuesta</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {data.items.map((item: ResponseItemDetail, idx: number) => (
                              <tr key={item.questionId || idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-500">{idx + 1}</td>
                                <td className="px-4 py-3 text-sm text-gray-800">{item.questionText}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {item.answerText ? (
                                    <div className="text-sm font-semibold text-indigo-700">
                                      {item.answerText}
                                      {typeof item.answerValue === 'number' && item.answerText !== String(item.answerValue) && (
                                        <span className="text-xs text-gray-500 ml-1">(Valor: {item.answerValue})</span>
                                      )}
                                    </div>
                                  ) : (
                                    (() => {
                                      const isNumericFallback = typeof item.answerValue === 'number';
                                      if (isNumericFallback) {
                                        return (
                                          <div className="text-sm font-semibold text-indigo-700">
                                            {item.answerValue}/{assumedMaxScorePerItem}
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div className="text-sm text-gray-700">
                                            {String(item.answerValue ?? 'No respondida')}
                                          </div>
                                        );
                                      }
                                    })()
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Footer / Close button */}
            <div className="flex-shrink-0 border-t border-gray-200 px-4 py-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cerrar
              </button>
            </div>
          </div> 
        </div> 
      </div> 
    </div>
  );
};
