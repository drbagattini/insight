'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestWhatsAppSendPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [testLink, setTestLink] = useState('test-123-abc');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSend = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-whatsapp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, testLink }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error',
        message: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Test de Envío de WhatsApp</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Número de Teléfono (con código país, sin +)
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="5459899628774"
                className="w-full px-4 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ejemplo: 5459899628774 (sin espacios, sin +, sin guiones)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Test Link Suffix (opcional)
              </label>
              <input
                type="text"
                value={testLink}
                onChange={(e) => setTestLink(e.target.value)}
                placeholder="test-123-abc"
                className="w-full px-4 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Esto se usa como parámetro del botón de URL dinámica
              </p>
            </div>

            <Button 
              onClick={handleSend}
              disabled={loading || !phoneNumber}
              className="w-full"
            >
              {loading ? '⏳ Enviando...' : '📤 Enviar WhatsApp de Prueba'}
            </Button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {result.success ? '✅ Resultado' : '❌ Error'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Estado:</h3>
                <div className={`p-3 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                  {result.success ? 'Mensaje enviado exitosamente' : 'Error al enviar mensaje'}
                </div>
              </div>

              {result.details && (
                <div>
                  <h3 className="font-semibold mb-2">Detalles del Error:</h3>
                  <div className="bg-red-50 p-3 rounded">
                    <p><strong>Mensaje:</strong> {result.details.errorMessage}</p>
                    <p><strong>Código:</strong> {result.details.errorCode}</p>
                    <p><strong>Tipo:</strong> {result.details.errorType}</p>
                    <p><strong>Trace ID:</strong> {result.details.errorFbtraceId}</p>
                  </div>
                </div>
              )}

              {result.whatsappResponse && (
                <div>
                  <h3 className="font-semibold mb-2">Respuesta de WhatsApp:</h3>
                  <pre className="bg-green-50 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(result.whatsappResponse, null, 2)}
                  </pre>
                </div>
              )}

              {result.apiError && (
                <div>
                  <h3 className="font-semibold mb-2">Error de la API:</h3>
                  <pre className="bg-red-50 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(result.apiError, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Request Enviado:</h3>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(result.requestSent, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
