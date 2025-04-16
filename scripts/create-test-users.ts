require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Asegúrate de que estas variables estén en tu .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_USERS = [
  {
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    email: 'psicologo@test.com',
    password: 'psico123',
    role: 'psicologo'
  },
  {
    email: 'paciente@test.com',
    password: 'user123',
    role: 'paciente'
  }
];

async function createTestUsers() {
  for (const user of TEST_USERS) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (existingUser) {
      console.log(`Usuario ${user.email} ya existe.`);
      continue;
    }

    // Crear nuevo usuario
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: user.email,
          password_hash: hashedPassword,
          role: user.role
        }
      ]);

    if (error) {
      console.error(`Error creando usuario ${user.email}:`, error);
    } else {
      console.log(`Usuario ${user.email} creado con rol ${user.role}`);
    }
  }
}

createTestUsers()
  .then(() => console.log('Usuarios de prueba creados'))
  .catch(console.error);
