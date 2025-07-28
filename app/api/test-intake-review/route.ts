import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

const SIMPLE_PROMPT = `Eres un supervisor clínico. Responde de forma natural y directa.

Tienes acceso completo a todos los datos del paciente en el JSON al final. Cuando te pregunten sobre el paciente, revisa TODOS los campos de la entrevista inicial (intake.datos) y proporciona un resumen completo que incluya todos los aspectos relevantes.

Si te pregunten sobre cuestionarios específicos, busca en el array "questionnaires" y analiza los puntajes y respuestas.

No uses frases repetitivas como "me alegro que podamos tomarnos tiempo" o "hay mucho para desempacar". Varía tu lenguaje y sé directo.

NUNCA digas "no tengo acceso".`;

const MOCK_PATIENT_DATA = {
  "patient": {
    "name": "Pedro Subirá",
    "age": 32,
    "email": "pedro@example.com"
  },
  "intake": {
    "datos": {
      "edad": 32,
      "sexo": "Masculino",
      "presentacion": "Consulta por síntomas depresivos y apatía generalizada",
      "malestarPaciente": "Se siente como 'un sapo de otro pozo', dificultades marcadas en relaciones interpersonales",
      "antecedentesPersonales": "Historia de humillación severa en la adolescencia que marcó su autoestima",
      "motivoConsulta": "Depresión persistente y aislamiento social progresivo",
      "expectativasTratamiento": "Mejorar estado de ánimo y capacidad de relacionarse con otros",
      "historiaMedica": "Sin antecedentes médicos relevantes",
      "medicacionActual": "Ninguna",
      "consumoSustancias": "Alcohol ocasional, sin problemas",
      "situacionLaboral": "Empleado en oficina, rendimiento decreciente",
      "situacionFamiliar": "Soltero, vive solo, relación distante con familia",
      "redDeApoyo": "Muy limitada, pocos amigos cercanos",
      "actividadesInteres": "Solía disfrutar lectura y cine, ahora perdió interés",
      "sueno": "Insomnio de conciliación, despertares nocturnos",
      "apetito": "Disminuido, pérdida de peso leve",
      "energia": "Muy baja, fatiga constante",
      "concentracion": "Muy deteriorada, afecta trabajo",
      "estadoAnimo": "Deprimido la mayor parte del tiempo",
      "ansiedad": "Ansiedad social marcada",
      "irritabilidad": "Ocasional, especialmente en situaciones sociales",
      "ideacionSuicida": "Pensamientos pasivos, sin plan ni intención",
      "funcionamientoPrevio": "Funcionamiento social y laboral previamente normal",
      "eventosPrecipitantes": "Ruptura de relación hace 8 meses",
      "recursosPersonales": "Inteligencia alta, insight parcial",
      "motivacionCambio": "Alta, busca activamente ayuda",
      "objetivosTerapeuticos": "Mejorar autoestima, desarrollar habilidades sociales, reducir síntomas depresivos"
    }
  },
  "questionnaires": [
    {
      "codigo": "WHO-5",
      "titulo": "WHO-5 Well-being Index",
      "puntuacion": 8,
      "respuestas": [
        {"pregunta": "Me he sentido alegre y de buen humor", "respuesta": 1},
        {"pregunta": "Me he sentido calmado y relajado", "respuesta": 2},
        {"pregunta": "Me he sentido activo y vigoroso", "respuesta": 1},
        {"pregunta": "Me desperté sintiéndome fresco y descansado", "respuesta": 2},
        {"pregunta": "Mi vida diaria ha estado llena de cosas que me interesan", "respuesta": 2}
      ]
    }
  ]
};

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    const fullPrompt = `${SIMPLE_PROMPT}

### Datos del Paciente:
\`\`\`json
${JSON.stringify(MOCK_PATIENT_DATA, null, 2)}
\`\`\`

Terapeuta: ${message}`;

    const geminiRequest = {
      contents: [{
        parts: [{
          text: fullPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 4096
      }
    };

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequest)
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta';

    return NextResponse.json({
      response: aiResponse,
      intakeFieldsCount: Object.keys(MOCK_PATIENT_DATA.intake.datos).length,
      status: 'success'
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
