import { useState, useEffect } from 'react';
import { Patient, NewPatient } from '@/types/patients';
import { FiUser, FiMail, FiPhone, FiCheck, FiAlertCircle, FiFileText, FiSettings, FiSend } from 'react-icons/fi';

interface PatientFormProps {
  patient?: Patient;
  onSubmit: (data: NewPatient) => Promise<void>;
  onCancel: () => void;
}

const COUNTRY_CODES = [
  { code: '598', label: '🇺🇾 +598', fullLabel: '🇺🇾 Uruguay (+598)' },
  { code: '54', label: '🇦🇷 +54', fullLabel: '🇦🇷 Argentina (+54)' },
  { code: '55', label: '🇧🇷 +55', fullLabel: '🇧🇷 Brasil (+55)' },
  { code: '56', label: '🇨🇱 +56', fullLabel: '🇨🇱 Chile (+56)' },
  { code: '595', label: '🇵🇾 +595', fullLabel: '🇵🇾 Paraguay (+595)' },
];

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
      whatsappConsent: patient?.metadata?.whatsappConsent ?? false,
      // Campos para contacto de padre/tutor
      padre_tutor: patient?.metadata?.padre_tutor || {
        nombre: '',
        email: '',
        telefono: ''
      }
    },
    sendInitial: patient ? false : true, // Default to false for existing, true for new
  }));
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionarios, setQuestionarios] = useState<{ id: string; nombre: string; codigo?: string; titulo?: string; destinatario?: string }[]>([]);
  const [countryCode, setCountryCode] = useState<string>('598'); // Uruguay por defecto
  const [parentCountryCode, setParentCountryCode] = useState<string>('598'); // Uruguay por defecto

  // Detectar código de país del paciente existente
  useEffect(() => {
    if (patient?.whatsapp) {
      const detectedCode = COUNTRY_CODES.find(c => patient.whatsapp?.startsWith(c.code))?.code;
      if (detectedCode) setCountryCode(detectedCode);
    }
    if (patient?.metadata?.padre_tutor?.telefono) {
      const detectedCode = COUNTRY_CODES.find(c => (patient.metadata?.padre_tutor as any)?.telefono?.startsWith(c.code))?.code;
      if (detectedCode) setParentCountryCode(detectedCode);
    }
  }, [patient]);

  useEffect(() => {
    // Intentar primero el endpoint autenticado, luego el público como fallback
    const fetchCuestionarios = async () => {
      console.log('🔄 Iniciando carga de cuestionarios...');
      try {
        let response: Response | null = null;

        // Intentar endpoint autenticado primero
        try {
          console.log('📡 Intentando endpoint autenticado: /api/cuestionarios');
          response = await fetch('/api/cuestionarios');
          console.log('📡 Respuesta endpoint autenticado:', response?.status, response?.ok);
        } catch (e) {
          console.warn('❌ Fallo en endpoint autenticado, usando público como fallback:', e);
        }

        // Fallback al endpoint público ante cualquier status no-OK o si la petición anterior falló
        if (!response || !response.ok) {
          console.warn(`⚠️ GET /api/cuestionarios respondió ${response?.status ?? 'sin respuesta'}; intentando /api/cuestionarios/public...`);
          response = await fetch('/api/cuestionarios/public');
          console.log('📡 Respuesta endpoint público:', response?.status, response?.ok);
        }

        if (!response.ok) {
          throw new Error(`HTTP error al obtener cuestionarios. Último status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📋 Datos recibidos del API:', data);

        // Asegurar que data es un array
        const cuestionariosArray = Array.isArray(data) ? data : (data.cuestionarios || []);
        console.log('✅ Cuestionarios procesados:', cuestionariosArray.length, cuestionariosArray);

        setQuestionarios(cuestionariosArray);

        if (cuestionariosArray.length > 0 && !patient) {
          // Solo establecer cuestionario por defecto para pacientes nuevos
          console.log('🎯 Estableciendo cuestionario por defecto:', cuestionariosArray[0]);
          setFormData(prev => ({
            ...prev,
            metadata: {
              ...(prev.metadata as any),
              cuestionario_id: prev.metadata?.cuestionario_id || cuestionariosArray[0].id
            }
          }));
        }
      } catch (err) {
        console.error('❌ Error fetching cuestionarios:', err);
        setError('No se pudieron cargar los cuestionarios. Intenta nuevamente.');
        setQuestionarios([]); // Fallback a array vacío
      }
    };

    fetchCuestionarios();
  }, [patient]);

  // Función para detectar si un cuestionario es para padres/tutores
  const isParentQuestionnaire = (cuestionarioId: string) => {
    const cuestionario = questionarios.find(q => q.id === cuestionarioId);
    return cuestionario?.destinatario === 'padre_tutor' || cuestionario?.destinatario === 'ambos';
  };

  // Función para determinar el destinatario apropiado
  const getAppropriateRecipient = (cuestionarioId: string) => {
    if (!cuestionarioId) return 'paciente';
    
    if (isParentQuestionnaire(cuestionarioId)) {
      const hasParentContact = (formData.metadata as any)?.padre_tutor?.email || 
                              (formData.metadata as any)?.padre_tutor?.telefono;
      return hasParentContact ? 'padre_tutor' : 'paciente';
    }
    
    return 'paciente';
  };

  // Función para validar si el contacto está disponible para el destinatario
  const validateRecipientContact = (cuestionarioId: string, canal: string) => {
    const recipient = getAppropriateRecipient(cuestionarioId);
    
    if (recipient === 'padre_tutor') {
      const parentData = (formData.metadata as any)?.padre_tutor;
      if (canal === 'email' && !parentData?.email) return false;
      if (canal === 'whatsapp' && !parentData?.telefono) return false;
    } else {
      if (canal === 'email' && !formData.email) return false;
      if (canal === 'whatsapp' && !formData.whatsapp) return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[PatientForm] handleSubmit triggered with data:', {
      name: formData.name,
      email: formData.email,
      sendInitial: formData.sendInitial,
      cuestionario_id: (formData.metadata as any)?.cuestionario_id,
      canal: (formData.metadata as any)?.preferencias_cuestionario?.canal,
      destinatario: getAppropriateRecipient((formData.metadata as any)?.cuestionario_id || '')
    });
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
      <div className="space-y-4">
        <div>
          <div className="flex items-center mb-3">
            <FiUser className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Información del Paciente</h3>
          </div>
          <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
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
                  className="block w-full rounded-md border-gray-300 pl-10 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm shadow-sm"
                  value={formData.name || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Juan Pérez"
                />
              </div>
            </div>

            <div className="sm:col-span-1">
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
                  className="block w-full rounded-md border-gray-300 pl-10 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm shadow-sm"
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

            <div className="sm:col-span-1">
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
                Teléfono (WhatsApp)
              </label>
              <div className="mt-1 flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="block w-32 rounded-md border-gray-300 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm shadow-sm"
                  title={COUNTRY_CODES.find(c => c.code === countryCode)?.fullLabel}
                >
                  {COUNTRY_CODES.map((country) => (
                    <option key={country.code} value={country.code} title={country.fullLabel}>
                      {country.label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  id="whatsapp"
                  className="flex-1 block w-full rounded-md border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm shadow-sm"
                  value={formData.whatsapp?.replace(countryCode, '') || ''}
                  onChange={(e) => {
                    const number = e.target.value.replace(/\D/g, '');
                    setFormData((prev) => ({
                      ...prev,
                      whatsapp: number ? `${countryCode}${number}` : null,
                    }));
                  }}
                  placeholder="99123456"
                />
              </div>
            </div>


          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center mb-3">
            <FiUser className="h-4 w-4 text-green-500 mr-2" />
            <h3 className="text-base font-medium text-gray-900">Contacto de Padre/Tutor</h3>
            <span className="ml-2 text-xs text-gray-500">(Opcional)</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="padre_nombre" className="block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="padre_nombre"
                  className="block w-full rounded-md border-gray-300 pl-10 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm shadow-sm"
                  value={(formData.metadata as any).padre_tutor?.nombre || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      metadata: {
                        ...(prev.metadata as any),
                        padre_tutor: {
                          ...(prev.metadata as any).padre_tutor,
                          nombre: e.target.value
                        }
                      }
                    }))
                  }
                  placeholder="María González"
                />
              </div>
            </div>

            <div>
              <label htmlFor="padre_email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="padre_email"
                  className="block w-full rounded-md border-gray-300 pl-10 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm shadow-sm"
                  value={(formData.metadata as any).padre_tutor?.email || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      metadata: {
                        ...(prev.metadata as any),
                        padre_tutor: {
                          ...(prev.metadata as any).padre_tutor,
                          email: e.target.value
                        }
                      }
                    }))
                  }
                  placeholder="maria@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="padre_telefono" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <div className="mt-1 flex gap-2">
                <select
                  value={parentCountryCode}
                  onChange={(e) => setParentCountryCode(e.target.value)}
                  className="block w-32 rounded-md border-gray-300 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm shadow-sm"
                  title={COUNTRY_CODES.find(c => c.code === parentCountryCode)?.fullLabel}
                >
                  {COUNTRY_CODES.map((country) => (
                    <option key={country.code} value={country.code} title={country.fullLabel}>
                      {country.label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  id="padre_telefono"
                  className="flex-1 block w-full rounded-md border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm shadow-sm"
                  value={(formData.metadata as any).padre_tutor?.telefono?.replace(parentCountryCode, '') || ''}
                  onChange={(e) => {
                    const number = e.target.value.replace(/\D/g, '');
                    setFormData((prev) => ({
                      ...prev,
                      metadata: {
                        ...(prev.metadata as any),
                        padre_tutor: {
                          ...(prev.metadata as any).padre_tutor,
                          telefono: number ? `${parentCountryCode}${number}` : ''
                        }
                      }
                    }));
                  }}
                  placeholder="99123456"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center mb-4">
            <FiFileText className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Preferencias de Cuestionario</h3>
          </div>
          <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label htmlFor="cuestionario" className="block text-sm font-medium text-gray-700">
                Cuestionario
              </label>
              <select
                id="cuestionario"
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm shadow-sm"
                value={(formData.metadata as any).cuestionario_id || ''}
                onChange={e => {
                  console.log('🎯 Seleccionando cuestionario:', e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    metadata: {
                      ...(prev.metadata as any),
                      cuestionario_id: e.target.value
                    },
                    sendInitial: !!e.target.value // Auto-set based on selection
                  }))
                }}
              >
                <option value="">No enviar cuestionario ahora</option>
                {Array.isArray(questionarios) && questionarios.length > 0 ? (
                  questionarios.map(q => (
                    <option key={q.id} value={q.id}>
                      {q.nombre || q.titulo || `Cuestionario ${q.codigo}`}
                    </option>
                  ))
                ) : (
                  <option disabled>Cargando cuestionarios...</option>
                )}
              </select>

              {!(formData.metadata as any).cuestionario_id && (
                <p className="mt-1 text-xs text-gray-500">
                  Puedes configurar el envío de cuestionarios más tarde desde el perfil del paciente
                </p>
              )}
              {(formData.metadata as any).cuestionario_id && (() => {
                const cuestionarioId = (formData.metadata as any).cuestionario_id;
                const recipient = getAppropriateRecipient(cuestionarioId);
                const canal = (formData.metadata?.preferencias_cuestionario as any)?.canal || 'email';
                const isValid = validateRecipientContact(cuestionarioId, canal);
                const isParent = isParentQuestionnaire(cuestionarioId);
                
                if (!isValid) {
                  return (
                    <p className="mt-1 text-xs text-amber-600">
                      ⚠️ {recipient === 'padre_tutor' 
                        ? `Falta información de contacto del padre/tutor para envío por ${canal === 'email' ? 'email' : 'WhatsApp'}`
                        : `Falta información de contacto del paciente para envío por ${canal === 'email' ? 'email' : 'WhatsApp'}`
                      }
                    </p>
                  );
                }
                
                return (
                  <p className="mt-1 text-xs text-green-600">
                    ✅ {recipient === 'padre_tutor' 
                      ? `El padre/tutor recibirá el cuestionario por ${canal === 'email' ? 'email' : 'WhatsApp'} después de guardar`
                      : `El paciente recibirá el cuestionario por ${canal === 'email' ? 'email' : 'WhatsApp'} después de guardar`
                    }
                    {isParent && recipient === 'paciente' && (
                      <span className="block text-amber-600 mt-1">
                        💡 Este cuestionario está diseñado para padres/tutores. Considera agregar su información de contacto.
                      </span>
                    )}
                  </p>
                );
              })()}
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="canal" className="block text-sm font-medium text-gray-700">
                <FiSend className="inline h-4 w-4 mr-1" />
                Canal de envío
              </label>
              <select
                id="canal"
                disabled={!(formData.metadata as any).cuestionario_id}
                className="mt-1 block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
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
                <option value="email">📧 Email</option>
                <option value="whatsapp">💬 WhatsApp</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="frecuencia" className="block text-sm font-medium text-gray-700">
                <FiSettings className="inline h-4 w-4 mr-1" />
                Frecuencia
              </label>
              <select
                id="frecuencia"
                disabled={!(formData.metadata as any).cuestionario_id}
                className="mt-1 block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
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
                <option value="semanal">🗓️ Semanal</option>
                <option value="quincenal">📋 Quincenal</option>
                <option value="mensual">📅 Mensual</option>
                <option value="trimestral">📆 Trimestral</option>
              </select>
            </div>

            {/* Checkbox de WhatsApp horizontal y compacto */}
            <div className="sm:col-span-3">
              <div className="flex items-center space-x-3 mt-2 p-3 bg-gray-50 rounded-md">
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
                <label htmlFor="whatsappConsent" className="text-sm font-medium text-gray-700">
                  Consentimiento de WhatsApp - He obtenido el consentimiento del paciente para enviarle notificaciones por WhatsApp
                </label>
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
