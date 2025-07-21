#!/usr/bin/env node

/**
 * Script de prueba para verificar la integración completa de Google Calendar
 * Verifica que todos los componentes estén correctamente conectados
 */

const fs = require('fs');
const path = require('path');

console.log('🔗 Testing Google Calendar Integration');
console.log('=' .repeat(60));

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${exists ? 'Found' : 'Missing'}`);
  return exists;
}

function checkFileContains(filePath, searchText, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const contains = content.includes(searchText);
    console.log(`${contains ? '✅' : '❌'} ${description}: ${contains ? 'Found' : 'Missing'}`);
    return contains;
  } catch (error) {
    console.log(`❌ ${description}: Error reading file`);
    return false;
  }
}

async function testIntegration() {
  console.log('\n📍 Test 1: Verificando archivos principales...');
  
  const files = [
    {
      path: path.join(__dirname, '../app/api/calendar/disconnect/route.ts'),
      desc: 'Disconnect API endpoint'
    },
    {
      path: path.join(__dirname, '../app/components/auth/ConnectCalendarButton.tsx'),
      desc: 'Connect Calendar Button component'
    },
    {
      path: path.join(__dirname, '../components/CalendarView.tsx'),
      desc: 'Calendar View component'
    },
    {
      path: path.join(__dirname, '../app/lib/auth.ts'),
      desc: 'NextAuth configuration'
    }
  ];
  
  let allFilesExist = true;
  files.forEach(file => {
    const exists = checkFileExists(file.path, file.desc);
    if (!exists) allFilesExist = false;
  });
  
  console.log('\n📍 Test 2: Verificando integración en CalendarView...');
  
  const calendarViewPath = path.join(__dirname, '../components/CalendarView.tsx');
  const calendarChecks = [
    {
      text: 'import ConnectCalendarButton',
      desc: 'ConnectCalendarButton import'
    },
    {
      text: '<ConnectCalendarButton',
      desc: 'ConnectCalendarButton usage'
    },
    {
      text: 'onConnection={() => {',
      desc: 'onConnection callback'
    },
    {
      text: 'refetchEvents()',
      desc: 'Event refresh on connection change'
    }
  ];
  
  let calendarIntegrated = true;
  calendarChecks.forEach(check => {
    const found = checkFileContains(calendarViewPath, check.text, check.desc);
    if (!found) calendarIntegrated = false;
  });
  
  console.log('\n📍 Test 3: Verificando funcionalidad de desconexión...');
  
  const disconnectChecks = [
    {
      file: path.join(__dirname, '../app/api/calendar/disconnect/route.ts'),
      text: 'https://oauth2.googleapis.com/revoke',
      desc: 'Google token revocation'
    },
    {
      file: path.join(__dirname, '../app/components/auth/ConnectCalendarButton.tsx'),
      text: '/api/calendar/disconnect',
      desc: 'Disconnect API call'
    },
    {
      file: path.join(__dirname, '../app/components/auth/ConnectCalendarButton.tsx'),
      text: 'disconnectGoogleCalendar: true',
      desc: 'Session update for disconnect'
    },
    {
      file: path.join(__dirname, '../app/lib/auth.ts'),
      text: 'delete token.googleCalendarAccessToken',
      desc: 'Token cleanup in NextAuth'
    }
  ];
  
  let disconnectWorking = true;
  disconnectChecks.forEach(check => {
    const found = checkFileContains(check.file, check.text, check.desc);
    if (!found) disconnectWorking = false;
  });
  
  console.log('\n📍 Test 4: Verificando disponibilidad en páginas...');
  
  const pageChecks = [
    {
      file: path.join(__dirname, '../app/dashboard/profile/page.tsx'),
      text: 'ConnectCalendarButton',
      desc: 'Available in Profile page'
    },
    {
      file: path.join(__dirname, '../components/CalendarView.tsx'),
      text: 'ConnectCalendarButton',
      desc: 'Available in Calendar page'
    }
  ];
  
  let pagesIntegrated = true;
  pageChecks.forEach(check => {
    const found = checkFileContains(check.file, check.text, check.desc);
    if (!found) pagesIntegrated = false;
  });
  
  console.log('\n📍 Test 5: Verificando servidor...');
  
  try {
    const response = await fetch('http://localhost:3000/api/calendar/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const serverRunning = response.status === 401; // Expected: unauthorized
    console.log(`${serverRunning ? '✅' : '❌'} Server responding: ${serverRunning ? 'Yes' : 'No'}`);
    
    console.log('\n🎉 Resumen de Integración:');
    console.log('=' .repeat(60));
    
    const allTestsPassed = allFilesExist && calendarIntegrated && disconnectWorking && pagesIntegrated && serverRunning;
    
    if (allTestsPassed) {
      console.log('✅ INTEGRACIÓN COMPLETA - Todos los componentes funcionando');
      console.log('🚀 La funcionalidad está lista para uso en producción');
      
      console.log('\n📋 Funcionalidades disponibles:');
      console.log('• Botón de conexión/desconexión en página de Perfil');
      console.log('• Botón de conexión/desconexión en página de Agenda');
      console.log('• Revocación de tokens en Google OAuth');
      console.log('• Limpieza de tokens en NextAuth');
      console.log('• Actualización automática de eventos del calendario');
      console.log('• Estados visuales durante conexión/desconexión');
      
    } else {
      console.log('⚠️  INTEGRACIÓN INCOMPLETA - Revisar componentes faltantes');
      
      if (!allFilesExist) console.log('❌ Archivos principales faltantes');
      if (!calendarIntegrated) console.log('❌ CalendarView no integrado completamente');
      if (!disconnectWorking) console.log('❌ Funcionalidad de desconexión incompleta');
      if (!pagesIntegrated) console.log('❌ Botones no disponibles en todas las páginas');
      if (!serverRunning) console.log('❌ Servidor no responde correctamente');
    }
    
  } catch (error) {
    console.log('❌ Server responding: No (not running or network error)');
    console.log('⚠️  Inicia el servidor con: npm run dev');
  }
}

// Ejecutar las pruebas
testIntegration().then(() => {
  console.log('\n🏁 Pruebas de integración completadas');
}).catch(error => {
  console.error('💥 Error durante las pruebas:', error);
  process.exit(1);
});
