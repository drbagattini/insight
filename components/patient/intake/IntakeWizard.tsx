import React from 'react';
import { useState } from 'react';
import { IntakeData } from '@/app/hooks/useIntake'; // Corrected import path
import IntakeForm from './IntakeForm';
import IntakeReadOnlyView from './IntakeReadOnlyView';

interface IntakeWizardProps {
  intakeData: IntakeData; // Assumed to be non-null by PatientIntakeTab
  intakeHasContent: boolean;
}

const IntakeWizard: React.FC<IntakeWizardProps> = ({ intakeData, intakeHasContent }) => {
  const [isEditing, setIsEditing] = useState<boolean>(!intakeHasContent);

  console.log('[DEBUG] IntakeWizard render:', {
    intakeHasContent,
    isEditing,
    intakeDataState: intakeData?.estado,
    intakeDataId: intakeData?.id
  });

  const handleEdit = () => {
    console.log('[DEBUG] IntakeWizard handleEdit called');
    setIsEditing(true);
  };

  const handleSaveOrCancel = () => {
    console.log('[DEBUG] IntakeWizard handleSaveOrCancel called');
    setIsEditing(false);
    // Data will be refetched by useIntake hook due to query invalidation or cache update on mutation success,
    // which will update intakeHasContent and re-render this component correctly.
  };

  // If actively editing, or if there's an intake row but no meaningful content (empty draft), show the form.
  if (isEditing || !intakeHasContent) {
    console.log('[DEBUG] IntakeWizard showing IntakeForm');
    return <IntakeForm intakeData={intakeData} onSaveSuccess={handleSaveOrCancel} onCancel={handleSaveOrCancel} />;
  }
  
  // Otherwise (not editing and has content), show the read-only view.
  console.log('[DEBUG] IntakeWizard showing IntakeReadOnlyView');
  return <IntakeReadOnlyView intakeData={intakeData} onEdit={handleEdit} />;
};

export default IntakeWizard;
