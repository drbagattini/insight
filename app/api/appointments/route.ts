import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { RRule } from 'rrule';
import { z } from 'zod';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Schema de validación para citas
const appointmentSchema = z.object({
  paciente_id: z.string().uuid('Patient ID debe ser un UUID válido'), // Made mandatory
  title: z.string().optional(),
  start_time: z.string().min(1, 'Fecha de inicio requerida'),
  end_time: z.string().min(1, 'Fecha de fin requerida'),
  rrule: z.string().regex(/^RRULE:FREQ=(DAILY|WEEKLY|MONTHLY);INTERVAL=\d+$/, 'Formato de RRULE inválido').optional().nullable(),
  metadata: z.record(z.unknown()).optional().default({}),
});

// GET: list appointments in a date range and expand recurring events
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  if (!start || !end) {
    return NextResponse.json({ error: 'Missing start or end' }, { status: 400 });
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }

  // Fetch non-recurring appointments with patient name
  const { data: nonRec, error: err1 } = await supabase
    .from('appointments')
    .select(`
      *,
      pacientes:paciente_id (
        id,
        name
      )
    `)
    .eq('user_id', session.user.id)
    .is('rrule', null)
    .gte('start_time', startDate.toISOString())
    .lte('end_time', endDate.toISOString());
  if (err1) {
    console.error(err1);
    return NextResponse.json({ error: err1.message }, { status: 500 });
  }

  // Fetch recurring master records with patient name
  const { data: recMasters, error: err2 } = await supabase
    .from('appointments')
    .select(`
      *,
      pacientes:paciente_id (
        id,
        name
      )
    `)
    .eq('user_id', session.user.id)
    .not('rrule', 'is', null);
  if (err2) {
    console.error(err2);
    return NextResponse.json({ error: err2.message }, { status: 500 });
  }

  // Transformar datos no recurrentes para incluir nombre de paciente como propiedad directa
  const processedNonRec = (nonRec || []).map((appt: any) => {
    // Extraer el nombre del paciente de la relación si existe
    const pacienteNombre = appt.pacientes?.name || '';
    
    // Crear una copia limpia del objeto sin la propiedad anidada
    const { pacientes, ...cleanAppt } = appt;
    
    // Devolver el objeto con el nombre del paciente como propiedad directa
    return {
      ...cleanAppt,
      paciente_nombre: pacienteNombre
    };
  });

  const all = [...processedNonRec];
  
  // Procesar citas recurrentes de manera similar
  recMasters?.forEach((master: any) => {
    try {
      // Extraer el nombre del paciente
      const pacienteNombre = master.pacientes?.name || '';
      const { pacientes, ...cleanMaster } = master;
      
      // Parse RRULE y asignar dtstart correctamente
      const opts = RRule.parseString(cleanMaster.rrule!);
      opts.dtstart = new Date(cleanMaster.start_time);
      const rule = new RRule(opts);
      const dur = new Date(cleanMaster.end_time).getTime() - new Date(cleanMaster.start_time).getTime();
      
      rule.between(startDate, endDate, true).forEach((dt: Date) => {
        all.push({
          ...cleanMaster,
          paciente_nombre: pacienteNombre,
          id: `${cleanMaster.id}_${dt.toISOString()}`,
          start_time: dt.toISOString(),
          end_time: new Date(dt.getTime() + dur).toISOString(),
          isOccurrence: true,
          original_master_id: cleanMaster.id,
        });
      });
    } catch (err) {
      console.error(`RRULE parse error for ${master.id}`, err);
    }
  });

  return NextResponse.json(all, { status: 200 });
}

// POST: create a single or recurring appointment
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validación de datos de entrada
  const body = await request.json();
  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { paciente_id, title, start_time, end_time, rrule, metadata } = parsed.data;

  const appointmentPayload: any = {
    user_id: session.user.id,
    paciente_id, // Now directly included as it's mandatory
    title,
    start_time,
    end_time,
    metadata: metadata || {},
  };

  // rrule is still optional
  if (rrule) {
    appointmentPayload.rrule = rrule;
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert([appointmentPayload])
    .select()
    .single();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}