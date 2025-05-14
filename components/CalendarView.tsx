"use client";
import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { formatISO } from 'date-fns';
import AppointmentModal from './AppointmentModal';

interface AppointmentEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

export default function CalendarView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState<DateSelectArg | null>(null);
  const queryClient = useQueryClient();

  const handleSaveAppointment = async (appointmentData: { title: string; start: string; end: string; paciente_id: string; rrule: string | null }) => {
    try {
      await axios.post('/api/appointments', {
        title: appointmentData.title,
        start_time: appointmentData.start, // Asegúrate que el formato es ISOString o el esperado por tu API
        end_time: appointmentData.end,     // Asegúrate que el formato es ISOString o el esperado por tu API
        paciente_id: appointmentData.paciente_id,
        rrule: appointmentData.rrule,
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsModalOpen(false); // Cierra el modal en éxito
    } catch (error) {
      console.error('Error al guardar la cita:', error);
      alert('Hubo un error al guardar la cita. Por favor, inténtalo de nuevo.');
      // Podrías querer mantener el modal abierto o manejar el error de forma más específica
    }
  };

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
        eventClick={(clickInfo: EventClickArg) => {
          // TODO: Open modal to edit/delete
          alert(`Editar cita ${clickInfo.event.id}`);
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
        onClose={() => setIsModalOpen(false)}
        selectedDateInfo={selectedDateInfo}
        onSave={handleSaveAppointment}
      />
    </>
  );
}
