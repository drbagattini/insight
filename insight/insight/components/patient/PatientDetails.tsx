// components/patient/PatientDetails.tsx
import React from 'react';

interface PatientDetailsProps {
  patient: {
    id: string;
    name?: string;
    email?: string;
    // Agrega aquí más campos según sea necesario de tu tipo Patient
  } | null;
  className?: string;
}

export const PatientDetails: React.FC<PatientDetailsProps> = ({ patient, className }) => {
  if (!patient) {
    return <div className={className}>Cargando detalles del paciente...</div>;
  }

  return (
    <div className={`p-4 border rounded-lg shadow-sm bg-white ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Detalles del Paciente</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-600"><strong>Nombre:</strong> {patient.name || 'No disponible'}</p>
        </div>
        <div>
          <p className="text-gray-600"><strong>Email:</strong> {patient.email || 'No disponible'}</p>
        </div>
        <div>
          <p className="text-gray-600"><strong>ID:</strong> {patient.id}</p>
        </div>
        {/* Puedes agregar más detalles aquí */}
      </div>
    </div>
  );
};
