"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

export default function CuestionarioPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [completado, setCompletado] = useState(false);

  // Cargar información del cuestionario
  useEffect(() => {
    async function cargarCuestionario() {
      try {
        const res = await fetch(`/api/cuestionarios/verificar/${params.token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Error al cargar el cuestionario");
          return;
        }

        setLinkInfo(data);
        
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
  }, [params.token]);

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

      const res = await fetch(`/api/cuestionarios/responder/${params.token}`, {
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
          <h1 className="text-2xl font-bold mb-4">¡Gracias por completar el cuestionario!</h1>
          <p className="mb-6">Tus respuestas han sido registradas correctamente.</p>
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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-2">{linkInfo.cuestionario.titulo}</h1>
        <p className="mb-6 text-gray-600">{linkInfo.cuestionario.descripcion}</p>
        
        <div className="mb-6">
          <p className="font-medium">Paciente: {linkInfo.pacienteNombre}</p>
        </div>

        <div className="space-y-6">
          <p className="font-medium">Durante las últimas dos semanas...</p>
          
          {linkInfo.cuestionario.items.map((pregunta) => (
            <div key={pregunta.id} className="border-b pb-4">
              <p className="mb-3">{pregunta.texto}</p>
              <div className="grid grid-cols-6 gap-2 text-center text-sm">
                <div></div>
                <div>Todo el tiempo</div>
                <div>La mayor parte del tiempo</div>
                <div>Más de la mitad del tiempo</div>
                <div>Menos de la mitad del tiempo</div>
                <div>En ningún momento</div>

                <div className="font-medium">Valor:</div>
                {[5, 4, 3, 2, 1, 0].map((valor) => (
                  <div key={valor}>
                    <input
                      type="radio"
                      id={`p${pregunta.id}-${valor}`}
                      name={`pregunta-${pregunta.id}`}
                      checked={respuestas[pregunta.id] === valor}
                      onChange={() => handleRespuestaChange(pregunta.id, valor)}
                      className="mr-2"
                    />
                    <label htmlFor={`p${pregunta.id}-${valor}`}>{valor}</label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={enviando}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {enviando ? "Enviando..." : "Enviar respuestas"}
          </button>
        </div>
      </div>
    </div>
  );
}
