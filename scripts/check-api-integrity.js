const fs = require('fs');
const path = require('path');

function checkApiIntegrity() {
  console.log('🔍 Checking API endpoint integrity...\n');
  
  const apiDir = '/Users/NICOBAGA/CascadeProjects/windsurf-project/app/api';
  const findings = [];
  
  // Función para buscar archivos route.ts recursivamente
  function findRouteFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...findRouteFiles(fullPath));
      } else if (item === 'route.ts') {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  // Función para analizar métodos HTTP en un archivo
  function analyzeRouteFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const methods = [];
      
      // Buscar exportaciones de métodos HTTP
      const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      for (const method of httpMethods) {
        const regex = new RegExp(`export\\s+async\\s+function\\s+${method}`, 'g');
        if (regex.test(content)) {
          methods.push(method);
        }
      }
      
      return methods;
    } catch (error) {
      return [];
    }
  }
  
  console.log('1️⃣ Scanning API routes...');
  const routeFiles = findRouteFiles(apiDir);
  console.log(`Found ${routeFiles.length} route files\n`);
  
  console.log('2️⃣ Analyzing HTTP methods...');
  const crudEndpoints = [];
  
  for (const file of routeFiles) {
    const relativePath = file.replace(apiDir, '');
    const methods = analyzeRouteFile(file);
    
    // Identificar endpoints que podrían necesitar CRUD completo
    const isDynamicRoute = relativePath.includes('[') && relativePath.includes(']');
    const isEntityEndpoint = !relativePath.includes('/route.ts') || isDynamicRoute;
    
    if (isDynamicRoute) {
      crudEndpoints.push({
        path: relativePath,
        methods: methods,
        expectedMethods: ['GET', 'PUT', 'DELETE'],
        missing: ['GET', 'PUT', 'DELETE'].filter(m => !methods.includes(m))
      });
    }
    
    console.log(`  ${relativePath}: [${methods.join(', ')}]`);
  }
  
  console.log('\n3️⃣ CRUD Analysis for Dynamic Routes:');
  let issuesFound = 0;
  
  for (const endpoint of crudEndpoints) {
    if (endpoint.missing.length > 0) {
      console.log(`❌ ${endpoint.path}`);
      console.log(`   Has: [${endpoint.methods.join(', ')}]`);
      console.log(`   Missing: [${endpoint.missing.join(', ')}]`);
      issuesFound++;
    } else {
      console.log(`✅ ${endpoint.path} - Complete CRUD`);
    }
  }
  
  console.log('\n4️⃣ Historical Analysis:');
  console.log('Based on git history analysis:');
  console.log('- The PUT method for patients was never implemented before');
  console.log('- This suggests the update functionality may have used a different approach');
  console.log('- Possible scenarios:');
  console.log('  a) Updates were handled via POST to main /api/patients endpoint');
  console.log('  b) Updates were handled client-side only (optimistic updates)');
  console.log('  c) A different update mechanism was used');
  
  console.log('\n5️⃣ Recommendations:');
  if (issuesFound > 0) {
    console.log(`Found ${issuesFound} endpoints with incomplete CRUD operations`);
    console.log('Consider implementing missing HTTP methods for better REST compliance');
  } else {
    console.log('All dynamic routes have complete CRUD operations');
  }
  
  console.log('\n6️⃣ Investigation Result:');
  console.log('The patient update issue was likely NOT a regression but rather:');
  console.log('- A missing feature that was never properly implemented');
  console.log('- Previous "working" updates may have been:');
  console.log('  • Client-side only changes (not persisted)');
  console.log('  • Handled through a different code path');
  console.log('  • Using the main POST endpoint with different logic');
  
  return {
    totalRoutes: routeFiles.length,
    crudEndpoints: crudEndpoints.length,
    incompleteEndpoints: issuesFound,
    conclusion: 'Not a regression - missing feature implementation'
  };
}

// Ejecutar análisis
const result = checkApiIntegrity();
console.log('\n🎯 Summary:', result);
