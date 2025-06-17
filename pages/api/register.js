// Implementación con manejo de CORS y mejor depuración
export default function handler(req, res) {
  console.log('API: /api/register hit with method:', req.method);
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Manejar OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    console.log('API: Handling OPTIONS preflight request');
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    console.log('API: Processing POST request');
    
    try {
      const userData = req.body;
      console.log('API: Received user data:', { ...userData, password_hash: userData.password_hash ? '[REDACTED]' : undefined });
      
      // Respuesta exitosa simplificada
      console.log('API: Sending successful response');
      return res.status(200).json({
        user: {
          id: '123',
          email: userData.email || 'test@example.com',
          first_name: userData.first_name || 'Test',
          last_name: userData.last_name || 'User',
          role: userData.role || 'paciente',
          is_active: true
        }
      });
    } catch (error) {
      console.error('API: Error processing request:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
  // Método no permitido
  console.log(`API: Method ${req.method} not allowed`);
  res.setHeader('Allow', ['POST', 'OPTIONS']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
