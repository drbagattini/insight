import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Schema de validación para actualización de citas
const updateAppointmentSchema = z.object({
  title: z.string().optional(),
  start_time: z.string().min(1, 'Fecha de inicio requerida').optional(),
  end_time: z.string().min(1, 'Fecha de fin requerida').optional(),
  paciente_id: z.string().uuid('Patient ID debe ser un UUID válido').optional(),
  rrule: z.string().regex(/^RRULE:FREQ=(DAILY|WEEKLY|MONTHLY);INTERVAL=\d+$/, 'Formato de RRULE inválido').optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

// GET a single appointment
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing appointment ID' }, { status: 400 });
  }

  // Extract the base ID in case it's a recurring instance
  const baseId = id.includes('_') ? id.split('_')[0] : id;

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', baseId)
    .eq('user_id', session.user.id)
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
  }

  return NextResponse.json(data);
}

// PATCH/PUT: update an appointment
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing appointment ID' }, { status: 400 });
  }

  // Extract the base ID in case it's a recurring instance
  const baseId = id.includes('_') ? id.split('_')[0] : id;

  // Validate request body
  const body = await request.json();
  const parsed = updateAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Update appointment
  const { data, error } = await supabase
    .from('appointments')
    .update(parsed.data)
    .eq('id', baseId)
    .eq('user_id', session.user.id)
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE: remove an appointment
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing appointment ID' }, { status: 400 });
  }

  // Extract the base ID in case it's a recurring instance
  const baseId = id.includes('_') ? id.split('_')[0] : id;

  // Check for "deleteAll" query param for recurring appointments
  const { searchParams } = new URL(request.url);
  const deleteAll = searchParams.get('deleteAll') === 'true';

  // First fetch the appointment to verify ownership
  const { data: appointmentData, error: fetchError } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', baseId)
    .eq('user_id', session.user.id)
    .single();

  if (fetchError) {
    console.error(fetchError);
    return NextResponse.json(
      { error: fetchError.message },
      { status: fetchError.code === 'PGRST116' ? 404 : 500 }
    );
  }

  // Delete the appointment
  const { error: deleteError } = await supabase
    .from('appointments')
    .delete()
    .eq('id', baseId)
    .eq('user_id', session.user.id);

  if (deleteError) {
    console.error(deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: appointmentData });
}

// For compatibility with frameworks that use PUT
export const PUT = PATCH;
