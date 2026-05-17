// Upload a user-selected image to the `listing-photos` Supabase Storage
// bucket and return its public URL. Path convention is
// `{user_id}/{timestamp}-{slug}.{ext}` — RLS on the bucket enforces that
// the first path segment matches `auth.uid()`, so users can only write
// under their own folder.
//
// Returns `{ url, path }` on success, or throws with a readable message
// for the caller to surface inline.

import { supabase } from '@/lib/supabase/client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 5 * 1024 * 1024

export type UploadResult = { url: string; path: string }

export async function uploadListingPhoto(
  file: File,
  userId: string,
): Promise<UploadResult> {
  if (!supabase) throw new Error('Storage client not ready.')
  if (!ALLOWED.has(file.type)) {
    throw new Error('Use a JPG, PNG, or WebP image.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image is over 5 MB — try a smaller file.')
  }

  const ext  = file.type === 'image/png'  ? 'png'
            : file.type === 'image/webp' ? 'webp'
            : 'jpg'
  const slug = file.name
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 32)
    .replace(/^-|-$/g, '')
  const path = `${userId}/${Date.now()}-${slug || 'photo'}.${ext}`

  const { error } = await supabase
    .storage
    .from('listing-photos')
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })

  if (error) {
    // RLS rejection / bucket missing / size cap — surface the message.
    throw new Error(error.message || 'Upload failed.')
  }

  const url = `${SUPABASE_URL}/storage/v1/object/public/listing-photos/${path}`
  return { url, path }
}
