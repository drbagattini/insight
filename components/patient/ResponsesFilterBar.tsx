"use client";

import React from 'react';
import type { QuestionnaireType } from '@/hooks/usePatientResponses'; // Assuming QuestionnaireType is exported from the hook
import { sortQuestionnaires } from '@/lib/questionnaire-order';

interface ResponsesFilterBarProps {
  availableQuestionnaires: QuestionnaireType[];
  selectedQCode: string | null;
  handleQCodeChange: (qcode: string | null) => void;
  isLoadingQuestionnaires: boolean;
  errorQuestionnaires?: Error | null;

  availableResponseDates: string[];
  selectedResponseDate: string | null;
  handleResponseDateChange: (date: string | null) => void;
  isLoadingResponseDates: boolean;
  errorResponseDates?: Error | null;

  // Navigation props
  navigateToNewerDate: () => void;
  navigateToOlderDate: () => void;
  canNavigateToNewerDate: boolean;
  canNavigateToOlderDate: boolean;
  
  onClearFilters: () => void;
  isLoadingGlobal?: boolean; // For disabling the entire bar e.g. when main responses are loading
}

export const ResponsesFilterBar: React.FC<ResponsesFilterBarProps> = ({
  availableQuestionnaires,
  selectedQCode,
  handleQCodeChange,
  isLoadingQuestionnaires,
  errorQuestionnaires,
  availableResponseDates,
  selectedResponseDate,
  handleResponseDateChange,
  isLoadingResponseDates,
  errorResponseDates,
  navigateToNewerDate,
  navigateToOlderDate,
  canNavigateToNewerDate,
  canNavigateToOlderDate,
  onClearFilters,
  isLoadingGlobal,
}) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        {/* Questionnaire Type Filter */}
        <div className="flex flex-col">
          <label htmlFor="qcode-filter" className="text-sm font-medium text-gray-700 mb-1">
            Cuestionario
          </label>
          <select
            id="qcode-filter"
            value={selectedQCode || ''}
            onChange={(e) => handleQCodeChange(e.target.value || null)}
            disabled={isLoadingQuestionnaires || !!errorQuestionnaires || isLoadingGlobal}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Seleccionar cuestionario...</option>
            {sortQuestionnaires(availableQuestionnaires as any[]).map(q => (
              <option key={q.id} value={q.codigo}>{q.nombre}</option>
            ))}
          </select>
          {errorQuestionnaires && (
            <p className="mt-1 text-xs text-red-600">Error: {errorQuestionnaires.message}</p>
          )}
        </div>

        {/* Response Date Filter with Navigation */}
        <div className="flex flex-col">
          <label htmlFor="date-filter" className="text-sm font-medium text-gray-700 mb-1">
            Fecha de Respuesta
          </label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={navigateToNewerDate} // Note: Newer date means smaller index (more recent)
              disabled={!canNavigateToNewerDate || isLoadingResponseDates || isLoadingGlobal}
              className="p-2 border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Fecha anterior"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <select
            id="date-filter"
            value={selectedResponseDate || ''}
            onChange={(e) => handleResponseDateChange(e.target.value || null)}
            disabled={isLoadingResponseDates || !!errorResponseDates || !selectedQCode || isLoadingGlobal}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Seleccionar fecha...</option>
            {availableResponseDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
          <button
              type="button"
              onClick={navigateToOlderDate} // Note: Older date means larger index (less recent)
              disabled={!canNavigateToOlderDate || isLoadingResponseDates || isLoadingGlobal}
              className="p-2 border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Fecha siguiente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {errorResponseDates && (
            <p className="mt-1 text-xs text-red-600">Error: {errorResponseDates.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};
