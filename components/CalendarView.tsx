"use client";
import React, { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
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
  paciente_id?: string;
  paciente_nombre?: string;
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
    <div className="w-full h-full flex flex-col bg-gray-50">
      <div className="w-full h-full bg-white overflow-hidden flex flex-col">
        <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        customButtons={{}}
        dayHeaderClassNames={'bg-gray-50 text-gray-700 font-semibold py-2'}
        locale={esLocale}
        dayHeaderFormat={{
          weekday: 'short'
        }}
        buttonIcons={{
          prev: 'chevron-left',
          next: 'chevron-right',
        }}
        dayCellClassNames={'hover:bg-blue-50 transition-colors'}
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
        allDaySlot={false}
        contentHeight={700}
        stickyHeaderDates={true}
        scrollTime="07:00:00"
        slotMinTime="07:00:00"
        slotMaxTime="24:00:00"
        nowIndicator={true}
        editable
        selectable
        eventContent={(eventInfo) => {
          // Extraer nombre del paciente y título de los props extendidos
          const pacienteNombre = eventInfo.event.extendedProps.pacienteNombre || '';
          const title = eventInfo.event.title || '';
          const isRecurring = eventInfo.event.id.includes('_'); // Si el ID contiene '_' es una instancia recurrente
          
          // Obtener horas de inicio y fin del evento
          const startTime = eventInfo.event.start ? eventInfo.event.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
          const endTime = eventInfo.event.end ? eventInfo.event.end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
          const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : '';
          
          // Crear elementos para la visualización personalizada
          const content = document.createElement('div');
          content.style.width = '100%';
          content.style.overflow = 'hidden';
          content.style.padding = '2px';  // Reducir padding general
          
          // ORDEN OPTIMIZADO CON TAMAÑOS REDUCIDOS:
          
          // 1. Mostrar hora de inicio y fin en la parte superior
          if (timeRange) {
            const timeElement = document.createElement('div');
            timeElement.textContent = timeRange;
            timeElement.style.fontSize = '0.68rem';  // Aún más reducido
            timeElement.style.fontWeight = '400';  // Un poco menos de peso
            timeElement.style.color = '#FFFFFF';
            timeElement.style.lineHeight = '1.1';
            timeElement.style.marginBottom = '1px'
            content.appendChild(timeElement);
          }
          
          // 2. El nombre del paciente en negrita
          if (pacienteNombre) {
            const nombreElement = document.createElement('div');
            nombreElement.innerHTML = `<strong>${pacienteNombre}</strong>`;
            nombreElement.style.fontSize = '0.82rem';  // Más grande para destacar
            nombreElement.style.lineHeight = '1.15';  // Un poco más espaciado
            nombreElement.style.whiteSpace = 'nowrap';
            nombreElement.style.overflow = 'hidden';
            nombreElement.style.textOverflow = 'ellipsis';
            nombreElement.style.color = '#FFFFFF';
            nombreElement.style.marginBottom = '1px';  // Reducir margen
            content.appendChild(nombreElement);
          }
          
          // 3. El título opcional debajo (sin negrita)
          if (title && title !== pacienteNombre) {
            const titleElement = document.createElement('div');
            titleElement.textContent = title;
            titleElement.style.fontSize = '0.75rem';  // Ligeramente más grande
            titleElement.style.color = '#E6EFFF';
            titleElement.style.lineHeight = '1.1';
            titleElement.style.whiteSpace = 'nowrap';
            titleElement.style.overflow = 'hidden';
            titleElement.style.textOverflow = 'ellipsis';
            titleElement.style.marginBottom = '1px';  // Reducir margen
            content.appendChild(titleElement);
          }
          
          // 4. Indicador de cita única o recurrente AL FINAL (más pequeño)
          const tipoElement = document.createElement('div');
          tipoElement.textContent = isRecurring ? 'Recurrente' : 'Cita única';
          tipoElement.style.fontSize = '0.65rem';
          tipoElement.style.fontStyle = 'italic';
          tipoElement.style.fontWeight = '700';  // Negrita (bold)
          
          // Usar tonos de blanco para mejor contraste sobre fondo azul con tamaños reducidos
          if (isRecurring) {
            // Para citas recurrentes
            tipoElement.style.color = '#FFFFFF';
            tipoElement.style.backgroundColor = 'rgba(255,255,255,0.2)';
            tipoElement.style.padding = '0px 3px';  // Reducir padding
            tipoElement.style.borderRadius = '3px';  // Reducir borde
            tipoElement.style.display = 'inline-block';
          } else {
            // Para citas únicas
            tipoElement.style.color = '#F0F9FF';
            tipoElement.style.backgroundColor = 'rgba(255,255,255,0.15)';
            tipoElement.style.padding = '0px 3px';  // Reducir padding
            tipoElement.style.borderRadius = '3px';  // Reducir borde
            tipoElement.style.display = 'inline-block';
          }
          
          content.appendChild(tipoElement);
          
          // Si no hay nombre ni título, mostrar un texto por defecto
          if (!pacienteNombre && !title) {
            const defaultText = document.createElement('div');
            defaultText.textContent = 'Sin asignar';
            defaultText.style.fontStyle = 'italic';
            defaultText.style.color = '#FFFFFF';  // Blanco para contraste sobre azul
            defaultText.style.marginTop = '2px';
            content.appendChild(defaultText);
          }
          
          // Devolver el contenido personalizado
          return { domNodes: [content] };
        }}
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
              extendedProps: {
                pacienteId: ev.paciente_id,
                pacienteNombre: ev.paciente_nombre,
              }
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
    </div>
  </div>
  );
}
