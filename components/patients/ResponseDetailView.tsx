import React from 'react';
import type { ResponseDetail, ResponseItemDetail } from '@/types/patient-responses';

interface ResponseDetailViewProps {
  selectedResponseFullDetail: ResponseDetail | null | undefined;
  isLoadingSelectedResponseFullDetail: boolean;
  errorSelectedResponseFullDetail: Error | null;
}

const ResponseDetailView: React.FC<ResponseDetailViewProps> = ({
  selectedResponseFullDetail,
  isLoadingSelectedResponseFullDetail,
  errorSelectedResponseFullDetail,
}) => {
  if (isLoadingSelectedResponseFullDetail) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando detalles de la respuesta...</p>
      </div>
    );
  }

  if (errorSelectedResponseFullDetail) {
    return (
      <div className="p-6 bg-red-50 border-l-4 border-red-400">
        <p className="text-red-700 font-semibold">Error al cargar los detalles:</p>
        <p className="text-red-600 text-sm mt-1">{errorSelectedResponseFullDetail.message}</p>
      </div>
    );
  }

  if (!selectedResponseFullDetail) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No se han seleccionado detalles de respuesta para mostrar o no hay datos disponibles.</p>
      </div>
    );
  }

  const { questionnaire_name, date, score, items } = selectedResponseFullDetail;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800">{questionnaire_name}</h2>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            Fecha de respuesta: {new Date(date).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          {score !== null && score !== undefined && (
            <div className="mt-2 sm:mt-0 bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
              Puntaje Total: <span className="font-bold">{score}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Respuestas Detalladas:</h3>
        
        {items && items.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm w-full">
            <div className="overflow-x-auto">
              <table className="min-w-full w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">#</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pregunta</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción Respuesta</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Valor</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item: ResponseItemDetail, index: number) => (
                    <tr key={item.questionId || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {item.questionText}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.answerText || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-indigo-700">
                        {item.answerValue !== null && item.answerValue !== undefined ? item.answerValue : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No hay ítems de respuesta disponibles para este cuestionario.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseDetailView;
