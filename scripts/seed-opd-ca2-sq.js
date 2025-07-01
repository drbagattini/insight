// Script to seed OPD-CA2-SQ questionnaire data
const { createClient } = require('@supabase/supabase-js');
const { opdCa2Items, likertOptions } = require('./opd-ca2-items-complete');

// Load environment variables from .env.local manually
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedOpdCa2Sq() {
  console.log('Starting OPD-CA2-SQ seed...');
  
  // First, check if questionnaire already exists
  const { data: existing } = await supabase
    .from('cuestionarios')
    .select('id')
    .eq('codigo', 'OPD-CA2-SQ')
    .single();
    
  if (existing) {
    console.log('OPD-CA2-SQ already exists, updating title...');
    const questionnaireData = {
      codigo: 'OPD-CA2-SQ',
      titulo: 'Estructura psíquica adolescente (OPD-CA2-SQ)',
      descripcion: 'Cuestionario de 81 ítems que evalúa cuatro dimensiones de capacidades psicodinámicas según el modelo OPD.',
      items: { items: opdCa2Items.map((texto, index) => ({
        orden: index + 1,
        texto,
        opciones_respuesta: likertOptions
      })) },
      activo: true
    };
    const { error: updateError } = await supabase
      .from('cuestionarios')
      .update({ 
        titulo: questionnaireData.titulo,
        items: questionnaireData.items 
      })
      .eq('codigo', 'OPD-CA2-SQ');
    
    if (updateError) {
      console.error('Error updating questionnaire title:', updateError);
    } else {
      console.log('Title updated successfully!');
    }
    return;
  }

  // Create items array with all 81 items
  const items = opdCa2Items.map((texto, index) => ({
    orden: index + 1,
    texto,
    opciones_respuesta: likertOptions
  }));

  const questionnaireData = {
    codigo: 'OPD-CA2-SQ',
    titulo: 'Estructura psíquica adolescente (OPD-CA2-SQ)',
    descripcion: 'Cuestionario de 81 ítems que evalúa cuatro dimensiones de capacidades psicodinámicas según el modelo OPD.',
    items: { items },
    activo: true
  };

  const { data, error } = await supabase
    .from('cuestionarios')
    .insert(questionnaireData);

  if (error) {
    console.error('Error seeding OPD-CA2-SQ:', error);
  } else {
    console.log('OPD-CA2-SQ seeded successfully!');
  }
}

if (require.main === module) {
  seedOpdCa2Sq().then(() => process.exit(0));
}

module.exports = { seedOpdCa2Sq };
