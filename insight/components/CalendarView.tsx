"use client";
import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { formatISO } from 'date-fns';
import { useSession, signIn } from 'next-auth/react';
import { AppointmentModal, ModalAppointmentData } from './appointments/AppointmentModal';
import { useAppointmentMutations } from '@/hooks/useAppointmentMutations';

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

// Estilos personalizados para el calendario
const calendarStyles = `
  /* Nombres de días en las columnas de la vista mensual - SOLO en vista mensual */
  .fc-dayGridMonth-view .fc-col-header-cell.fc-day-mon .fc-col-header-cell-cushion::before { content: 'Lunes'; }
  .fc-dayGridMonth-view .fc-col-header-cell.fc-day-tue .fc-col-header-cell-cushion::before { content: 'Martes'; }
  .fc-dayGridMonth-view .fc-col-header-cell.fc-day-wed .fc-col-header-cell-cushion::before { content: 'Miércoles'; }
  .fc-dayGridMonth-view .fc-col-header-cell.fc-day-thu .fc-col-header-cell-cushion::before { content: 'Jueves'; }
  .fc-dayGridMonth-view .fc-col-header-cell.fc-day-fri .fc-col-header-cell-cushion::before { content: 'Viernes'; }
  .fc-dayGridMonth-view .fc-col-header-cell.fc-day-sat .fc-col-header-cell-cushion::before { content: 'Sábado'; }
  .fc-dayGridMonth-view .fc-col-header-cell.fc-day-sun .fc-col-header-cell-cushion::before { content: 'Domingo'; }
  
  /* Ocultar texto original SOLO en la vista mensual */
  .fc-dayGridMonth-view .fc-col-header-cell-cushion {
    font-size: 0;
    padding: 8px 4px;
    width: 100%;
    text-align: center;
    display: block;
  }
  
  /* Mostrar los nombres personalizados SOLO en la vista mensual */
  .fc-dayGridMonth-view .fc-col-header-cell-cushion::before {
    font-size: 0.95rem;
    color: #374151;
    font-weight: 600;
    display: inline-block;
  }
  
  /* Estilos para los encabezados de día en la vista de mes */
  .fc-dayGridMonth-view .fc-col-header-cell {
    padding: 8px 0;
    background-color: #f5f7f9;
    border-bottom: 1px solid #e1e7eb;
  }
  
  /* Estilo para los días de la semana */
  .fc-weekday-only {
    display: block;
    text-align: center;
    width: 100%;
    padding: 0 2px;
  }
  
  /* Eliminar el borde gris en las celdas vacías */
  .fc-dayGridMonth-view .fc-day-other {
    background-color: #f9fafc;
  }
  
  /* Estilos para los botones de Google Calendar */
  .fc .fc-button-primary.fc-googleCalendar-button,
  .fc .fc-button-primary.fc-googleCalendarDisconnect-button {
    /* Estilos comunes */
    background-color: #ffffff;
    border-color: #dadce0;
    color: #3c4043; /* Color por defecto */
    font-family: 'Google Sans', Roboto, Arial, sans-serif;
    box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3);
    height: 36px;
    width: auto;
    min-width: 150px; /* Ancho mínimo para garantizar espacio suficiente */
    padding: 0 16px 0 14px;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.25px;
    position: relative;
    
    /* Configuración para garantizar el centrado del texto */
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    flex-direction: row;
    white-space: nowrap;
  }
  
  /* Estilos específicos para el botón de desvinculación */
  .fc .fc-button-primary.fc-googleCalendarDisconnect-button {
    background-color: #fce8e8;
    border-color: #fadede;
    color: #d93025;
    box-shadow: 0 1px 2px rgba(60, 64, 67, 0.1);
  }
  
  /* El icono de Google Calendar en el botón debe estar posicionado al inicio */
  .fc .fc-button-primary.fc-googleCalendar-button::before {
    content: '';
    flex-shrink: 0; /* Evitar que el icono se encoja */
    width: 18px;
    height: 18px;
    margin-right: 8px; /* Espacio entre el icono y el texto */
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M20.0001 6V16C20.0001 17.1 19.1001 18 18.0001 18H6.00006C4.90006 18 4.00006 17.1 4.00006 16V6C4.00006 4.9 4.90006 4 6.00006 4H18.0001C19.1001 4 20.0001 4.9 20.0001 6ZM18.0001 6H6.00006V16H18.0001V6ZM8.00006 10C8.00006 8.9 8.90006 8 10.0001 8C11.1001 8 12.0001 8.9 12.0001 10C12.0001 11.1 11.1001 12 10.0001 12C8.90006 12 8.00006 11.1 8.00006 10ZM10.0001 14C8.00006 14 6.00006 15 6.00006 17H14.0001C14.0001 15 12.0001 14 10.0001 14ZM16.0001 10H18.0001V12H16.0001V10ZM16.0001 14H18.0001V16H16.0001V14Z" fill="currentColor"/></svg>');
    background-repeat: no-repeat;
    background-position: center;
  }
  
  /* Ajuste específico para el botón de desvinculación para centrar texto */
  .fc .fc-button-primary.fc-googleCalendarDisconnect-button::before {
    display: none; /* Eliminar el icono heredado */
  }

  /* Agregar un espacio después del texto para balancear visualmente con el icono */
  .fc .fc-button-primary.fc-googleCalendar-button::after {
    content: '';
    width: 18px; /* Mismo ancho que el icono para mantener balance */
    display: inline-block;
    margin-left: 0; /* Sin margen para compensar por el padding del botón */
    opacity: 0; /* Invisible, solo para balance visual */
  }
  
  .fc .fc-button-primary.fc-googleCalendar-button:hover {
    background-color: #f6f6f6;
    border-color: #dadce0;
    color: #202124;
    box-shadow: 0 1px 3px rgba(60, 64, 67, 0.4);
  }

  .fc .fc-button-primary.fc-googleCalendarDisconnect-button:hover {
    background-color: #fad9d9;
    color: #d93025;
  }
  
  /* Ocultar el número del día en la vista de mes */
  .fc-dayGridMonth-view .fc-col-header-cell-cushion {
    display: inline-block;
  }
  
  .fc-dayGridMonth-view .fc-col-header-cell-cushion::after {
    content: attr(data-short-weekday);
  }
  
  .fc-dayGridMonth-view .fc-col-header-cell-cushion span {
    display: none;
  }
  
  .fc .fc-button-primary.fc-googleCalendar-button {
    background-color: #ffffff;
    border-color: #dadce0;
    color: #3c4043;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
  }
  
  .fc .fc-button-primary.fc-googleCalendar-button:hover {
    background-color: #f6fafe;
    border-color: #d2e3fc;
    color: #174ea6;
  }
  
  .fc .fc-button-primary.fc-googleCalendar-button::before {
    content: '';
    display: inline-block;
    width: 18px;
    height: 18px;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18px" height="18px"><path fill="none" d="M0 0h24v24H0z"/><path fill="#4285F4" d="M21.56 10.44l-.72.72-6.22 6.22-2.67 1.33c-.5.25-1.11.13-1.44-.33L8.6 16.5a.99.99 0 01.21-1.4l3.7-2.8c.2-.16.38-.28.54-.38l3.14-2.21c.38-.27.63-.83.58-1.25-.06-.42-.1-.77-.64-1.03-.56-.28-1.08-.23-1.62.2l-3.92 2.9c-.21.17-.32.27-.72.27L7.5 10.9c-.39 0-.61-.26-.72-.46-.17-.33-.11-.76.18-1.02l1.7-1.46a5.75 5.75 0 018.65.31c1.03 1.2 1.5 2.75 1.29 4.33-.07.51-.23.97-.48 1.37m-12.95.7l1.98 1.98C10 13.73 9.4 14 9 14l-5.79.95a.59.59 0 01-.23.02c-.12-.01-.45-.09-.64-.33-.15-.2-.21-.45-.17-.7l.78-4.04c.05-.25.23-.46.47-.56A9.21 9.21 0 017.3 8c.77 0 1.55.12 2.31.38.13.05 0 .38-.68 1.04-.82.8-1.12 1.1-1.22 1.22-.1.12-.12.32-.1.5z"/></svg>');
    background-repeat: no-repeat;
    background-position: center;
  }
  
  .fc .fc-button-primary.fc-googleCalendarDisconnect-button {
    background-color: #ffffff;
    border-color: #dadce0;
    color: #666;
    font-size: 0.8em;
  }
  
  .fc .fc-button-primary.fc-googleCalendarDisconnect-button:hover {
    background-color: #f8f9fa;
    border-color: #d2d5d9;
    color: #ea4335;
  }
  
  /* Ajustar el ancho del botón de desvinculación */
  .fc-googleCalendarDisconnect-button {
    max-width: fit-content;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  /* Ajustes para la vista de mes */
  .fc-daygrid-day-frame {
    min-height: 80px !important;
    max-height: 120px !important;
    overflow: hidden;
  }
  
  .fc-daygrid-day-events {
    margin: 0;
    max-height: 90px;
    overflow: hidden;
  }
  
  .fc-daygrid-day-top {
    padding: 2px 4px;
    position: relative;
  }
  
  .fc-daygrid-day-number {
    font-size: 0.85em;
    padding: 2px;
  }
  
  .fc-daygrid-event {
    margin: 1px 1px;
    padding: 0 2px;
    font-size: 0.75em;
    line-height: 1.2;
  }
  
  .fc .fc-daygrid-day.fc-day-today {
    background-color: #f0f7ff;
  }
  
  .fc-daygrid-more-link {
    font-size: 0.75em;
    padding: 1px 3px;
    margin-left: 2px;
  }
  
  .fc-daygrid-event-harness {
    max-height: 20px;
    overflow: hidden;
  }
`;

export default function CalendarView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState<DateSelectArg | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<ModalAppointmentData | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const queryClient = useQueryClient();
  const { updateAppointment } = useAppointmentMutations();
  const { data: session } = useSession();
  
  // Aplicar estilos personalizados para el calendario y botones
  useEffect(() => {
    // Aplicar estilos personalizados para el calendario y botones
    const styleElement = document.createElement('style');
    styleElement.innerHTML = calendarStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Estados para la integración con Google Calendar
  const [isSynced, setIsSynced] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  // Verificar si está sincronizado con Google Calendar al cargar
  useEffect(() => {
    if (session?.user) {
      checkSyncStatus();
    }
  }, [session]);
  
  // Función para verificar el estado de sincronización
  const checkSyncStatus = async () => {
    try {
      const response = await fetch('/api/sync/google-calendar/status');
      const data = await response.json();
      
      if (response.ok) {
        setIsSynced(data.status === 'connected');
      } else {
        console.error('Error al verificar estado de sincronización:', data.error);
        setIsSynced(false);
      }
    } catch (error) {
      console.error('Error al verificar estado de sincronización:', error);
      setIsSynced(false);
    }
  };
  
  // Función para conectar con Google Calendar
  const handleConnectGoogleCalendar = async () => {
    if (!session?.user) {
      alert('Debe iniciar sesión para sincronizar con Google Calendar');
      return;
    }
    
    try {
      setIsConnecting(true);
      
      // Iniciar flujo OAuth para conectar
      const result = await signIn('google', { 
        redirect: true, // Cambiado a true para redireccionar a Google y completar la autenticación
        callbackUrl: window.location.href 
      });
      
      // No hacemos nada más aquí porque el usuario será redirigido a Google
      // La verificación del estado se hará cuando regrese después de la autenticación
    } catch (error: any) {
      console.error('Error durante la conexión con Google Calendar:', error);
      setIsConnecting(false); // Solo desactivamos si hay un error
    }
  };
  
  // Función para desvincular Google Calendar
  const handleDisconnectGoogleCalendar = async () => {
    if (!session?.user) return;
    
    try {
      setIsDisconnecting(true);
      
      const response = await fetch('/api/sync/google-calendar/desync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al desvincular Google Calendar');
      }
      
      setIsSynced(false);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    } catch (error: any) {
      console.error('Error durante la desvinculación:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

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
          left: 'dayGridMonth,timeGridWeek,timeGridDay today prev,next',
          center: 'title',
          right: isSynced ? 'googleCalendarDisconnect' : 'googleCalendar'
        }}
        titleFormat={{ year: 'numeric', month: 'short', day: 'numeric' }}
        // Formato para la cabecera de días
        // Personalizar el contenido de las cabeceras de día según la vista
        dayHeaderContent={(args) => {
          // Asegurarse de tener un objeto date válido para trabajar
          if (!args.date) return null;
          
          // Para la vista de mes, mostrar el nombre completo del día (lunes, martes, etc.)
          if (args.view.type === 'dayGridMonth') {
            // Obtener el nombre del día en español (lunes, martes, etc.)
            const días = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const nombreDía = días[args.date.getDay()];
            return <span className="fc-weekday-only">{nombreDía}</span>;
          }
          
          // Para las vistas de semana y día, mostrar el nombre corto y el número
          const nombreCorto = new Date(args.date).toLocaleDateString('es-ES', {weekday: 'short'});
          return (
            <>
              {nombreCorto} {args.date.getDate()}
            </>
          );
        }}
        // Se elimina dayHeaderFormat para evitar conflicto con dayHeaderContent
        dayMaxEvents={3}
        dayMaxEventRows={3}
        views={{
          dayGrid: {
            dayMaxEventRows: 3,
            dayMaxEvents: 3,
          },
          timeGrid: {
            dayMaxEventRows: 6
          }
        }}
        customButtons={{
          googleCalendar: {
            text: 'Google Calendar', // Quitamos el emoji ya que usamos CSS para el icono
            click: function() {
              if (!isConnecting) {
                handleConnectGoogleCalendar();
              }
            }
          },
          googleCalendarDisconnect: {
            text: 'Desvincular Google',
            click: function() {
              if (!isDisconnecting) {
                handleDisconnectGoogleCalendar();
              }
            }
          }
        }}
        dayHeaderClassNames={'bg-gray-50 text-gray-700 font-semibold py-2'}
        locale={esLocale}
        firstDay={1} // 1 = Lunes como primer día de la semana
        // El formato de cabecera de día ya está definido arriba
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
