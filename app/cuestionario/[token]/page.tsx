"use client";

import { useState, useEffect } from "react";
import { Pagination } from '@/components/ui/pagination';
import { scores } from "@/src/scoring";
import { useRouter, useParams } from "next/navigation";

type Pregunta = {
  id: number;
  texto: string;
  orden?: number; // Para OPD-CA2-SQ que usa orden en lugar de id
  opciones_respuesta?: any[]; // Para las opciones de respuesta
};

type Cuestionario = {
  id: string;
  codigo?: string;
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

const getColorForValue = (value: number, codigo: string, maxValue: number) => {
  // Para cuestionarios clínicos (PHQ-9, GAD-7): mayor valor = mayor severidad = más rojo
  const isClinicalScale = ['PHQ-9', 'GAD-7'].includes(codigo);
  
  if (isClinicalScale) {
    // Escala invertida para cuestionarios clínicos
    const colors = [
      '#22c55e', // 0 - green-500 (sin síntomas)
      '#84cc16', // 1 - lime-500 (leve)
      '#eab308', // 2 - yellow-500 (moderado)
      '#f97316', // 3 - orange-500 (severo)
    ];
    return colors[value] || '#ef4444'; // rojo para valores altos
  } else {
    // Escala normal para cuestionarios de bienestar (WHO-5, BR-WAI, etc.)
    const colors = [
      '#ef4444', // 0 - red-500 (muy bajo bienestar)
      '#ef4444', // 1 - red-500 (bajo bienestar) 
      '#f97316', // 2 - orange-500 (en desacuerdo)
      '#fde047', // 3 - yellow-300 (neutral - amarillo puro)
      '#84cc16', // 4 - lime-500 (de acuerdo)
      '#22c55e', // 5 - green-500 (totalmente de acuerdo)
    ];
    return colors[value] || '#22c55e';
  }
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
  const [respuestas, setRespuestas] = useState<{ [key: string | number]: number }>({});
  
  // Función para verificar si el cuestionario está completo
  const isQuestionnaireComplete = () => {
    if (!linkInfo) return false;
    const totalQuestions = linkInfo.cuestionario.items.length;
    const answeredQuestions = Object.keys(respuestas).length;
    return answeredQuestions === totalQuestions;
  };
  
  // Función para obtener el progreso
  const getProgress = () => {
    if (!linkInfo) return { answered: 0, total: 0, percentage: 0 };
    const total = linkInfo.cuestionario.items.length;
    const answered = Object.keys(respuestas).length;
    const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;
    return { answered, total, percentage };
  };
  
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const handleRespuesta = (preguntaId: string, valor: number) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: valor
    }));
  }; // 8 preguntas por página para tener aproximadamente 10 páginas
  const [enviando, setEnviando] = useState(false);
  const [completado, setCompletado] = useState(false);

  // Labels dinámicos basados en el tipo de cuestionario
  const getScaleLabels = (codigo: string) => {
    if (codigo === 'WHO-5') {
      return [
        "En ningún momento",
        "Menos de la mitad del tiempo",
        "Más de la mitad del tiempo",
        "La mayor parte del tiempo",
        "Casi todo el tiempo",
        "Todo el tiempo",
      ];
    } else if (codigo === 'OPD-CA2-SQ') {
      return [
        "No se aplica",
        "Raramente cierto",
        "A veces cierto",
        "A menudo cierto",
        "Exactamente cierto"
      ];
    } else if (codigo === 'BR-WAI') {
      return [
        "Totalmente en desacuerdo",
        "En desacuerdo",
        "Ni de acuerdo ni en desacuerdo",
        "De acuerdo",
        "Totalmente de acuerdo"
      ];
    } else if (codigo === 'PHQ-9') {
      return [
        "Nunca",
        "Varios días",
        "Más de la mitad de los días",
        "Casi todos los días"
      ];
    } else if (codigo === 'GAD-7') {
      return [
        "Nunca",
        "Varios días",
        "Más de la mitad de los días",
        "Casi todos los días"
      ];
    }
    return [];
  };
  
  const getMaxScale = (codigo: string) => {
    if (codigo === 'WHO-5') return 5;
    if (codigo === 'BR-WAI') return 5;
    if (codigo === 'PHQ-9') return 3;
    if (codigo === 'GAD-7') return 3;
    return 4; // OPD-CA2-SQ y otros
  };
  
  const getScaleEndLabels = (codigo: string) => {
    if (codigo === 'WHO-5') {
      return { min: 'Nunca', max: 'Siempre' };
    } else if (codigo === 'OPD-CA2-SQ') {
      return { min: 'No se aplica', max: 'Exactamente cierto' };
    } else if (codigo === 'BR-WAI') {
      return { min: 'Totalmente en desacuerdo', max: 'Totalmente de acuerdo' };
    } else if (codigo === 'PHQ-9') {
      return { min: 'Nunca', max: 'Casi todos los días' };
    } else if (codigo === 'GAD-7') {
      return { min: 'Nunca', max: 'Casi todos los días' };
    }
    return { min: '', max: '' };
  };
  
  const scaleLabels = linkInfo ? getScaleLabels(linkInfo.cuestionario.id) : [];
  const maxScale = linkInfo ? getMaxScale(linkInfo.cuestionario.id) : 5;
  const scaleEndLabels = linkInfo ? getScaleEndLabels(linkInfo.cuestionario.id) : { min: '', max: '' };

  // Estado para feedback visual
  // Verifica si todas las preguntas fueron respondidas (no null ni undefined)
  const allAnswered = linkInfo && linkInfo.cuestionario.items.every(item => 
    respuestas[item.id] !== undefined && respuestas[item.id] !== null
  );

  // Cargar información del cuestionario
  useEffect(() => {
    if (!token) return;

    async function cargarCuestionario() {
      try {
        const res = await fetch(`/api/cuestionarios/verificar/${token}`, { cache: 'no-store' });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Error al cargar el cuestionario");
          return;
        }

        // Debug: verificar qué datos llegaron
        console.log('Datos del cuestionario recibidos:', data);
        console.log('Items del cuestionario:', data.cuestionario.items);
        console.log('Tipo de items:', typeof data.cuestionario.items);
        
        // Parsear items si vienen como string JSON
        let items = data.cuestionario.items;
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch (parseError) {
            console.error('Error al parsear items:', parseError);
            setError('Error al cargar las preguntas del cuestionario');
            return;
          }
        }
        
        // Manejar diferentes estructuras de items
        if (items && typeof items === 'object' && !Array.isArray(items)) {
          // Si items es un objeto con propiedad 'items' (como OPD-CA2-SQ)
          if (items.items && Array.isArray(items.items)) {
            items = items.items;
          } else {
            console.error('Items no es un array ni tiene propiedad items:', items);
            setError('Formato de cuestionario inválido');
            return;
          }
        }
        
        // Verificar que items sea un array
        if (!Array.isArray(items)) {
          console.error('Items no es un array:', items);
          setError('Formato de cuestionario inválido');
          return;
        }
        
        console.log('Items parseados:', items);
        console.log('Cantidad de items:', items.length);
        console.log('Primeros 5 items:', items.slice(0, 5));
        console.log('Últimos 5 items:', items.slice(-5));
        
        // Actualizar el objeto data con items parseados
        const updatedData = {
          ...data,
          cuestionario: {
            ...data.cuestionario,
            items: items
          }
        };
        
        setLinkInfo(updatedData);
        
        // Inicializar respuestas con valores undefined para forzar selección
        const respuestasIniciales: Record<number, number> = {};
        items.forEach((item: Pregunta) => {
          // No inicializar con valor por defecto para forzar que el usuario seleccione
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
  const handleRespuestaChange = (preguntaId: string | number, valor: number) => {
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
      let respuestasArray;
      
      console.log('=== DEBUG CUESTIONARIO ID ===');
      console.log('linkInfo.cuestionario.id:', linkInfo.cuestionario.id);
      console.log('linkInfo.cuestionario.codigo:', linkInfo.cuestionario?.codigo);
      console.log('Tipo de linkInfo.cuestionario.id:', typeof linkInfo.cuestionario.id);
      console.log('Comparación linkInfo.cuestionario.codigo === "PHQ-9":', linkInfo.cuestionario.codigo === 'PHQ-9');
      console.log('=== FIN DEBUG ID ===');
      
      // Para PHQ-9, necesitamos asegurar que se envíen todas las 9 respuestas
      if (linkInfo.cuestionario.codigo === 'PHQ-9') {
        // Procesar todos los ítems del PHQ-9 (ahora solo hay 9)
        respuestasArray = linkInfo.cuestionario.items.map((pregunta) => {
          // Para PHQ-9, usar el orden como pregunta_id y como uniqueKey (igual que en el renderizado)
          const preguntaId = pregunta.orden!;
          const uniqueKey = String(pregunta.orden!);
          const valor = respuestas[uniqueKey] !== undefined ? respuestas[uniqueKey] : 0;
          return {
            pregunta_id: preguntaId,
            valor,
          };
        });
      } else {
        // Para otros cuestionarios, usar la lógica anterior
        respuestasArray = Object.entries(respuestas).map(([id, valor]) => {
          // Para OPD-CA2-SQ, el id puede ser el orden (número)
          // Para WHO-5, el id es el id de la pregunta
          const preguntaId = isNaN(Number(id)) ? id : parseInt(id);
          return {
            pregunta_id: preguntaId,
            valor,
          };
        });
      }

      console.log('=== PHQ-9 DEBUG FRONTEND ===');
      console.log('Cuestionario ID:', linkInfo.cuestionario.id);
      console.log('Total de preguntas en cuestionario:', linkInfo.cuestionario.items.length);
      console.log('Items del cuestionario:', linkInfo.cuestionario.items.map(item => ({ orden: item.orden, id: item.id, texto: item.texto?.substring(0, 50) })));
      console.log('Respuestas capturadas:', respuestas);
      console.log('Keys en respuestas:', Object.keys(respuestas));
      console.log('Enviando respuestas:', respuestasArray);
      console.log('Total de respuestas enviadas:', respuestasArray.length);
      console.log('=== FIN DEBUG ===');

      const res = await fetch(`/api/cuestionarios/responder/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respuestas: respuestasArray,
        }),
      });

      const data = await res.json();
      console.log('Respuesta del servidor:', data);

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
    <>
      <style jsx>{`
        /* Estilos para botones de respuesta */
        .response-button {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .response-button:hover {
          transform: translateY(-1px);
        }
        
        .response-button:active {
          transform: translateY(0);
        }
        
        .response-button.selected {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 mb-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{linkInfo.cuestionario.titulo}</h1>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto mb-4 rounded-full"></div>
              <p className="font-semibold text-xl text-blue-700 mb-4">{linkInfo.pacienteNombre}</p>
              
              {/* Indicador de Progreso */}
              <div className="mb-4">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-sm font-medium text-gray-600 mr-3">
                    Progreso: {getProgress().answered} de {getProgress().total} preguntas
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {getProgress().percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${getProgress().percentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                <p className="text-gray-700 text-base leading-relaxed">
                  {linkInfo.cuestionario.descripcion || 'Cuestionario de 81 ítems que evalúa cuatro dimensiones de capacidades psicodinámicas según el modelo OPD.'}
                </p>
              </div>
            </div>
          </div>

          {/* Paginación Superior */}
          <div className="mb-4 flex justify-center">
            <div className="bg-white p-3 rounded-xl shadow-md border border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalItems={linkInfo.cuestionario.items.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>

          <div className="space-y-4">
          {linkInfo.cuestionario.items
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((pregunta, index) => {
              const globalIndex = (currentPage - 1) * itemsPerPage + index;
              const uniqueKey = String(pregunta.orden || pregunta.id || `item-${globalIndex}`);
              const valor = respuestas[uniqueKey];
              const opciones = pregunta.opciones_respuesta || [];
              
              // Determinar rango dinámicamente según el cuestionario
              const minValue = opciones.length > 0 ? opciones[0].valor : 0;
              const maxValue = opciones.length > 0 ? opciones[opciones.length - 1].valor : maxScale;
              
              const fillPercentage = valor !== undefined ? ((valor - minValue) / (maxValue - minValue)) * 100 : 0;
              const trackColor = valor !== undefined ? getColorForValue(valor, linkInfo.cuestionario.codigo || '', maxValue) : '#e5e7eb';

              return (
                <div key={uniqueKey} className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <p className="font-semibold text-gray-900 mb-4 text-lg leading-relaxed text-center">{pregunta.texto}</p>
                  <div className="relative pt-2">
                    {/* Botones Horizontales */}
                    <div className="flex gap-2 justify-center">
                      {opciones.map((opt) => {
                        const isSelected = valor === opt.valor;
                        const buttonColor = isSelected 
                          ? getColorForValue(opt.valor, linkInfo.cuestionario.codigo || '', maxValue)
                          : '#f3f4f6';
                        const textColor = isSelected ? '#ffffff' : '#6b7280';
                        
                        return (
                          <button
                            key={opt.valor}
                            type="button"
                            onClick={() => handleRespuesta(uniqueKey, opt.valor)}
                            className={`
                              response-button flex-1 py-3 px-2 rounded-lg font-semibold text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                              ${
                                isSelected 
                                  ? 'selected' 
                                  : 'hover:bg-gray-200 shadow-sm'
                              }
                            `}
                            style={{
                              backgroundColor: buttonColor,
                              color: textColor,
                              border: isSelected ? 'none' : '2px solid #e5e7eb'
                            }}
                          >
                            {opt.valor}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4" style={{ borderLeftColor: valor !== undefined ? getColorForValue(valor, linkInfo.cuestionario.codigo || '', maxValue) : '#d1d5db' }}>
                      <p className="text-center font-semibold text-lg" style={{ color: valor !== undefined ? getColorForValue(valor, linkInfo.cuestionario.codigo || '', maxValue) : '#6b7280' }}>
                        {valor !== undefined
                          ? opciones.find((o) => o.valor === valor)?.texto
                          : <span className="text-gray-500 italic">Selecciona una opción</span>}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

          {/* Paginación Inferior */}
          <div className="mt-4 flex justify-center">
            <div className="bg-white p-3 rounded-xl shadow-md border border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalItems={linkInfo.cuestionario.items.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>

          <div className="mt-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            {/* Mensaje de validación si no está completo */}
            {!isQuestionnaireComplete() && (
              <div className="mb-4 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                <p className="text-sm text-amber-700 text-center font-medium">
                  ⚠️ Por favor, responde todas las preguntas antes de enviar el cuestionario.
                </p>
              </div>
            )}
            
            <button
              onClick={handleSubmit}
              disabled={enviando || !isQuestionnaireComplete()}
              className={`w-full py-4 px-8 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 transform ${
                !isQuestionnaireComplete() 
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                  : enviando 
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:scale-105'
              }`}
            >
              {enviando ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </div>
              ) : !isQuestionnaireComplete() ? (
                'Completa todas las preguntas'
              ) : (
                'Enviar respuestas'
              )}
            </button>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-blue-700 text-center font-medium">
                🔒 Tus respuestas son confidenciales y solo serán vistas por tu profesional de salud.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
