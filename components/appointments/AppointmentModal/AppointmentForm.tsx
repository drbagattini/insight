"use client";

import React, { useState, useEffect } from 'react';
import PatientSelector, { Patient } from './PatientSelector'; // Assuming Patient type is exported

export interface AppointmentFormData {
  patient: Patient | null;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  title?: string;
  // We will add recurrence fields later
}

interface AppointmentFormProps {
  initialData?: Partial<AppointmentFormData>;
  onSubmit: (data: AppointmentFormData) => void;
  // onOpenNewPatientModal: () => void; // To be passed to PatientSelector
  isEditing?: boolean; // Determina si estamos editando una cita existente
}

const today = new Date().toISOString().split('T')[0];

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  initialData = {},
  onSubmit,
  // onOpenNewPatientModal,
  isEditing = false
}) => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(initialData.patient || null);
  const [date, setDate] = useState<string>(initialData.date || today);
  const [startTime, setStartTime] = useState<string>(initialData.startTime || '09:00');
  const [endTime, setEndTime] = useState<string>(initialData.endTime || '09:15');
  const [title, setTitle] = useState<string>(initialData.title || '');
  const [timeError, setTimeError] = useState<string>('');

  useEffect(() => {
    // Update form state if initialData prop changes
    if (initialData) {
      setSelectedPatient(initialData.patient || null);
      setDate(initialData.date || today);
      setStartTime(initialData.startTime || '09:00');
      setEndTime(initialData.endTime || '09:45');
      setTitle(initialData.title || '');
    }
  }, [initialData]);

  // Generar opciones de hora en intervalos de 15 minutos (7:00 AM a 10:00 PM)
  const generateTimeOptions = () => {
    const options = [];
    const startHour = 7; // 7:00 AM
    const endHour = 22; // 10:00 PM

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const hourFormatted = hour.toString().padStart(2, '0');
        const minFormatted = min.toString().padStart(2, '0');
        options.push(`${hourFormatted}:${minFormatted}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Actualizar la hora de fin automáticamente cuando cambia la hora de inicio (duración de 45 min)
  useEffect(() => {
    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0);
      
      // Añadir 45 minutos para la hora de fin
      const endDate = new Date(startDate.getTime() + 45 * 60000);
      const endHours = endDate.getHours().toString().padStart(2, '0');
      const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
      
      // Solo actualizamos si el usuario no ha seleccionado manualmente otra hora de fin
      setEndTime(`${endHours}:${endMinutes}`);
    }
  }, [startTime]);

  // Validación de hora de inicio y fin
  useEffect(() => {
    // Basic time validation
    if (startTime && endTime) {
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);
      if (endDateTime <= startDateTime) {
        setTimeError('La hora de fin debe ser posterior a la hora de inicio');
      } else {
        setTimeError('');
      }
    }
  }, [date, startTime, endTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (timeError) {
      // Prevent submission if there's a time error
      // Optionally, show a more prominent error message/toast
      console.error('Cannot submit form due to time validation error.');
      return;
    }
    if (!selectedPatient) {
      // TODO: Add proper validation and user feedback
      console.error('Patient is required');
      return;
    }
    // Patient is now mandatory
    if (!selectedPatient || !selectedPatient.id) {
      // TODO: Show a user-friendly validation message next to the PatientSelector
      console.error('Patient selection is required.');
      alert('Por favor, seleccione un paciente.'); // Temporary alert
      return;
    }

    onSubmit({
      patient: selectedPatient, // selectedPatient should now always be a valid patient object or null if not selected
      date,
      startTime,
      endTime,
      title,
    });
  };

  return (
    <form id="appointment-form-id" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="patient" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Paciente
        </label>
        {isEditing && selectedPatient ? (
          <div className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            {selectedPatient.name}
          </div>
        ) : (
          <PatientSelector 
            selectedPatient={selectedPatient} 
            setSelectedPatient={setSelectedPatient}
            // onOpenNewPatientModal={onOpenNewPatientModal} 
          />
        )}
        {/* TODO: Add validation message if patient not selected */}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Título (Opcional)
        </label>
        <input
          type="text"
          name="title"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Ej: Sesión de seguimiento"
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Fecha
        </label>
        <input
          type="date"
          name="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={today} // Optional: prevent selecting past dates
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Hora Inicio
          </label>
          <select
            name="startTime"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            {timeOptions.map((time) => (
              <option key={`start-${time}`} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Hora Fin
          </label>
          <select
            name="endTime"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            {timeOptions.map((time) => (
              <option key={`end-${time}`} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>
      {timeError && (
        <p className="text-sm text-red-600 dark:text-red-400">{timeError}</p>
      )}

      {/* Submit button will be part of AppointmentModal/index.tsx to control modal actions */}
      {/* This form will be wrapped, and the submit action will be triggered by a button in the modal */}
    </form>
  );
};

export default AppointmentForm;
