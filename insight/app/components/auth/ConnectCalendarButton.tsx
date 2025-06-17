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
    // Esta funcionalidad tendría que ser implementada en el backend
    // Por ahora solo mostramos un botón que indica que está conectado
    console.log('Disconnect not implemented yet');
    alert('La funcionalidad para desconectar Google Calendar aún no está implementada.');
  };

  return (
    <>
      {isConnected ? (
        <button
          onClick={handleDisconnect}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-colors"
          disabled={isConnecting}
        >
          <FcGoogle className="w-5 h-5" />
          Desvincular Google
        </button>
      ) : (
        <button
          onClick={handleConnect}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-colors"
          disabled={isConnecting}
        >
          <FcGoogle className="w-5 h-5" />
          {isConnecting ? 'Conectando...' : 'Google Calendar'}
        </button>
      )}
    </>
  );
}