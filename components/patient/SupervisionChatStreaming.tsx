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
import { useSupervisionChatStreaming } from '@/hooks/useSupervisionChatStreaming';

interface SupervisionChatStreamingProps {
  patientId: string;
  patientName: string;
  isVisible: boolean;
  onToggle: () => void;
}

export function SupervisionChatStreaming({ 
  patientId, 
  patientName, 
  isVisible, 
  onToggle 
}: SupervisionChatStreamingProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hook personalizado para manejar el chat de supervisión con streaming
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
  } = useSupervisionChatStreaming({ patientId });

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

  // Enfocar el textarea cuando se abre el chat
  useEffect(() => {
    if (isVisible && !isMinimized && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isVisible, isMinimized]);

  const handleOpenFromFloating = () => {
    setIsMinimized(false);
    onToggle();
  };
  
  const handleClose = () => {
    setIsMinimized(false);
    onToggle();
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const messageToSend = inputMessage;
    setInputMessage(''); // Limpiar inmediatamente para mejor UX
    
    await sendMessage(messageToSend);
  };

  const handleGenerateSynthesis = async () => {
    try {
      await generateSynthesis();
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
              <div className="text-sm font-medium text-gray-900">
                Supervisión Clínica
              </div>
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
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">i</span>
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm">
              Supervisión Clínica
            </div>
            <div className="text-xs text-gray-500 truncate">{patientName}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={() => setIsMinimized(!isMinimized)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-white/50"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-white/50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col h-[calc(100%-65px)]">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border-b border-red-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-600">{error}</p>
                <Button
                  onClick={clearError}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-purple-600" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[80%] p-3 rounded-lg text-sm",
                    message.role === 'user'
                      ? "bg-blue-600 text-white"
                      : message.isFallback
                        ? "bg-orange-50 text-orange-900 border border-orange-200"
                        : "bg-white text-gray-900 border border-gray-200 shadow-sm"
                  )}
                >
                  {message.isFallback && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-orange-600">
                      <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                      Modo simplificado (API saturada)
                    </div>
                  )}
                  
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Indicador de streaming */}
                  {message.isStreaming && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Escribiendo...</span>
                    </div>
                  )}
                  
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

            {isLoading && messages.length === 0 && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-purple-600" />
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">Inicializando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white">
            {/* Message Input */}
            <div className="p-4">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu reflexión o pregunta..."
                  className="flex-1 min-h-[40px] max-h-24 resize-none text-sm bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="sm"
                  className="h-10 w-10 p-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
