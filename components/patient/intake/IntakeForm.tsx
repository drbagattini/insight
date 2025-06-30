'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tab } from '@headlessui/react';
// Corrected imports to use the modern hook and its types
import { useIntake, IntakeRecord } from '@/app/hooks/useIntake';
import { intakeSchema, IntakeFormValues, intakeFieldsDefinition, WIZARD_STEPS } from '@/app/lib/intake-form-schema';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import debounce from 'lodash.debounce';

const formatDateForInput = (date: Date | string | undefined): string => {
  if (!date) return '';
  if (typeof date === 'string') {
    // Attempt to handle ISO strings or already formatted strings
    return date.split('T')[0];
  }
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '';
};

// Props now expect the modern IntakeRecord
interface IntakeFormProps {
  intakeData: IntakeRecord;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

// A complete set of default values based on the OLD schema (intake-form-schema.ts)
// This is crucial for react-hook-form to prevent uncontrolled component errors.
const completeDefaultValues: IntakeFormValues = {
  fechaEntrevista: undefined,
  nombrePaciente: '',
  edad: undefined,
  sexo: undefined,
  estadoCivil: undefined,
  ocupacion: undefined,
  grupoFamiliar: '',
  motivoConsulta: '',
  derivante: undefined,
  presentacion: '',
  diagnosticoTexto: '',
  nivelPersonalidad: undefined,
  etiologia: '',
  malestarPaciente: undefined,
  ayudaBuscada: [],
  ayudaBuscadaOtro: '',
  gravedadTerapeuta: undefined,
  funcionamientoGlobal: undefined,
  apoyoSocial: undefined,
  medicacionPrev: '',
  antecedentesSM: '',
  biologicos: '',
  estrategia: '',
  posicionTerap: undefined,
  derivacion: undefined,
};

const IntakeForm: React.FC<IntakeFormProps> = ({ intakeData, onSaveSuccess, onCancel }) => {
  const params = useParams<{ patientId: string }>();
  const patientIdParam = params?.patientId as string | undefined;
  // Use the correct patient_id from the modern IntakeRecord
  const effectivePatientId = intakeData.patient_id ?? patientIdParam;

  if (!effectivePatientId) {
    console.error('Patient ID not found in intakeData or URL params');
  }
  const { updateIntake, isUpdating } = useIntake(effectivePatientId ?? '');
  const [currentStep, setCurrentStep] = useState(1);
  const [isFormReady, setIsFormReady] = useState(false); // State to control autosave readiness
  const [patientName, setPatientName] = useState<string>('');

  // Cargar el nombre del paciente
  useEffect(() => {
    const loadPatientName = async () => {
      try {
        const res = await fetch('/api/patients');
        const list = await res.json();
        const patient = list.find((p: any) => p.id === effectivePatientId);
        setPatientName(patient?.name || '');
      } catch (error) {
        console.error('Error al cargar paciente:', error);
      }
    };
    if (effectivePatientId) {
      loadPatientName();
    }
  }, [effectivePatientId]);

  // Auto-completar fecha de entrevista si no existe y sincronizar nombre del paciente
  const defaultValues: IntakeFormValues = useMemo(() => {
    const merged = {
      ...completeDefaultValues,
      ...intakeData.data,
    } as IntakeFormValues;
    
    // Si no hay fecha en los datos, usar la fecha actual
    if (!intakeData.data?.fechaEntrevista) {
      merged.fechaEntrevista = new Date();
    } else {
      // Si hay fecha, asegurarse de que sea un objeto Date
      try {
        const fechaValue = intakeData.data.fechaEntrevista;
        if (fechaValue instanceof Date) {
          merged.fechaEntrevista = fechaValue;
        } else {
          merged.fechaEntrevista = new Date(String(fechaValue));
          
          // Si la conversión falla, usar la fecha actual
          if (isNaN(merged.fechaEntrevista.getTime())) {
            merged.fechaEntrevista = new Date();
          }
        }
      } catch (e) {
        console.error('Error al parsear fecha:', e);
        merged.fechaEntrevista = new Date();
      }
    }
    
    // Siempre sincronizar el nombre del paciente con el valor más actualizado disponible
    // Prioridad: intakeData (si existe) -> patientName (del API) -> valor vacío
    merged.nombrePaciente = intakeData.data?.nombrePaciente || patientName || '';

    console.log('🔵 [IntakeForm useMemo] defaultValues inicializados:', JSON.stringify(merged, null, 2));

    return merged;
  }, [intakeData.data, patientName]);

  const { control, handleSubmit, watch, reset, formState: { errors, isDirty } } = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues,
    // Important: re-initialize form when `defaultValues` object instance changes
    // This ensures data loaded from server populates the form correctly.
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  // Reset form when default values change (e.g., patient name loads)
  useEffect(() => {
    if (intakeData) {
      const formData = intakeData.data || {};
      const initialValues = {
        ...defaultValues,
        ...formData,
        fechaEntrevista: formatDateForInput(formData.fechaEntrevista),
        nombrePaciente: patientName || formData.nombrePaciente,
      };
      reset(initialValues as unknown as IntakeFormValues);
    } else {
      reset({
        ...defaultValues,
        nombrePaciente: patientName,
        fechaEntrevista: formatDateForInput(new Date()),
      } as unknown as IntakeFormValues);
    }
  }, [intakeData, patientName, reset]);

  const onValid = (data: IntakeFormValues) => {
    console.log('✅ [onValid] Datos validados por el formulario, procediendo a guardar:', JSON.stringify(data, null, 2));
    if (isUpdating) return;
    // The actual update is now called from here, with validated data.
    updateIntake({ updateData: data });
  };

  const onInvalid = (validationErrors: any) => {
    console.error('❌ [onInvalid] Errores de validación del formulario:', JSON.stringify(validationErrors, null, 2));
    const firstErrorField = Object.keys(validationErrors)[0];
    const fieldDef = intakeFieldsDefinition.find(f => f.key === firstErrorField);
    if (fieldDef) {
      setCurrentStep(fieldDef.step);
      const stepName = WIZARD_STEPS.find(s => s.id === fieldDef.step)?.name || 'desconocida';
      alert(`Por favor, corrija los errores en la pestaña "${stepName}".\nEl primer error es: ${validationErrors[firstErrorField].message}`);
    } else {
      alert('Por favor, revise el formulario. Hay campos con errores.');
    }
  };

  // Debounced version of handleSubmit to implement autosave.
  // It triggers validation and only calls onValid if the data is clean.
  const debouncedHandleSubmit = useCallback(
    debounce(() => {
      handleSubmit(onValid, onInvalid)();
    }, 1500), // 1.5 second debounce timer
    [handleSubmit, onValid, onInvalid]
  );

  // Autosave effect: triggers the debounced handleSubmit on any form change.
  useEffect(() => {
    if (!isFormReady) return; // Don't attach the watcher until the form is initialized

    const subscription = watch((value) => {
      debouncedHandleSubmit();
    });
    return () => {
      subscription.unsubscribe();
      debouncedHandleSubmit.cancel(); // Clean up the debounced function on unmount
    };
  }, [watch, debouncedHandleSubmit, isFormReady]);

  // Finalize now sends data in the modern format with `publish: true`
  const onFinalize = async (formData: IntakeFormValues) => {
    try {
      await updateIntake({ 
        updateData: formData, 
        publish: true // Use `publish: true` instead of old `estado` field
      });
      onSaveSuccess();
    } catch (error) {
      console.error("Error al finalizar la entrevista:", error);
    }
  };


  // Función para obtener el placeholder desde las opciones o generar uno por defecto
  const getPlaceholder = (fieldDef: (typeof intakeFieldsDefinition)[number]): string | undefined => {
    const { label, options } = fieldDef;
    
    if (!options || typeof options !== 'string') return `Ingrese ${label.toLowerCase()}`;
    
    if (options.includes('placeholder:')) {
      const match = options.match(/placeholder:([^,]*)/);
      return match ? match[1] : `Ingrese ${label.toLowerCase()}`;
    }
    
    return `Ingrese ${label.toLowerCase()}`;
  };
  
  // Función para determinar el número de filas para un textarea
  const getRows = (fieldDef: (typeof intakeFieldsDefinition)[number]): number => {
    const { options } = fieldDef;
    
    if (!options || typeof options !== 'string') return 4;
    
    if (options.includes('rows:')) {
      const match = options.match(/rows:([0-9]+)/);
      return match ? parseInt(match[1], 10) : 4;
    }
    
    return 4;
  };

  const renderField = (fieldDef: (typeof intakeFieldsDefinition)[number]) => {
    const { key, label, control: fieldControl, options } = fieldDef;
    // Convertir la key tipada a string para facilitar las comparaciones
    const fieldKey = key as string;

    // Verificar si el campo debe ser de solo lectura
    const isReadOnly = typeof options === 'string' && 
      (options.includes('readonly') || options.includes('auto-now'));
    
    // Obtener placeholder y filas para textareas
    const placeholder = getPlaceholder(fieldDef);
    const rows = getRows(fieldDef);

    return (
      <div key={fieldKey} className="mb-4">
        <label htmlFor={fieldKey} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <Controller
          name={fieldKey as keyof IntakeFormValues}
          control={control}
          render={({ field }) => {
            switch (fieldControl) {
              case 'text':
                // Si es fechaEntrevista, manejar como fecha
                if (fieldKey === 'fechaEntrevista') {
                  return (
                    <div className="px-3 py-2 text-sm bg-gray-100 border rounded-md">
                      {formatDateForInput(field.value as Date | string | undefined) || new Date().toLocaleDateString('es-AR')}
                    </div>
                  );
                }
                return (
                  <Input
                    {...field}
                    id={fieldKey}
                    type="text"
                    readOnly={isReadOnly}
                    className={`${errors[fieldKey as keyof typeof errors] ? 'border-red-500' : ''} ${isReadOnly ? 'bg-gray-100' : ''}`}
                    value={String(field.value || '')}
                  />
                );
              case 'textarea':
                return (
                  <Textarea
                    {...field}
                    id={fieldKey}
                    rows={rows}
                    readOnly={isReadOnly}
                    placeholder={placeholder}
                    className={`${errors[fieldKey as keyof typeof errors] ? 'border-red-500' : ''} ${isReadOnly ? 'bg-gray-100' : ''}`}
                    value={String(field.value || '')}
                  />
                );
              case 'select':
                let selectOptions: Array<any> = [];
                
                if (fieldKey === 'edad') {
                  selectOptions = Array.from({ length: 91 }, (_, i) => i);
                } else if (Array.isArray(options)) {
                  selectOptions = options;
                }
                
                const isObjectOptions = selectOptions.length > 0 && 
                  typeof selectOptions[0] === 'object' && selectOptions[0] !== null;
                
                return (
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value ? field.value.toString() : ''}
                  >
                    <SelectTrigger><SelectValue placeholder={`Seleccione ${label.toLowerCase()}`} /></SelectTrigger>
                    <SelectContent className="z-[9999]">
                      {selectOptions.map((opt: any) => {
                        const value = isObjectOptions ? opt.value : opt;
                        const displayLabel = isObjectOptions ? opt.label : (key === 'edad' ? `${opt} años` : opt);
                        return (
                          <SelectItem key={value} value={value.toString()}>
                            {displayLabel}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                );
              case 'multiselect':
                const multiSelectOptions = Array.isArray(options) ? options : [];
                return (
                  <div className="space-y-2 rounded-md border p-4">
                    {(multiSelectOptions as {value: string, label: string}[]).map(opt => (
                      <div key={opt.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${key}-${opt.value}`}
                          checked={(Array.isArray(field.value) ? field.value : []).includes(opt.value)}
                          onCheckedChange={checked => {
                            const currentValues = (Array.isArray(field.value) ? field.value : []);
                            const newValues = checked
                              ? [...currentValues, opt.value]
                              : currentValues.filter((v: string) => v !== opt.value);
                            field.onChange(newValues);
                          }}
                        />
                        <label htmlFor={`${key}-${opt.value}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {opt.label}
                        </label>
                      </div>
                    ))}
                  </div>
                );
              default:
                return <Input {...field} value={field.value || ''} type="text" />;
            }
          }}
        />
        {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]?.message}</p>}
      </div>
    );
  };

  return (
    <div className="w-full mx-auto p-4 bg-white rounded-lg shadow-md mt-4">
      <Tab.Group vertical selectedIndex={currentStep - 1} onChange={(index) => setCurrentStep(index + 1)}>
        <div className="flex">
          <Tab.List className="flex flex-col w-1/4 space-y-1">
            {WIZARD_STEPS.map(step => (
              <Tab key={step.id} className={({ selected }) =>
                cn('px-4 py-2 text-left text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
                  selected ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
                )}>
                {step.name}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="w-3/4 pl-4">
            {WIZARD_STEPS.map(step => (
              <Tab.Panel key={step.id} className="static">
                <h3 className="text-lg font-semibold mb-4">{step.name}</h3>
                {intakeFieldsDefinition
                  .filter(field => field.step === step.id)
                  .map(field => {
                    if (field.key === 'ayudaBuscadaOtro') {
                      const ayudaBuscada = watch('ayudaBuscada');
                      if (!ayudaBuscada || !Array.isArray(ayudaBuscada) || !ayudaBuscada.includes('7')) {
                        return null;
                      }
                    }
                    return renderField(field);
                  })}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </div>
      </Tab.Group>

      <div className="mt-6 flex justify-between items-center">
        <div>
          {isUpdating && <span className="text-sm text-gray-500 flex items-center"><Loader2 className="h-4 w-4 animate-spin mr-2"/>Guardando...</span>}
        </div>
        <div className="flex gap-4">
            <Button variant="outline" onClick={() => setCurrentStep(s => Math.max(1, s - 1))} disabled={currentStep === 1}>Anterior</Button>
            <Button onClick={() => setCurrentStep(s => Math.min(WIZARD_STEPS.length, s + 1))} disabled={currentStep === WIZARD_STEPS.length}>Siguiente</Button>
            <Button onClick={handleSubmit(onFinalize, onInvalid)} disabled={isUpdating}>
              {isUpdating ? 'Finalizando...' : 'Finalizar Entrevista'}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default IntakeForm;
