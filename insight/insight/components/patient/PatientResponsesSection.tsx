// /Users/NICOBAGA/CascadeProjects/windsurf-project/insight/components/patients/PatientResponsesSection.tsx
'use client';

import React from 'react';
import { usePatientResponses } from '@/hooks/usePatientResponses';
import { ResponsesFilterBar } from './ResponsesFilterBar';
import ResponseDetailView from './ResponseDetailView';

interface PatientResponsesSectionProps {
  patientId: string;
}

export const PatientResponsesSection: React.FC<PatientResponsesSectionProps> = ({ patientId }) => {
  const {
    availableQuestionnaires,
    isLoadingQuestionnaires,
    errorQuestionnaires,
    availableResponseDates,
    isLoadingResponseDates,
    errorResponseDates,
    selectedQCode,
    selectedResponseDate,
    handleQCodeChange,
    handleResponseDateChange,
    clearFilters,
    selectedResponseFullDetail,
    isLoadingSelectedResponseFullDetail,
    // isFetchingSelectedResponseFullDetail, // Can be used for more granular loading if ResponseDetailView is adapted
    errorSelectedResponseFullDetail,
    navigateToNewerDate,
    navigateToOlderDate,
    canNavigateToNewerDate,
    canNavigateToOlderDate,
  } = usePatientResponses({ patientId });

  // Determine conditions for rendering different UI states
  const showDetailView = selectedQCode && selectedResponseDate && !isLoadingSelectedResponseFullDetail && !errorSelectedResponseFullDetail && selectedResponseFullDetail;
  const showLoading = isLoadingSelectedResponseFullDetail;
  const showError = selectedQCode && selectedResponseDate && !!errorSelectedResponseFullDetail;
  const showPromptToSelect = !selectedQCode || !selectedResponseDate;
  const showNoDataAfterSelection = selectedQCode && selectedResponseDate && !isLoadingSelectedResponseFullDetail && !errorSelectedResponseFullDetail && !selectedResponseFullDetail;

  return (
    <section className="space-y-6 p-4 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Detalle de Respuesta del Cuestionario</h2>
      
      <ResponsesFilterBar
        availableQuestionnaires={availableQuestionnaires || []}
        selectedQCode={selectedQCode}
        handleQCodeChange={handleQCodeChange}
        isLoadingQuestionnaires={isLoadingQuestionnaires}
        errorQuestionnaires={errorQuestionnaires} // Pass error to filter bar
        availableResponseDates={availableResponseDates || []}
        selectedResponseDate={selectedResponseDate}
        handleResponseDateChange={handleResponseDateChange}
        isLoadingResponseDates={isLoadingResponseDates}
        errorResponseDates={errorResponseDates} // Pass error to filter bar
        navigateToNewerDate={navigateToNewerDate}
        navigateToOlderDate={navigateToOlderDate}
        canNavigateToNewerDate={canNavigateToNewerDate}
        canNavigateToOlderDate={canNavigateToOlderDate}
        onClearFilters={clearFilters}
        isLoadingGlobal={isLoadingQuestionnaires || isLoadingResponseDates || isLoadingSelectedResponseFullDetail}
      />

      <div className="mt-6 min-h-[200px] flex flex-col justify-center">
        {showLoading && (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-700 mx-auto"></div>
            <p className="mt-3 text-gray-600">Cargando detalle de la respuesta...</p>
          </div>
        )}
        {showError && (
          <div className="p-6 bg-red-50 border-l-4 border-red-400 w-full max-w-md mx-auto">
            <p className="text-red-700 font-semibold">Error al Cargar Detalles:</p>
            <p className="text-red-600 text-sm mt-1">{errorSelectedResponseFullDetail?.message || 'Ocurrió un error al intentar obtener los detalles de la respuesta.'}</p>
          </div>
        )}
        {showDetailView && selectedResponseFullDetail && (
          <div className="w-full">
            <ResponseDetailView
              selectedResponseFullDetail={selectedResponseFullDetail}
              isLoadingSelectedResponseFullDetail={false} // Loading state is handled above
              errorSelectedResponseFullDetail={null}    // Error state is handled above
            />
          </div>
        )}
        {showNoDataAfterSelection && (
           <div className="text-center py-10">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontró la respuesta</h3>
              <p className="mt-1 text-sm text-gray-500">No hay detalles disponibles para el cuestionario y la fecha seleccionados.</p>
           </div>
        )}
        {showPromptToSelect && !showLoading && !showError && !showDetailView && !showNoDataAfterSelection && (
           <div className="text-center py-10">
             <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Seleccione Filtros</h3>
              <p className="mt-1 text-sm text-gray-500">Por favor, elija un cuestionario y una fecha para ver los detalles de la respuesta.</p>
           </div>
        )}
      </div>
    </section>
  );
};
