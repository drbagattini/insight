// types/patient-responses.ts

export type ResponseItemDetail = {
  questionId?: string;    // Optional: ID of the question from the questionnaire definition
  questionText: string;   // Text of the question
  answerValue: any;       // Value of the answer given by the patient
  answerText?: string;    // Optional: Text representation of the chosen answer option
};

export type ResponseDetail = {
  id: string;                     // UUID of the response
  patient_id: string;             // UUID of the patient
  questionnaire_code: string;     // Code of the questionnaire (e.g., "GAD-7", "PHQ-9")
  questionnaire_name: string;     // Full name of the questionnaire (e.g., "Generalized Anxiety Disorder 7")
  date: string;                   // Timestamp (ISO string) when the response was submitted ('enviado_en')
  score: number | null;           // Overall score, if applicable
  questionnaire_scale_description?: string; // Optional: Description of the questionnaire's scoring scale
  items: ResponseItemDetail[]; // Array of all questions and their answers
};

export type ResponseRow = {
  id: string;         // id de la respuesta en public.respuestas
  date: string;       // 'enviado_en' en formato ISO
  questionnaire: string; // 'codigo' del cuestionario desde public.cuestionarios
  score: number;      // 'puntuacion' desde public.respuestas
};

// Keeping this existing interface, as it might be useful for the hook later
export interface ResponsesFilter {
  qcode?: string;
  from: string;
  to: string;
  limit: number;
  offset: number;
}
