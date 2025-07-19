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



  // Helper function to get step color theme
  const getStepTheme = (stepId: number) => {
    const themes = {
      1: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', accent: 'text-blue-600' },
      2: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', accent: 'text-purple-600' },
      3: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', accent: 'text-emerald-600' },
      4: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', accent: 'text-amber-600' },
      5: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', accent: 'text-indigo-600' }
    };
    return themes[stepId as keyof typeof themes] || themes[1];
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <Card className="border-l-4 border-l-indigo-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-white py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div>
              <CardTitle className="text-xl text-gray-900 mb-1">Entrevista Inicial Completada</CardTitle>
              {fecha_fin && (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    Finalizada
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(fecha_fin).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
            <Button 
              onClick={onEdit} 
              variant="outline" 
              size="sm"
              className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 font-medium"
            >
              Editar Entrevista
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Content Sections */}
      <div className="space-y-4">
        {WIZARD_STEPS.map(step => {
          const fieldsForStep = intakeFieldsDefinition.filter(field => {
            const fieldValue = datos[field.key as keyof typeof datos];
            return field.step === step.id && fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
          });

          if (fieldsForStep.length === 0) return null;

          const theme = getStepTheme(step.id);

          return (
            <Card key={step.id} className={`${theme.border} border-l-4 shadow-sm hover:shadow-md transition-shadow duration-200`}>
              <CardHeader className={`${theme.bg} border-b border-gray-100 py-3`}>
                <CardTitle className={`text-lg ${theme.text} font-semibold flex items-center space-x-2`}>
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full bg-white ${theme.text} text-sm font-bold border-2 ${theme.border}`}>
                    {step.id}
                  </span>
                  <span>{step.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
                  {fieldsForStep.map(field => {
                    const value = datos[field.key as keyof typeof datos];
                    const displayValue = formatDisplayValue(field.key as keyof typeof datos, value);
                    const isLongText = displayValue.length > 100;

                    return (
                      <div 
                        key={field.key} 
                        className={`${isLongText ? 'lg:col-span-2' : ''} bg-white rounded border border-gray-100 p-3 hover:border-gray-200 transition-colors`}
                      >
                        <div className="mb-1">
                          <label className="text-sm font-medium text-gray-600 leading-tight">
                            {field.label}
                          </label>
                        </div>
                        
                        {isLongText ? (
                          <div className="prose prose-sm max-w-none">
                            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap border-l-2 border-gray-200 pl-3 py-2 bg-gray-50 rounded-r">
                              {displayValue}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-gray-800">
                            {displayValue}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default IntakeReadOnlyView;
