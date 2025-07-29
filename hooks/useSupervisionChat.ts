import { useState, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isFallback?: boolean;
}

interface UseSupervisionChatProps {
  patientId: string;
}

interface UseSupervisionChatReturn {
  messages: Message[];
  isLoading: boolean;
  isSynthesizing: boolean;
  error: string | null;
  isInitialized: boolean;
  initializeChat: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  generateSynthesis: () => Promise<void>;
  clearError: () => void;
  resetChat: () => void;
}

export function useSupervisionChat({ patientId }: UseSupervisionChatProps): UseSupervisionChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setIsInitialized(false);
    setError(null);
    setIsLoading(false);
  }, []);

  const initializeChat = useCallback(async () => {
    if (isInitialized) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patientId}/supervision/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error inicializando la supervisión');
      }

      const data = await response.json();
      
      const initialMessage: Message = {
        id: `init-${Date.now()}`,
        role: 'assistant',
        content: data.initialMessage,
        timestamp: new Date()
      };

      setMessages([initialMessage]);
      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error initializing supervision chat:', err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, isInitialized]);

  const sendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent.trim(),
      timestamp: new Date()
    };

    // NO agregar el mensaje del usuario inmediatamente
    // Solo mostrar el estado de loading
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patientId}/supervision/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Error enviando mensaje';
        
        // Manejo específico para errores de cuota de API
        if (errorMessage.includes('cuota') || errorMessage.includes('quota') || response.status === 429) {
          throw new Error('⏳ API temporalmente saturada. La cuota se restablece automáticamente. Intenta nuevamente en unos minutos.');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      // Agregar AMBOS mensajes juntos cuando la respuesta es exitosa
      setMessages(prev => [...prev, userMessage, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, messages, isLoading]);

  const generateSynthesis = useCallback(async () => {
    if (messages.length < 2) {
      setError('Se necesita al menos una conversación para generar síntesis');
      return;
    }

    setIsSynthesizing(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patientId}/supervision/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error generando síntesis');
      }

      const data = await response.json();
      
      const synthesisMessage: Message = {
        id: `synthesis-${Date.now()}`,
        role: 'assistant',
        content: `✅ **Síntesis de Supervisión Generada**\n\nHe guardado un resumen de nuestra conversación en el historial de evolución clínica del paciente. La entrada ha sido etiquetada como "Supervisión IA" y contiene los insights principales que discutimos.\n\n*La síntesis se encuentra disponible en la pestaña "Evolución Clínica".*`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, synthesisMessage]);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error generating synthesis:', err);
      throw err;
    } finally {
      setIsSynthesizing(false);
    }
  }, [patientId, messages]);

  return {
    messages,
    isLoading,
    isSynthesizing,
    error,
    isInitialized,
    initializeChat,
    sendMessage,
    generateSynthesis,
    clearError,
    resetChat
  };
}
