import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
// Admin client for Supabase Storage and DB
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const form = await request.formData();
  const file = form.get('file');
  const filename = form.get('filename');
  if (!(file instanceof Blob) || typeof filename !== 'string') return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });

  // Generate a unique filename with UUID to avoid caching issues
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = filename.split('.').pop() || 'png';
  const uniqueFilename = `${uuidv4()}.${ext}`;
  const path = `${userId}/${uniqueFilename}`;

  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from('profile-pictures')
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabaseAdmin.storage
    .from('profile-pictures')
    .getPublicUrl(uploadData.path);
  // Add timestamp to URL to prevent caching
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  // Update the public.users table
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ 
      image_url: publicUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Get the updated user data
  const { data: updatedUser, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  // Update the auth.users table with the new image URL
  const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { image_url: publicUrl }
  });

  if (authUpdateError) {
    console.error('Error updating auth user metadata:', authUpdateError);
    return NextResponse.json({ error: 'Failed to update auth user' }, { status: 500 });
  }

  // Return the updated user data with cache control headers
  const response = NextResponse.json({ 
    success: true,
    image_url: publicUrl,
    user: updatedUser
  });
  
  // Prevent caching of this response
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}
