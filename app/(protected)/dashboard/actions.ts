"use server";

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/lib/supabase/database.types';
import { SCREENSHOTS_BUCKET } from '@/lib/constants';
import { createSupabaseServerActionClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { triggerOCRProcessing } from '@/lib/ocr-utils';

export type UploadState = {
  error?: string;
  success?: string;
};

type ScreenshotInsert = Database['public']['Tables']['screenshots']['Insert'];
type ProfileRole = Pick<Database['public']['Tables']['profiles']['Row'], 'role'>;
type GuildMemberRow = Pick<Database['public']['Tables']['guild_members']['Row'], 'guild_id'>;

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

  // Get user's primary guild
  const { data: guildMemberships } = await supabase
    .from('guild_members')
    .select('guild_id')
    .eq('user_id', session.user.id)
    .limit(1);

  const typedGuildMemberships = guildMemberships as GuildMemberRow[] | null;
  const guildId = typedGuildMemberships && typedGuildMemberships.length > 0 
    ? typedGuildMemberships[0].guild_id 
    : null;

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

    const record: ScreenshotInsert = {
      user_id: session.user.id,
      guild_id: guildId,
      file_path: filePath,
      label,
      processing_status: 'pending'
    };

    // Type assertion needed due to Supabase client type resolution
    const insertResult = await supabase
      .from('screenshots')
      .insert(record as never)
      .select();

    if (insertResult.error) {
      console.error('Metadata insert failed', insertResult.error);
      await supabase.storage.from(SCREENSHOTS_BUCKET).remove([filePath]);
      return { error: 'Unable to save screenshot. Please try again.' };
    }

    // Get the inserted record ID
    type ScreenshotRow = Database['public']['Tables']['screenshots']['Row'];
    const insertedRecord = (insertResult.data?.[0] as ScreenshotRow | undefined);
    if (insertedRecord?.id) {
      // Trigger OCR processing in the background
      const signedUrl = await supabase.storage
        .from(SCREENSHOTS_BUCKET)
        .createSignedUrl(filePath, 60 * 60)
        .then(result => result.data?.signedUrl);

      if (signedUrl) {
        triggerOCRProcessing(insertedRecord.id, signedUrl).catch(error => {
          console.error('Failed to trigger OCR:', error);
          // Don't fail the upload if OCR fails
        });
      }
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

  const { data: rawProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error('Failed to load profile role', profileError);
    return { error: 'Unable to verify permissions.' };
  }

  const profile = rawProfile as ProfileRole | null;
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
