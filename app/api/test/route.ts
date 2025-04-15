import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('Test API hit');
  return NextResponse.json({
    user: {
      id: '123',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'paciente',
      is_active: true
    }
  });
}
