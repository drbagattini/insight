// /Users/NICOBAGA/CascadeProjects/windsurf-project/insight/hooks/usePatientResponses.ts
import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import type { ResponseRow, ResponseDetail } from '@/types/patient-responses';

export interface QuestionnaireType {
  id: string;
  codigo: string;
  nombre: string;
}

interface UsePatientResponsesProps {
  patientId: string;
}

interface FetchPatientResponsesParams {
  patientId: string;
  qcode: string | null;
  fromDate: string | null;
  toDate: string | null;
  page: number; // Kept for API signature, but will be 1
  limit: number; // Kept for API signature, but will be 1
}

// API to fetch a list of responses (primarily to get the ID of a specific response instance)
const fetchPatientResponsesAPI = async ({
  patientId,
  qcode,
  fromDate,
  toDate,
  page,
  limit,
}: FetchPatientResponsesParams): Promise<{ data: ResponseRow[]; totalCount: number }> => {
  const offset = (page - 1) * limit;
  const queryParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (qcode) queryParams.append('qcode', qcode);
  if (fromDate) queryParams.append('fromDate', fromDate);
  if (toDate) queryParams.append('toDate', toDate);

  const response = await fetch(`/api/patients/${patientId}/responses?${queryParams.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch patient responses' }));
    throw new Error(errorData.error || 'Failed to fetch patient responses');
  }
  const result: { responses: ResponseRow[]; totalCount: number } = await response.json();
  return { data: result.responses, totalCount: result.totalCount };
};

// API to fetch available questionnaire types
const fetchQuestionnaireTypesAPI = async (): Promise<QuestionnaireType[]> => {
  const response = await fetch('/api/cuestionarios');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch questionnaire types' }));
    throw new Error(errorData.error || 'Failed to fetch questionnaire types');
  }
  return response.json();
};

// API to fetch available response dates for a specific questionnaire and patient
const fetchResponseDatesAPI = async (patientId: string, qcode: string): Promise<string[]> => {
  const response = await fetch(`/api/patients/${patientId}/questionnaires/${qcode}/response-dates`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch response dates' }));
    throw new Error(errorData.error || 'Failed to fetch response dates');
  }
  return response.json();
};

// API to fetch the full detail of a single response
const fetchResponseDetailAPI = async (responseId: string | null): Promise<ResponseDetail | null> => {
  if (!responseId) return null;
  const response = await fetch(`/api/responses/${responseId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch response detail' }));
    throw new Error(errorData.error || 'Failed to fetch response detail');
  }
  return response.json();
};

export const usePatientResponses = ({ patientId }: UsePatientResponsesProps) => {
  const queryClient = useQueryClient();

  const [selectedQCode, setSelectedQCode] = useState<string | null>(null);
  const [selectedResponseDate, setSelectedResponseDate] = useState<string | null>(null);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const [currentResponseDateIndex, setCurrentResponseDateIndex] = useState<number | null>(null);

  // Query for available questionnaire types
  const {
    data: availableQuestionnaires = [],
    isLoading: isLoadingQuestionnaires,
    error: errorQuestionnaires,
  } = useQuery<QuestionnaireType[], Error>({
    queryKey: ['questionnaireTypesForPatient', patientId], // Keyed by patientId if API is ever refined
    queryFn: fetchQuestionnaireTypesAPI, // This currently fetches ALL questionnaire types
    enabled: !!patientId,
  });

  // Query for available response dates for the selected questionnaire type and patient
  const {
    data: availableResponseDates = [],
    isLoading: isLoadingResponseDates,
    error: errorResponseDates,
  } = useQuery<string[], Error>({
    queryKey: ['responseDates', patientId, selectedQCode],
    queryFn: () => fetchResponseDatesAPI(patientId, selectedQCode!),
    enabled: !!patientId && !!selectedQCode,
  });

  // Query to get the basic info (specifically the ID) of the response
  // that matches the selected patient, qcode, and date.
  const {
    data: specificResponseInstanceData, // Contains { data: [ResponseRow], totalCount: 1 }
    isLoading: isLoadingSpecificResponseInstance, // Loading state for getting the ID
    error: errorSpecificResponseInstance, // Error state for getting the ID
  } = useQuery<{ data: ResponseRow[]; totalCount: number }, Error>({
    queryKey: ['specificResponseInstance', patientId, selectedQCode, selectedResponseDate],
    queryFn: () => {
      // Ensure the date range covers the entire selected day to catch all responses.
      const from = selectedResponseDate ? `${selectedResponseDate}T00:00:00.000Z` : null;
      const to = selectedResponseDate ? `${selectedResponseDate}T23:59:59.999Z` : null;

      return fetchPatientResponsesAPI({
        patientId,
        qcode: selectedQCode,
        fromDate: from,
        toDate: to,
        page: 1,
        limit: 1,
      });
    },
    enabled: !!patientId && !!selectedQCode && !!selectedResponseDate,
    placeholderData: keepPreviousData, // Useful to avoid UI flicker
  });

  // Effect to automatically set selectedResponseId when the specific response instance is fetched
  useEffect(() => {
    if (specificResponseInstanceData?.data && specificResponseInstanceData.data.length > 0) {
      const responseId = specificResponseInstanceData.data[0].id;
      setSelectedResponseId(responseId);
    } else if (!selectedQCode || !selectedResponseDate) {
      // Clear ID if filters are cleared
      setSelectedResponseId(null);
    }
  }, [specificResponseInstanceData, selectedQCode, selectedResponseDate]);

  // Effect to update currentResponseDateIndex when selectedResponseDate or availableResponseDates change
  useEffect(() => {
    if (selectedResponseDate && availableResponseDates && availableResponseDates.length > 0) {
      const index = availableResponseDates.indexOf(selectedResponseDate);
      setCurrentResponseDateIndex(index !== -1 ? index : null);
    } else {
      setCurrentResponseDateIndex(null);
    }
  }, [selectedResponseDate, availableResponseDates]);

  // Query for the full detail of the selected response, enabled when selectedResponseId is available
  const {
    data: selectedResponseFullDetail,
    isLoading: isLoadingSelectedResponseFullDetail,
    error: errorSelectedResponseFullDetail,
    isFetching: isFetchingSelectedResponseFullDetail, // Use this for loading indicators on detail view
  } = useQuery<ResponseDetail | null, Error>({
    queryKey: ['responseDetail', selectedResponseId],
    queryFn: () => fetchResponseDetailAPI(selectedResponseId),
    enabled: !!selectedResponseId, // Only run if we have an ID
  });

  const handleQCodeChange = useCallback((newQCode: string | null) => {
    setSelectedQCode(newQCode);
    setSelectedResponseDate(null); // Reset date when qcode changes
    setSelectedResponseId(null);   // Reset response ID
  }, []);

  const handleResponseDateChange = useCallback((newDate: string | null) => {
    setSelectedResponseDate(newDate);
    // selectedResponseId will be set by the useEffect once specificResponseInstanceData updates
  }, []);

  const navigateToNewerDate = useCallback(() => {
    if (currentResponseDateIndex !== null && currentResponseDateIndex > 0 && availableResponseDates) {
      handleResponseDateChange(availableResponseDates[currentResponseDateIndex - 1]);
    }
  }, [currentResponseDateIndex, availableResponseDates, handleResponseDateChange]);

  const navigateToOlderDate = useCallback(() => {
    if (currentResponseDateIndex !== null && availableResponseDates && currentResponseDateIndex < availableResponseDates.length - 1) {
      handleResponseDateChange(availableResponseDates[currentResponseDateIndex + 1]);
    }
  }, [currentResponseDateIndex, availableResponseDates, handleResponseDateChange]);

  const clearFilters = useCallback(() => {
    setSelectedQCode(null);
    setSelectedResponseDate(null);
    setSelectedResponseId(null);
    queryClient.invalidateQueries({ queryKey: ['responseDates', patientId, selectedQCode] });
    queryClient.invalidateQueries({ queryKey: ['specificResponseInstance', patientId, selectedQCode, selectedResponseDate] });
    queryClient.invalidateQueries({ queryKey: ['responseDetail', selectedResponseId] });
    setCurrentResponseDateIndex(null); // Reset index on clear
  }, [patientId, queryClient, selectedQCode, selectedResponseDate, selectedResponseId]);

  return {
    // Filters
    availableQuestionnaires,
    isLoadingQuestionnaires,
    errorQuestionnaires,
    selectedQCode,
    handleQCodeChange,
    availableResponseDates,
    isLoadingResponseDates,
    errorResponseDates,
    selectedResponseDate,
    handleResponseDateChange,
    clearFilters,
    navigateToNewerDate,
    navigateToOlderDate,
    canNavigateToNewerDate: currentResponseDateIndex !== null && currentResponseDateIndex > 0,
    canNavigateToOlderDate: currentResponseDateIndex !== null && availableResponseDates && currentResponseDateIndex < availableResponseDates.length - 1,

    // Selected Response Full Detail
    selectedResponseFullDetail: selectedResponseFullDetail || null,
    isLoadingSelectedResponseFullDetail: isLoadingSelectedResponseFullDetail || isLoadingSpecificResponseInstance,
    isFetchingSelectedResponseFullDetail, // Use this for subtle loading indicators if needed
    errorSelectedResponseFullDetail: errorSelectedResponseFullDetail || errorSpecificResponseInstance,
  };
};
