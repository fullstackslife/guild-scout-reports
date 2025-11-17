"use server";

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/lib/supabase/database.types';
import { SCREENSHOTS_BUCKET } from '@/lib/constants';
import { createSupabaseServerActionClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type UploadState = {
  error?: string;
  success?: string;
};

export async function uploadScreenshot(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const supabase = createSupabaseServerActionClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: 'Not authenticated.' };
  }

  const file = formData.get('file') as File | null;
  const labelInput = (formData.get('label') as string | null) ?? '';
  const label = labelInput.trim().slice(0, 200) || null;

  if (!file || file.size === 0) {
    return { error: 'Select an image file before uploading.' };
  }

  if (!file.type.startsWith('image/')) {
    return { error: 'Only image uploads are supported right now.' };
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const filePath = `${session.user.id}/${randomUUID()}.${extension}`;

  try {
    const buffer = new Uint8Array(await file.arrayBuffer());

    const { error: storageError } = await supabase.storage
      .from(SCREENSHOTS_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600'
      });

    if (storageError) {
      console.error('Storage upload failed', storageError);
      return { error: 'Unable to upload file. Please try again.' };
    }

    const { error: insertError } = await supabase.from('screenshots').insert({
      user_id: session.user.id,
      file_path: filePath,
      label
    });

    if (insertError) {
      console.error('Metadata insert failed', insertError);
      await supabase.storage.from(SCREENSHOTS_BUCKET).remove([filePath]);
      return { error: 'Unable to save screenshot. Please try again.' };
    }
  } catch (error) {
    console.error('Upload failure', error);
    return { error: 'Upload failed unexpectedly.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/gallery');
  return { success: 'Screenshot uploaded.' };
}

export async function deleteScreenshot(formData: FormData): Promise<{ error?: string }> {
  const id = formData.get('id') as string | null;
  const filePath = formData.get('filePath') as string | null;

  if (!id || !filePath) {
    return { error: 'Missing screenshot details.' };
  }

  const supabase = createSupabaseServerActionClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: 'Not authenticated.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error('Failed to load profile role', profileError);
    return { error: 'Unable to verify permissions.' };
  }

  const isAdmin = profile?.role === 'admin';

  if (isAdmin) {
    try {
      const admin = createSupabaseAdminClient();
      const { error: deleteError } = await admin.from('screenshots').delete().eq('id', id);
      if (deleteError) {
        console.error('Admin delete failed', deleteError);
        return { error: 'Unable to delete screenshot.' };
      }
      const { error: storageError } = await admin.storage.from(SCREENSHOTS_BUCKET).remove([filePath]);
      if (storageError) {
        console.error('Admin storage delete failed', storageError);
      }
    } catch (error) {
      console.error('Admin delete exception', error);
      return { error: 'Unable to delete screenshot.' };
    }
  } else {
    const { error: deleteError } = await supabase.from('screenshots').delete().eq('id', id);
    if (deleteError) {
      console.error('Delete failed', deleteError);
      return { error: 'Unable to delete screenshot.' };
    }
    const { error: storageError } = await supabase.storage.from(SCREENSHOTS_BUCKET).remove([filePath]);
    if (storageError) {
      console.error('Storage delete failed', storageError);
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/gallery');
  return {};
}
