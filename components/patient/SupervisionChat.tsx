"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, 
  X, 
  Minimize2, 
  Maximize2, 
  Send, 
  Bot, 
  User, 
  Loader2,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupervisionChat } from '@/hooks/useSupervisionChat';

interface SupervisionChatProps {
  patientId: string;
  patientName: string;
  isVisible: boolean;
  onToggle: () => void;
}

export function SupervisionChat({ 
  patientId, 
  patientName, 
  isVisible, 
  onToggle 
}: SupervisionChatProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Cuando se abre desde el botón flotante, siempre abrir completo
  const handleOpenFromFloating = () => {
    setIsMinimized(false); // Asegurar que se abra completo
    onToggle(); // Cambiar isVisible a true
  };
  
  // Cuando se cierra, resetear el estado minimizado para la próxima apertura
  const handleClose = () => {
    setIsMinimized(false); // Resetear para que la próxima apertura sea completa
    onToggle(); // Cambiar isVisible a false
  };
  const [inputMessage, setInputMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hook personalizado para manejar el chat de supervisión
  const {
    messages,
    isLoading,
    isSynthesizing,
    error,
    isInitialized,
    initializeChat,
    sendMessage,
    generateSynthesis,
    clearError
  } = useSupervisionChat({ patientId });

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Inicializar conversación cuando se abre el chat
  useEffect(() => {
    if (isVisible && !isInitialized) {
      initializeChat();
    }
  }, [isVisible, isInitialized, initializeChat]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    await sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleGenerateSynthesis = async () => {
    try {
      await generateSynthesis();
      // Opcional: cerrar el chat después de unos segundos
      setTimeout(() => {
        onToggle();
      }, 3000);
    } catch (error) {
      // El error ya se maneja en el hook
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={handleOpenFromFloating}
        className="fixed bottom-6 right-6 bg-white hover:bg-gray-50 border border-gray-200 shadow-lg z-50 rounded-lg px-4 py-3 h-auto w-auto min-w-[280px]"
        size="sm"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">i</span>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">Supervisión Clínica</div>
              <div className="text-xs text-gray-500 truncate">{patientName}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-3">
            <Maximize2 className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </Button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-6 right-6 bg-white border border-gray-200 rounded-lg shadow-xl z-50 transition-all duration-300",
      isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">i</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Supervisión Clínica</h3>
            <p className="text-xs text-gray-500">{patientName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0"
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col h-[536px]">
          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-purple-600" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[280px] p-3 rounded-lg text-sm",
                    message.role === 'user'
                      ? "bg-blue-600 text-white"
                      : message.isFallback
                        ? "bg-orange-50 text-orange-900 border border-orange-200"
                        : "bg-gray-100 text-gray-900"
                  )}
                >
                  {message.isFallback && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-orange-600">
                      <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                      Modo simplificado (API saturada)
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={cn(
                    "text-xs mt-1 opacity-70",
                    message.role === 'user' ? "text-blue-100" : "text-gray-500"
                  )}>
                    {message.timestamp.toLocaleTimeString('es-AR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-purple-600" />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">Pensando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-gray-50">
            {/* Message Input */}
            <div className="p-4">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu reflexión o pregunta..."
                  className="flex-1 min-h-[40px] max-h-24 resize-none text-sm bg-white"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="sm"
                  className="h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Footer with Synthesis Button */}
            <div className="px-4 pb-4">
              {messages.length > 2 && (
                <Button
                  onClick={handleGenerateSynthesis}
                  disabled={isSynthesizing || isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm disabled:opacity-50"
                  size="sm"
                >
                  {isSynthesizing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando Síntesis...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generar Síntesis de Supervisión
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
