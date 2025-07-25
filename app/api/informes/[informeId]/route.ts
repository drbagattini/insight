import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET: Obtener informe específico
export async function GET(request: NextRequest, { params }: any) {
  const { informeId } = await params;
  
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = token?.sbAccessToken
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: { Authorization: `Bearer ${token.sbAccessToken}` }
          }
        }
      )
    : supabaseAdmin;

  try {
    const { data: informe, error } = await supabase
      .from('informes_clinicos')
      .select('*')
      .eq('id', informeId)
      .eq('psicologo_id', token.id)
      .single();

    if (error || !informe) {
      return NextResponse.json({ error: 'Informe no encontrado' }, { status: 404 });
    }

    return NextResponse.json(informe);

  } catch (error) {
    console.error('Error in GET /api/informes/[informeId]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT: Actualizar informe
export async function PUT(request: NextRequest, { params }: any) {
  const { informeId } = await params;
  
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = token?.sbAccessToken
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: { Authorization: `Bearer ${token.sbAccessToken}` }
          }
        }
      )
    : supabaseAdmin;

  try {
    const updateData = await request.json();
    
    // Campos permitidos para actualizar
    const allowedFields = ['titulo', 'contenido', 'estado', 'metadatos'];
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as any);

    if (Object.keys(filteredData).length === 0) {
      return NextResponse.json(
        { error: 'No hay campos válidos para actualizar' }, 
        { status: 400 }
      );
    }

    const { data: informeActualizado, error } = await supabase
      .from('informes_clinicos')
      .update(filteredData)
      .eq('id', informeId)
      .eq('psicologo_id', token.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating report:', error);
      return NextResponse.json({ error: 'Error al actualizar informe' }, { status: 500 });
    }

    if (!informeActualizado) {
      return NextResponse.json({ error: 'Informe no encontrado' }, { status: 404 });
    }

    return NextResponse.json(informeActualizado);

  } catch (error) {
    console.error('Error in PUT /api/informes/[informeId]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE: Eliminar informe
export async function DELETE(request: NextRequest, { params }: any) {
  const { informeId } = await params;
  
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = token?.sbAccessToken
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: { Authorization: `Bearer ${token.sbAccessToken}` }
          }
        }
      )
    : supabaseAdmin;

  try {
    const { error } = await supabase
      .from('informes_clinicos')
      .delete()
      .eq('id', informeId)
      .eq('psicologo_id', token.id);

    if (error) {
      console.error('Error deleting report:', error);
      return NextResponse.json({ error: 'Error al eliminar informe' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Informe eliminado exitosamente' });

  } catch (error) {
    console.error('Error in DELETE /api/informes/[informeId]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
