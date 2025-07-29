import { useState, useCallback, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isFallback?: boolean;
  isStreaming?: boolean;
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

export function useSupervisionChatStreaming({ patientId }: UseSupervisionChatProps): UseSupervisionChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setIsInitialized(false);
    setError(null);
    setIsLoading(false);
    // Cancelar cualquier stream activo
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const initializeChat = useCallback(async () => {
    if (isInitialized) return;

    setIsLoading(true);
    setError(null);

    try {
      // Llamar al endpoint de inicialización para obtener el saludo personalizado
      const response = await fetch(`/api/patients/${patientId}/supervision/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error inicializando chat de supervisión');
      }

      const data = await response.json();
      
      // Crear mensaje inicial con el saludo personalizado del endpoint
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

    // Agregar mensaje del usuario inmediatamente
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Crear mensaje del asistente para streaming
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    // Agregar mensaje vacío del asistente
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Cancelar cualquier stream anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();

      const response = await fetch(`/api/test-supervision-streaming/${patientId}`, {
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
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Error enviando mensaje';
        
        if (errorMessage.includes('cuota') || errorMessage.includes('quota') || response.status === 429) {
          throw new Error('⏳ API temporalmente saturada. La cuota se restablece automáticamente. Intenta nuevamente en unos minutos.');
        }
        
        throw new Error(errorMessage);
      }

      // Verificar que es streaming
      if (!response.body) {
        throw new Error('No se recibió stream de respuesta');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                // Finalizar streaming
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, isStreaming: false }
                    : msg
                ));
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  
                  // Actualizar mensaje con contenido acumulado
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  ));
                }
              } catch (e) {
                // Ignorar líneas que no son JSON válido
                console.warn('Error parsing SSE data:', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Stream abortado por el usuario');
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error sending message:', err);
      
      // Remover mensaje del asistente en caso de error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
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
