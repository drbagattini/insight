#!/usr/bin/env node

/**
 * Test Production Recurrence Integration
 * Simulates creating a patient with weekly recurrence from the UI
 */

require('dotenv').config({ path: '.env.local' });

const SERVER_URL = 'http://localhost:3000';

async function testProductionRecurrence() {
  console.log('🧪 Testing Production Recurrence Integration\n');

  try {
    // Simulate creating a patient with weekly recurrence
    const patientData = {
      name: 'Test Patient - Recurrencia Semanal',
      email: 'pedrosubiria27@gmail.com',
      whatsapp: null,
      metadata: {
        cuestionario_id: '', // Will be filled by WHO-5 default
        preferencias_cuestionario: {
          canal: 'email',
          frecuencia: 'semanal'
        },
        whatsappConsent: false
      },
      sendInitial: true
    };

    console.log('📝 Creating patient with weekly recurrence...');
    console.log(`   Name: ${patientData.name}`);
    console.log(`   Email: ${patientData.email}`);
    console.log(`   Frequency: ${patientData.metadata.preferencias_cuestionario.frecuencia}`);
    console.log(`   Channel: ${patientData.metadata.preferencias_cuestionario.canal}`);
    console.log('');

    const response = await fetch(`${SERVER_URL}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Production-Test'
      },
      body: JSON.stringify(patientData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Patient created successfully!');
      console.log(`   Patient ID: ${result.paciente.id}`);
      console.log(`   Name: ${result.paciente.name}`);
      
      if (result.link) {
        console.log(`   📧 First questionnaire sent: ${result.link}`);
      }
      
      if (result.recurrencia) {
        console.log(`   🔄 Recurrence scheduled:`);
        console.log(`      ID: ${result.recurrencia.id}`);
        console.log(`      Frequency: ${result.recurrencia.frecuencia}`);
        console.log(`      Next send: ${new Date(result.recurrencia.proximoEnvio).toLocaleString()}`);
      }
      
      console.log('\n🎯 Expected behavior:');
      console.log('   1. ✅ First email sent immediately');
      console.log('   2. 🔄 Weekly recurrence scheduled');
      console.log('   3. ⏰ Next email in 7 days (automatic)');
      
    } else {
      console.error('❌ Error creating patient:', result);
    }

  } catch (error) {
    console.error('🔥 Test error:', error.message);
  }
}

testProductionRecurrence();
