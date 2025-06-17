export type KPIs = {
  activePatients: number;
  pendingLinks: number;
  weekAppointments: number;
  deltaActive: number | null; // % vs semana previa
  deltaPending: number | null;
  deltaAppointments: number | null;
};

export type Alert = {
  patientId: string;
  name: string;
  score: number;
  dropPct: number | null;
  date: string; // ISO
};

export type Who5ScatterDataPoint = {
  x: string; // Date
  y: number; // Score
};

export type Who5ScatterData = {
  points: Who5ScatterDataPoint[];
  meanLine: Who5ScatterDataPoint[];
};

export type UpcomingAppointment = {
  id: string;
  startTime: string; // ISO string
  patientName: string | null;
  patientId: string | null;
  reason: string | null; // Or title, depending on your appointments table structure
};

export type NewResponse = {
  patientId: string;
  patientName: string;
  questionnaireName: string;
  score: number;
  date: string; // ISO string
  linkId: string; // To fetch details for modal
};
