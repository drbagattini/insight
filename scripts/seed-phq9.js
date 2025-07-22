require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const phq9Data = {
  codigo: 'PHQ-9',
  titulo: 'Cuestionario de Salud del Paciente (PHQ-9)',
  descripcion: 'Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?',
  activo: true,
  items: [
    {
      orden: 1,
      texto: 'Poco interés o placer en hacer cosas',
      opciones_respuesta: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    },
    {
      orden: 2,
      texto: 'Sentirse decaído/a, deprimido/a o sin esperanzas',
      opciones_respuesta: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    },
    {
      orden: 3,
      texto: 'Dificultad para dormir, permanecer dormido/a o dormir demasiado',
      opciones_respuesta: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    },
    {
      orden: 4,
      texto: 'Sentirse cansado/a o con poca energía',
      opciones_respuesta: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    },
    {
      orden: 5,
      texto: 'Falta de apetito o comer en exceso',
      opciones_respuesta: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    },
    {
      orden: 6,
      texto: 'Sentirse mal consigo mismo/a (p. ej., sentirse fracasado/a o haber defraudado a otros)',
      opciones_respuesta: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    },
    {
      orden: 7,
      texto: 'Dificultad para concentrarse (leer, ver TV, etc.)',
      opciones_respuesta: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    },
    {
      orden: 8,
      texto: 'Haberse movido o hablado más lento de lo habitual — o lo contrario, más inquieto/a e intranquilo/a',
      opciones_respuesta: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    },
    {
      orden: 9,
      texto: 'Pensamientos de que estaría mejor muerto/a o de hacerse daño',
      opciones_respuesta: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    }
  ]
};

async function seedPhq9() {
  console.log('🌱 Iniciando seeding del cuestionario PHQ-9...');
  
  try {
    // Verificar si ya existe
    const { data: existing, error: checkError } = await supabase
      .from('cuestionarios')
      .select('id, codigo')
      .eq('codigo', 'PHQ-9')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      console.log('📝 PHQ-9 ya existe, actualizando...');
      
      const { data, error } = await supabase
        .from('cuestionarios')
        .update({
          titulo: phq9Data.titulo,
          descripcion: phq9Data.descripcion,
          activo: phq9Data.activo,
          items: phq9Data.items
        })
        .eq('codigo', 'PHQ-9')
        .select()
        .single();

      if (error) throw error;

      console.log('✅ PHQ-9 actualizado exitosamente:');
      console.log(`   ID: ${data.id}`);
      console.log(`   Título: ${data.titulo}`);
      console.log(`   Ítems: ${data.items.length}`);
      
    } else {
      console.log('🆕 Creando nuevo cuestionario PHQ-9...');
      
      const { data, error } = await supabase
        .from('cuestionarios')
        .insert(phq9Data)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ PHQ-9 creado exitosamente:');
      console.log(`   ID: ${data.id}`);
      console.log(`   Código: ${data.codigo}`);
      console.log(`   Título: ${data.titulo}`);
      console.log(`   Ítems: ${data.items.length}`);
    }

    console.log('\n📈 Detalles del cuestionario:');
    console.log('   • 9 ítems puntuables (síntomas depresivos)');
    console.log('   • Escala: 0-3 (Nunca, Varios días, Más de la mitad, Casi todos)');
    console.log('   • Rango total: 0-27 puntos');
    console.log('   • ⚠️  ALERTA: Ítem 9 > 0 = Riesgo suicida');
    console.log('   • 🚨 ALERTA: Total ≥ 10 = Intervención clínica');

  } catch (error) {
    console.error('❌ Error durante el seeding:', error.message);
    process.exit(1);
  }
}

seedPhq9();
