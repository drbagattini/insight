import { redirect } from 'next/navigation';

// Redirects base path /dashboard/perfil-del-paciente to the patient list to avoid 404.
export default function PatientProfileBaseRedirect() {
  redirect('/dashboard/patients');
}
