// Aliases legacy endpoint `/api/patients/[patientId]/intake` to the new canonical
// `/api/patients/[patientId]/evolutions/intake` implementation to maintain backward
// compatibility with existing frontend code (e.g., useIntake hook).

export { GET, POST, PATCH } from "../evolutions/intake/route";

// Force dynamic to avoid static prerender issues
export const dynamic = "force-dynamic";
