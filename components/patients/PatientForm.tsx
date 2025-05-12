import { useState, useEffect } from 'react';
import { Patient, NewPatient } from '@/types/patients';

interface PatientFormProps {
  patient?: Patient;
  onSubmit: (data: NewPatient) => Promise<void>;
  onCancel: () => void;
}

export default function PatientForm({ patient, onSubmit, onCancel }: PatientFormProps) {
  const [formData, setFormData] = useState<NewPatient>({
    name: '',
    email: null,
    whatsapp: null,
    metadata: {
      cuestionario_id: '',
      preferencias_cuestionario: {
        canal: 'email',
        frecuencia: 'mensual'
      },
      sendInitial: true,
    },
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionarios, setQuestionarios] = useState<{ id: string; titulo: string }[]>([]);

  useEffect(() => {
    fetch('/api/cuestionarios')
      .then(res => res.json())
      .then((data: any[]) => {
        setQuestionarios(data);
        if (data.length) {
          setFormData(prev => ({
            ...prev,
            metadata: {
              ...(prev.metadata as any),
              cuestionario_id: prev.metadata?.cuestionario_id || data[0].id
            }
          }));
        }
      })
      .catch(err => console.error('Error fetching cuestionarios:', err));
  }, []);

  useEffect(() => {
    if (patient) {
      // Asegurarse de preservar las preferencias de cuestionario si existen
      const preferencias = patient.metadata?.preferencias_cuestionario || {
        canal: 'email',
        frecuencia: 'mensual'
      };
      
      setFormData({
        name: patient.name,
        email: patient.email,
        whatsapp: patient.whatsapp,
        metadata: {
          ...patient.metadata,
          preferencias_cuestionario: preferencias,
          sendInitial: patient.metadata?.sendInitial || true,
        },
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
        <label className="block text-sm font-medium mb-1" htmlFor="name">
          Nombre completo *
        </label>
        <input
          id="name"
          type="text"
          required
          className="w-full p-2 border rounded"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
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
          value={formData.email || ''}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value || null }))
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
          value={formData.whatsapp || ''}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, whatsapp: e.target.value || null }))
          }
          placeholder="+54 9 11 1234-5678"
        />
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="font-medium mb-3">Preferencias de Cuestionario</h3>
        
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1" htmlFor="cuestionario">
            Cuestionario *
          </label>
          <select
            id="cuestionario"
            required
            className="w-full p-2 border rounded"
            value={(formData.metadata as any).cuestionario_id || ''}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                metadata: {
                  ...(prev.metadata as any),
                  cuestionario_id: e.target.value
                }
              }))
            }
          >
            <option value="" disabled>Selecciona un cuestionario</option>
            {questionarios.map(q => (
              <option key={q.id} value={q.id}>{q.titulo}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1" htmlFor="canal">
            Canal de envío
          </label>
          <select
            id="canal"
            className="w-full p-2 border rounded"
            value={(formData.metadata?.preferencias_cuestionario as any)?.canal || 'email'}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                metadata: {
                  ...prev.metadata,
                  preferencias_cuestionario: {
                    ...(prev.metadata?.preferencias_cuestionario || {}),
                    canal: e.target.value
                  }
                }
              }))
            }
          >
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="frecuencia">
            Frecuencia
          </label>
          <select
            id="frecuencia"
            className="w-full p-2 border rounded"
            value={(formData.metadata?.preferencias_cuestionario as any)?.frecuencia || 'mensual'}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                metadata: {
                  ...prev.metadata,
                  preferencias_cuestionario: {
                    ...(prev.metadata?.preferencias_cuestionario || {}),
                    frecuencia: e.target.value
                  }
                }
              }))
            }
          >
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
          </select>
        </div>
        <div className="mb-3 flex items-center">
          <input
            id="sendInitial"
            type="checkbox"
            className="mr-2"
            checked={(formData.metadata as any).sendInitial}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                metadata: {
                  ...prev.metadata,
                  sendInitial: e.target.checked
                }
              }))
            }
          />
          <label htmlFor="sendInitial" className="text-sm font-medium">
            Enviar cuestionario inmediatamente
          </label>
        </div>
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
