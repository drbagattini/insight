"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

/**
 * Represents the core data structure for a single patient.
 */
interface Patient {
  id: string;
  name: string;
  // Add other relevant patient fields here as needed
}

/**
 * Fetches data for a single patient from the API.
 * @param patientId - The unique identifier of the patient.
 * @returns A promise that resolves to the patient's data.
 */
const fetchPatient = async (patientId: string): Promise<Patient> => {
  if (!patientId) {
    throw new Error("Patient ID is required to fetch patient data.");
  }
  const { data } = await axios.get(`/api/patients/${patientId}`);
  return data;
};

/**
 * A React Query hook to fetch and manage data for a single patient.
 * @param patientId - The ID of the patient to fetch.
 * @returns The query object from React Query, containing patient data, loading state, and error state.
 */
export function usePatient(patientId: string) {
  return useQuery<Patient, Error>({
    queryKey: ["patient", patientId],
    queryFn: () => fetchPatient(patientId),
    enabled: !!patientId, // The query will not run until a patientId is provided.
  });
}
