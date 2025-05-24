"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

type Pregunta = {
  id: number;
  texto: string;
};

type Cuestionario = {
  id: string;
  titulo: string;
  descripcion: string;
  items: Pregunta[];
};

type LinkInfo = {
  pacienteId: string;
  pacienteNombre: string;
  cuestionarioId: string;
  cuestionario: Cuestionario;
  expirado: boolean;
};

export default function CuestionarioPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token;

  // Agregar efecto para sobrescribir el overflow del body
  useEffect(() => {
    // Guardar el overflow original
    const originalOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHeight = document.body.style.height;
    const originalHtmlHeight = document.documentElement.style.height;
    
    // Sobrescribir para permitir scroll
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.height = 'auto';
    
    // Restaurar al desmontar el componente
    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.height = originalHeight;
      document.documentElement.style.height = originalHtmlHeight;
    };
  }, []);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Token no proporcionado</p>
      </div>
    );
  }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [completado, setCompletado] = useState(false);

  // Labels para el slider de respuestas (0-5)
  const scaleLabels = [
    "En ningún momento",
    "Menos de la mitad del tiempo",
    "Más de la mitad del tiempo",
    "La mayor parte del tiempo",
    "Casi todo el tiempo",
    "Todo el tiempo",
  ];

  // Estado para feedback visual
  // Verifica si todas las preguntas fueron respondidas (no null ni undefined)
  const allAnswered = linkInfo && Object.values(respuestas).every((v) => v !== undefined && v !== null);

  // Cargar información del cuestionario
  useEffect(() => {
    if (!token) return;

    async function cargarCuestionario() {
      try {
        const res = await fetch(`/api/cuestionarios/verificar/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Error al cargar el cuestionario");
          return;
        }

        setLinkInfo(data);
        
        // Debug: verificar qué datos llegaron
        console.log('Datos del cuestionario recibidos:', data);
        console.log('Items del cuestionario:', data.cuestionario.items);
        console.log('Cantidad de items:', data.cuestionario.items?.length);
        
        // Inicializar respuestas
        const respuestasIniciales: Record<number, number> = {};
        data.cuestionario.items.forEach((item: Pregunta) => {
          respuestasIniciales[item.id] = 0; // Valor por defecto
        });
        setRespuestas(respuestasIniciales);
      } catch (err) {
        setError("Error al cargar el cuestionario");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    cargarCuestionario();
  }, [token]);

  // Manejar cambio en respuestas
  const handleRespuestaChange = (preguntaId: number, valor: number) => {
    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: valor,
    }));
  };

  // Enviar respuestas
  const handleSubmit = async () => {
    if (!linkInfo) return;

    setEnviando(true);
    try {
      // Convertir respuestas a formato esperado
      const respuestasArray = Object.entries(respuestas).map(([id, valor]) => ({
        pregunta_id: parseInt(id),
        valor,
      }));

      // Calcular puntuación total (para WHO-5 es la suma * 4)
      const puntuacionTotal = Object.values(respuestas).reduce((sum, val) => sum + val, 0) * 4;

      const res = await fetch(`/api/cuestionarios/responder/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respuestas: respuestasArray,
          puntuacion: puntuacionTotal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al enviar respuestas");
      }

      setCompletado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar respuestas");
    } finally {
      setEnviando(false);
    }
  };

  // Renderizar estados de carga y error
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Cargando cuestionario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (completado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-green-500 text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-4">Gracias por tu tiempo.</h1>
          <p className="mb-6">Tus respuestas fueron registradas correctamente y serán recibidas por tu profesional.</p>
          <button
            onClick={() => window.location.href = "https://centrouno.edu.uy/"}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Volver al sitio de Centro UNO
          </button>
        </div>
      </div>
    );
  }

  if (!linkInfo || linkInfo.expirado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-yellow-500 text-5xl mb-4">⏱️</div>
          <h1 className="text-2xl font-bold mb-4">Enlace expirado o inválido</h1>
          <p className="mb-6">Este enlace ya no es válido o ha expirado.</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold mb-4 tracking-wide uppercase">CUESTIONARIO DE BIENESTAR</h1>
          <p className="font-bold text-lg mb-6">{linkInfo.pacienteNombre}</p>
          <p className="mb-6 text-gray-700 text-lg">
            El cuestionario de bienestar de la OMS (WHO-5), es un instrumento de autoinforme que mide el bienestar mental. 
            Por favor, indique para estas cinco afirmaciones cuál define mejor cómo se ha sentido usted durante las últimas dos semanas. 
            Observe que cifras mayores significan mayor bienestar.
          </p>
        </div>

        {/* Mensaje de debug - temporal */}
        <div className="debug-message mb-6">
          <p>Debug: Mostrando {linkInfo.cuestionario.items?.length || 0} preguntas del cuestionario</p>
        </div>

        <div className="space-y-6">
          {linkInfo.cuestionario.items.map((pregunta, index) => {
            const valor = respuestas[pregunta.id];
            const thumbWidth = 24; // Reducido para mejor apariencia
            const max = 5;
            const fillWidth = valor === 0
              ? '0px'
              : `calc((${valor}/${max}) * 100%)`;
            const sliderColor = [
              '#EF4444', // 0 - rojo
              '#F97316', // 1 - naranja
              '#F59E0B', // 2 - ámbar
              '#84CC16', // 3 - lima
              '#10B981', // 4 - esmeralda
              '#059669', // 5 - verde
            ][valor];

            return (
              <div key={pregunta.id} className="pregunta-card">
                <p className="text-lg font-semibold text-gray-800">
                  {index + 1}. {pregunta.texto}
                </p>
                
                <div className="slider-container">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Nunca</span>
                    <span className="text-sm text-gray-600">Siempre</span>
                  </div>
                  
                  <div className="relative w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
                      style={{
                        width: fillWidth,
                        backgroundColor: sliderColor,
                      }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={valor}
                      onChange={(e) => handleRespuestaChange(pregunta.id, Number(e.target.value))}
                      className="w-full h-2 appearance-none bg-transparent"
                      aria-label={`Respuesta para: ${pregunta.texto}`}
                    />
                  </div>
                  
                  <div className="flex justify-between mt-1">
                    {[0, 1, 2, 3, 4, 5].map((num) => (
                      <span key={num} className="text-xs text-gray-500 w-6 text-center">
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
                
                <p className="mt-3 text-center text-blue-600 font-medium">
                  {scaleLabels[valor]}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col items-center">
            <button
              onClick={handleSubmit}
              disabled={enviando || !allAnswered}
              className="boton-enviar w-full max-w-xs"
            >
              {enviando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Enviando...
                </span>
              ) : (
                "Enviar respuestas"
              )}
            </button>
            
            {!allAnswered && (
              <p className="mt-3 text-sm text-red-500">
                Por favor, responde todas las preguntas para continuar.
              </p>
            )}
            
            <p className="mt-4 text-sm text-gray-500 text-center">
              Tus respuestas son confidenciales y solo serán vistas por tu profesional de salud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
