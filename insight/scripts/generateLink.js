#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fetch = global.fetch || require('node-fetch');

const [,, pacienteId, canal = 'whatsapp'] = process.argv;
if (!pacienteId) {
  console.error('Uso: npm run generate-link -- <pacienteId> [canal]');
  process.exit(1);
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

fetch(`${baseUrl}/api/cuestionarios/enviar`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pacienteId, canal })
})
  .then(res => res.json())
  .then(json => {
    if (json.error) console.error('Error:', json.error);
    else console.log('Link generado:', json.link);
  })
  .catch(err => console.error(err));
