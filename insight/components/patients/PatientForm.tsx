import { useState, useEffect } from 'react';
import { Patient, NewPatient } from '@/types/patients';

interface PatientFormProps {
  patient?: Patient;
  onSubmit: (data: NewPatient) => Promise<void>;
  onCancel: () => void;
}

export default function PatientForm({ patient, onSubmit, onCancel }: PatientFormProps) {
  const [formData, setFormData] = useState<NewPatient>({
    full_name: '',
    email: '',
    whatsapp: '',
    metadata: {},
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        full_name: patient.full_name,
        email: patient.email || '',
        whatsapp: patient.whatsapp || '',
        metadata: patient.metadata || {},
      });
    }
  }, [patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      // El manejo del éxito se hace en el componente padre
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar paciente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="full_name">
          Nombre completo *
        </label>
        <input
          id="full_name"
          type="text"
          required
          className="w-full p-2 border rounded"
          value={formData.full_name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, full_name: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="w-full p-2 border rounded"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="whatsapp">
          WhatsApp
        </label>
        <input
          id="whatsapp"
          type="tel"
          className="w-full p-2 border rounded"
          value={formData.whatsapp}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))
          }
          placeholder="+54 9 11 1234-5678"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Guardando...'
            : patient
            ? 'Actualizar Paciente'
            : 'Crear Paciente'}
        </button>
      </div>
    </form>
  );
}
