'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tab } from '@headlessui/react';
import { useIntake, IntakeData } from '@/app/hooks/useIntake';
import { intakeSchema, IntakeFormValues, intakeFieldsDefinition, WIZARD_STEPS } from '@/app/lib/intake-form-schema';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import debounce from 'lodash.debounce';


interface IntakeFormProps {
  intakeData: IntakeData;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

const IntakeForm: React.FC<IntakeFormProps> = ({ intakeData, onSaveSuccess, onCancel }) => {
  const { updateIntake, isUpdating } = useIntake(intakeData.paciente_id);
  const [currentStep, setCurrentStep] = useState(1);
  const [patientName, setPatientName] = useState<string>('');

  // Cargar el nombre del paciente
  useEffect(() => {
    const loadPatientName = async () => {
      try {
        const res = await fetch('/api/patients');
        const list = await res.json();
        const patient = list.find((p: any) => p.id === intakeData.paciente_id);
        setPatientName(patient?.name || '');
      } catch (error) {
        console.error('Error al cargar paciente:', error);
      }
    };
    loadPatientName();
  }, [intakeData.paciente_id]);

  // Auto-completar fecha de entrevista si no existe
  const defaultValues: IntakeFormValues = useMemo(() => ({
    ...intakeData.datos,
    fechaEntrevista: intakeData.datos?.fechaEntrevista || new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    nombrePaciente: intakeData.datos?.nombrePaciente || patientName,
    sexo: (intakeData.datos?.sexo === 'Femenino' || intakeData.datos?.sexo === 'Masculino') ? intakeData.datos.sexo : undefined
  }), [intakeData.datos, patientName]);

  const { control, handleSubmit, watch, reset, formState: { errors, isDirty } } = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues,
  });

  // Actualizar formulario cuando se carga el nombre del paciente
  useEffect(() => {
    if (patientName && !intakeData.datos?.nombrePaciente) {
      reset(defaultValues);
    }
  }, [patientName, intakeData.datos?.nombrePaciente, reset]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce((formData: IntakeFormValues) => {
      updateIntake({ intakeId: intakeData.id, updateData: { datos: formData } });
    }, 1500), // Autoguardado 1.5 segundos después de dejar de escribir
    [updateIntake, intakeData.id]
  );

  useEffect(() => {
    const subscription = watch((value) => {
      if (isDirty) {
        debouncedSave(value as IntakeFormValues);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, debouncedSave, isDirty]);

  const onFinalize = async (formData: IntakeFormValues) => {
    try {
      await updateIntake({ 
        intakeId: intakeData.id, 
        updateData: { datos: formData, estado: 'finalizada' }
      });
      onSaveSuccess(); // Notificar al padre que se guardó correctamente
    } catch (error) {
      console.error("Error al finalizar la entrevista:", error);
      // Opcional: Mostrar un mensaje de error al usuario
    }
  };

  const onInvalid = (validationErrors: any) => {
    console.error('Errores de validación del formulario:', validationErrors);
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

  const renderField = (field: any) => {
    const { key, label, control: fieldControl, options } = field;

    return (
      <div key={key} className="mb-4">
        <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <Controller
          name={key as keyof IntakeFormValues}
          control={control}
          render={({ field: formField }) => {
            switch (fieldControl) {
              case 'textarea':
                const rows = typeof options === 'string' && options.includes('rows:') ? parseInt(options.split('rows:')[1].split(',')[0], 10) : 3;
                const placeholder = typeof options === 'string' && options.includes('placeholder:') ? options.split('placeholder:')[1].split(',')[0] : '';
                return (
                  <Textarea
                    {...formField}
                    id={key}
                    rows={rows}
                    placeholder={placeholder}
                  />
                );
              case 'select':
                const selectOptions = Array.isArray(options) ? options : [];
                const isObjectOptions = typeof selectOptions[0] === 'object' && selectOptions[0] !== null;
                
                return (
                  <Select 
                    onValueChange={formField.onChange} 
                    defaultValue={formField.value ? formField.value.toString() : ''}
                  >
                    <SelectTrigger><SelectValue placeholder={`Seleccione ${label.toLowerCase()}`} /></SelectTrigger>
                    <SelectContent>
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
                    {(multiSelectOptions as any[]).map(opt => (
                      <div key={opt.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${key}-${opt.value}`}
                          checked={(formField.value as string[] | undefined)?.includes(opt.value)}
                          onCheckedChange={checked => {
                            const currentValues = (formField.value as string[] | undefined) || [];
                            const newValues = checked
                              ? [...currentValues, opt.value]
                              : currentValues.filter(v => v !== opt.value);
                            formField.onChange(newValues);
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
                const isReadOnly = typeof options === 'string' && options.includes('readonly');
                return <Input {...formField} value={formField.value || ''} type="text" readOnly={isReadOnly} />;
            }
          }}
        />
        {errors[key as keyof IntakeFormValues] && <p className="text-red-500 text-xs mt-1">{errors[key as keyof IntakeFormValues]?.message}</p>}
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
              <Tab.Panel key={step.id}>
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
