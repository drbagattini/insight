'use client';

import { signIn, useSession } from 'next-auth/react';
import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';

interface ConnectCalendarButtonProps {
  onConnection?: () => void;
}

export default function ConnectCalendarButton({ onConnection }: ConnectCalendarButtonProps) {
  const { data: session, update, status } = useSession();
  console.log('[ConnectCalendarButton] Render. Session status:', status, 'Session:', session);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const isConnected = session?.googleCalendarScopeGranted === true;
  console.log('[ConnectCalendarButton] isConnected evaluated to:', isConnected, 'based on session?.googleCalendarScopeGranted:', session?.googleCalendarScopeGranted);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      console.log('[ConnectCalendarButton] handleConnect: Attempting signIn with calendar scope.');
      // Solicitar scope adicional para Google Calendar
      await signIn('google',
        { // Options
          redirect: false,
          callbackUrl: '/dashboard/calendar'
        },
        { // Authorization Params
          prompt: 'consent',
          access_type: 'offline',
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.events'
        }
      );
      console.log('[ConnectCalendarButton] handleConnect: signIn call completed. Attempting session update.');
      await update(); // Force session update
      
      console.log('[ConnectCalendarButton] handleConnect: session update call completed. Current session in this render scope:', session); // Note: this logs session before re-render from update.
      if (onConnection) {
        onConnection();
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsConnecting(true);
      console.log('[ConnectCalendarButton] handleDisconnect: Attempting to disconnect Google Calendar.');
      
      // Llamar al endpoint de desconexión
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al desconectar Google Calendar');
      }

      const result = await response.json();
      console.log('[ConnectCalendarButton] handleDisconnect: Disconnect successful:', result);
      
      // Actualizar la sesión para limpiar los tokens del calendario
      await update({ disconnectGoogleCalendar: true });
      
      console.log('[ConnectCalendarButton] handleDisconnect: Session updated successfully.');
      
      if (onConnection) {
        onConnection();
      }
      
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      alert(`Error al desconectar Google Calendar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <>
      {isConnected ? (
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          disabled={isConnecting}
        >
          <FcGoogle className="w-4 h-4" />
          {isConnecting ? 'Desconectando...' : 'Desvincular'}
        </button>
      ) : (
        <button
          onClick={handleConnect}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          disabled={isConnecting}
        >
          <FcGoogle className="w-4 h-4" />
          {isConnecting ? 'Conectando...' : 'Google Calendar'}
        </button>
      )}
    </>
  );
}