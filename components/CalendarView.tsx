"use client";
import React, { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { formatISO } from 'date-fns';
import { AppointmentModal, ModalAppointmentData } from './appointments/AppointmentModal';
import { useAppointmentMutations } from '@/hooks/useAppointmentMutations'; // Use new modal

interface AppointmentEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

const mapDateSelectArgToModalData = (selectInfo: DateSelectArg): ModalAppointmentData => {
  // Asegurarnos de usar la fecha correcta del evento seleccionado
  console.log('Date selected from calendar:', selectInfo);
  const startDate = new Date(selectInfo.start);
  
  // Default duration: 45 minutes for new appointments
  const endDate = new Date(startDate.getTime() + 45 * 60000);

  // Formatear para obtener solo YYYY-MM-DD
  const formattedDate = startDate.toISOString().split('T')[0];
  
  // Formatear horas para obtener HH:mm, asegurando que sean múltiplos de 15 minutos
  const roundToNearest15Min = (date: Date) => {
    const minutes = date.getMinutes();
    const remainder = minutes % 15;
    if (remainder !== 0) {
      date.setMinutes(minutes - remainder);
    }
    return date;
  };
  
  const roundedStartDate = roundToNearest15Min(new Date(startDate));
  const roundedEndDate = new Date(roundedStartDate.getTime() + 45 * 60000); // 45 minutos después

  return {
    // id is undefined for new appointments
    date: formattedDate,
    startTime: roundedStartDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
    endTime: roundedEndDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
    // patient and title will be handled by the form itself
  };
};

export default function CalendarView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState<DateSelectArg | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<ModalAppointmentData | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const queryClient = useQueryClient();
  const { updateAppointment } = useAppointmentMutations();

  // The handleSaveAppointment function is no longer directly needed here, as the new modal handles saving internally.
  // We might bring back parts of it if CalendarView needs to react to save events, e.g., for optimistic updates not handled by React Query's default cache invalidation.
  // For now, let's comment it out to avoid confusion.
  /* const handleSaveAppointment = async (appointmentData: { title: string; start: string; end: string; paciente_id: string; rrule: string | null }) => {
    try {
      await axios.post('/api/appointments', {
        title: appointmentData.title,
        start_time: appointmentData.start, 
        end_time: appointmentData.end,     
        paciente_id: appointmentData.paciente_id,
        rrule: appointmentData.rrule,
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsModalOpen(false); 
    } catch (error) {
      console.error('Error al guardar la cita:', error);
      alert('Hubo un error al guardar la cita. Por favor, inténtalo de nuevo.');
    }
  }; */

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        slotDuration="00:15:00"
        slotLabelFormat={{
          hour: 'numeric',
          minute: '2-digit',
          omitZeroMinute: false,
          meridiem: 'short'
        }}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        slotLabelInterval="01:00"
        height="70vh"
        slotMinTime="07:00:00"
        slotMaxTime="24:00:00"
        nowIndicator={true}
        editable
        selectable
        events={async (fetchInfo, successCallback, failureCallback) => {
          try {
            const res = await axios.get<AppointmentEvent[]>(
              `/api/appointments?start=${fetchInfo.startStr}&end=${fetchInfo.endStr}`
            );
            const events = res.data.map(ev => ({
              id: ev.id,
              title: ev.title,
              start: ev.start_time,
              end: ev.end_time,
            }));
            successCallback(events);
          } catch (err) {
            failureCallback(err as Error);
          }
        }}
        select={(arg: DateSelectArg) => {
          setSelectedDateInfo(arg);
          setIsModalOpen(true);
        }}
        eventClick={async (clickInfo: EventClickArg) => {
          // Extraer ID base en caso de ser una instancia de recurrencia
          const eventId = clickInfo.event.id.includes('_') 
            ? clickInfo.event.id.split('_')[0] 
            : clickInfo.event.id;
          
          try {
            // Obtener la información completa de la cita desde la API
            const response = await axios.get(`/api/appointments/${eventId}`);
            const appointmentData = response.data;
            
            // Obtener la información del paciente
            let patientInfo = null;
            if (appointmentData.paciente_id) {
              const patientResponse = await axios.get(`/api/patients/${appointmentData.paciente_id}`);
              patientInfo = patientResponse.data;
            }
            
            // Preparar los datos para edición con información completa
            const eventData: ModalAppointmentData = {
              id: eventId,
              title: clickInfo.event.title || '',
              // Extraer fecha YYYY-MM-DD del ISO
              date: new Date(clickInfo.event.start!).toISOString().split('T')[0],
              // Formatear horas como HH:mm para los select
              startTime: new Date(clickInfo.event.start!).toLocaleTimeString('en-GB', { 
                hour: '2-digit', minute: '2-digit', hour12: false 
              }),
              endTime: new Date(clickInfo.event.end!).toLocaleTimeString('en-GB', { 
                hour: '2-digit', minute: '2-digit', hour12: false 
              }),
              // Incluir información completa del paciente
              patient: patientInfo ? {
                id: patientInfo.id,
                name: patientInfo.name
              } : null,
              // Incluir información de recurrencia
              rrule: appointmentData.rrule || null
            };
            
            setSelectedAppointment(eventData);
            setIsModalOpen(true);
          } catch (error) {
            console.error('Error al cargar detalles de la cita:', error);
            alert('Hubo un error al cargar los detalles de la cita.');
          }
        }}
        eventDrop={async (dropInfo: EventDropArg) => {
          const { id, start, end } = dropInfo.event;
          try {
            await axios.put(`/api/appointments/${id}`, {
              start_time: formatISO(start as Date),
              end_time: formatISO(end as Date),
            });
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
          } catch (err) {
            alert('Error al mover cita');
            dropInfo.revert();
          }
        }}
      />
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDateInfo(null);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment || (selectedDateInfo ? mapDateSelectArgToModalData(selectedDateInfo) : null)}
      />
    </>
  );
}
