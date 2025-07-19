import { useState, useEffect } from 'react';
import { Patient, NewPatient } from '@/types/patients';
import { FiUser, FiMail, FiPhone, FiCheck, FiAlertCircle } from 'react-icons/fi';

interface PatientFormProps {
  patient?: Patient;
  onSubmit: (data: NewPatient) => Promise<void>;
  onCancel: () => void;
}

export default function PatientForm({ patient, onSubmit, onCancel }: PatientFormProps) {
  const [formData, setFormData] = useState<NewPatient>(() => ({
    name: patient?.name || '',
    email: patient?.email || null,
    whatsapp: patient?.whatsapp || null,
    metadata: {
      cuestionario_id: patient?.metadata?.cuestionario_id || '',
      preferencias_cuestionario: patient?.metadata?.preferencias_cuestionario || {
        canal: 'email',
        frecuencia: 'mensual'
      },
      // sendInitial removed from here
      whatsappConsent: patient?.metadata?.whatsappConsent ?? false
    },
    sendInitial: patient ? false : true, // Default to false for existing, true for new
  }));
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionarios, setQuestionarios] = useState<{ id: string; nombre: string }[]>([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[PatientForm] handleSubmit triggered'); // Debug log
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar paciente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="patient-form" className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Paciente</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  required
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.name || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Juan Pérez"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.email || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value || null
                    }))
                  }
                  placeholder="ejemplo@email.com"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
                Teléfono (WhatsApp)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiPhone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="whatsapp"
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.whatsapp?.replace('+54', '') || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      whatsapp: e.target.value ? `+54${e.target.value.replace(/\D/g, '')}` : null,
                    }))
                  }
                  placeholder="9 11 1234-5678"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <div className="relative flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="whatsappConsent"
                    name="whatsappConsent"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
  checked={!!(formData.metadata as any).whatsappConsent}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        metadata: {
                          ...(prev.metadata as any),
                          whatsappConsent: e.target.checked,
                        },
                      }))
                    }
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="whatsappConsent" className="font-medium text-gray-700">
                    Consentimiento de WhatsApp
                  </label>
                  <p className="text-gray-500">
                    He obtenido el consentimiento del paciente para enviarle notificaciones por WhatsApp
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Preferencias de Cuestionario</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label htmlFor="cuestionario" className="block text-sm font-medium text-gray-700">
                Cuestionario <span className="text-red-500">*</span>
              </label>
              <select
                id="cuestionario"
                required
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
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
                  <option key={q.id} value={q.id}>{q.nombre}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="canal" className="block text-sm font-medium text-gray-700">
                Canal de envío
              </label>
              <select
                id="canal"
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
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
                <option value="email">Correo electrónico</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="frecuencia" className="block text-sm font-medium text-gray-700">
                Frecuencia
              </label>
              <select
                id="frecuencia"
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
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

            <div className="sm:col-span-6">
              <div className="relative flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="sendInitial"
                    name="sendInitial"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={!!formData.sendInitial} // Read from top-level
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sendInitial: e.target.checked // Update top-level
                      }))
                    }
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="sendInitial" className="font-medium text-gray-700">
                    Enviar cuestionario inmediatamente
                  </label>
                  <p className="text-gray-500">
                    El paciente recibirá el cuestionario inmediatamente después de guardar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <FiCheck className="-ml-1 mr-2 h-4 w-4" />
                {patient ? 'Actualizar Paciente' : 'Crear Paciente'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
