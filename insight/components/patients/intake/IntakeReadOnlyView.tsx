import React from 'react';
import { IntakeData } from '@/app/hooks/useIntake';
import { intakeFieldsDefinition, WIZARD_STEPS } from '@/app/lib/intake-form-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface IntakeReadOnlyViewProps {
  intakeData: IntakeData;
  onEdit: () => void;
}

const IntakeReadOnlyView: React.FC<IntakeReadOnlyViewProps> = ({ intakeData, onEdit }) => {
  const { datos, fecha_fin } = intakeData;

  const formatDisplayValue = (fieldKey: keyof typeof datos, value: any): string => {
    if (value === null || value === undefined || value === '') {
      return 'No especificado';
    }

    const fieldDef = intakeFieldsDefinition.find(f => f.key === fieldKey);

        if (!fieldDef || !('options' in fieldDef) || !fieldDef.options || !Array.isArray(fieldDef.options)) {
      return Array.isArray(value) ? value.join(', ') : String(value);
    }

    const options = fieldDef.options as readonly { value: string; label: string }[];

    if (fieldDef.control === 'multiselect' && Array.isArray(value)) {
      const selectedLabels = value.map(val => {
        const option = options.find(opt => opt.value === val);
        if (option?.value === '7' && fieldKey === 'ayudaEsperada') {
          return datos.ayudaBuscadaOtro || 'Otro';
        }
        return option ? option.label : val;
      });
      return selectedLabels.join(', ');
    }
    
    const stringValue = String(value);
    const option = options.find(opt => opt.value === stringValue);
    return option ? option.label : stringValue;
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Resumen de la Entrevista Inicial</CardTitle>
          <div className="flex items-center space-x-4">
            {fecha_fin && <span className="text-sm text-gray-500">Finalizada el: {new Date(fecha_fin).toLocaleDateString('es-ES')}</span>}
            <Button onClick={onEdit} variant="outline" size="sm">Editar Entrevista</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {WIZARD_STEPS.map(step => (
            <div key={step.id}>
              <h3 className="text-lg font-semibold border-b pb-2 mb-3 text-indigo-600">{step.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {intakeFieldsDefinition
                  .filter(field => {
                    const fieldValue = datos[field.key as keyof typeof datos];
                    return field.step === step.id && fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
                  })
                  .map(field => {
                    const value = datos[field.key as keyof typeof datos];
                    return (
                      <div key={field.key}>
                        <p className="text-sm font-medium text-gray-500">{field.label}</p>
                        <p className="text-base text-gray-800">
                          {formatDisplayValue(field.key as keyof typeof datos, value)}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default IntakeReadOnlyView;
