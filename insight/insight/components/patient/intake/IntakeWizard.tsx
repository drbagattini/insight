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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveOrCancel = () => {
    setIsEditing(false);
    // Data will be refetched by useIntake hook due to query invalidation or cache update on mutation success,
    // which will update intakeHasContent and re-render this component correctly.
  };

  // If actively editing, or if there's an intake row but no meaningful content (empty draft), show the form.
  if (isEditing || !intakeHasContent) {
    return <IntakeForm intakeData={intakeData} onSaveSuccess={handleSaveOrCancel} onCancel={handleSaveOrCancel} />;
  }
  
  // Otherwise (not editing and has content), show the read-only view.
  return <IntakeReadOnlyView intakeData={intakeData} onEdit={handleEdit} />;
};

export default IntakeWizard;
