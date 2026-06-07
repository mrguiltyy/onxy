'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'

interface Profile { role: string }

async function requireAdmin(): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }
  const { data: pRaw } = await supa.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = (pRaw as Profile | null)?.role
  if (role !== 'super_admin' && role !== 'support') return { ok: false, error: 'Admin only.' }
  return { ok: true, userId: user.id }
}

const BUCKET = 'product-images'
const SITE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

function publicUrl(path: string): string {
  // https://xxxxx.supabase.co/storage/v1/object/public/product-images/...
  return `${SITE_URL}/storage/v1/object/public/${BUCKET}/${path}`
}

export interface ProductImage {
  name:        string
  path:        string
  url:         string
  size:        number
  uploaded_at: string
}

/**
 * Upload an image to product-images bucket.
 * Accepts FormData with `file` field.
 */
export async function uploadProductImage(formData: FormData): Promise<{ ok: boolean; url?: string; error?: string }> {
  const gate = await requireAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }

  const file = formData.get('file') as File | null
  if (!file) return { ok: false, error: 'No file provided.' }
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: 'Max file size is 10 MB.' }

  // Sanitize filename → use a unique random hash + original extension
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const stamp = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 10)
  const path = `${stamp}-${rand}.${ext}`

  const admin = supabaseAdmin()
  const bytes = Buffer.from(await file.arrayBuffer())

  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    cacheControl: '31536000',  // 1 year — these are immutable
    upsert: false,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/products')
  return { ok: true, url: publicUrl(path) }
}

/**
 * List all uploaded product images (newest first).
 */
export async function listProductImages(): Promise<{ ok: boolean; images?: ProductImage[]; error?: string }> {
  const gate = await requireAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }

  const admin = supabaseAdmin()
  const { data, error } = await admin.storage.from(BUCKET).list('', {
    limit:  200,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  if (error) return { ok: false, error: error.message }

  const images: ProductImage[] = (data ?? []).map(f => ({
    name:        f.name,
    path:        f.name,
    url:         publicUrl(f.name),
    size:        (f.metadata as { size?: number } | null)?.size ?? 0,
    uploaded_at: f.created_at ?? '',
  }))

  return { ok: true, images }
}

/**
 * Delete an uploaded image.
 */
export async function deleteProductImage(path: string): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }

  if (!path || path.includes('..') || path.startsWith('/')) {
    return { ok: false, error: 'Invalid path.' }
  }

  const admin = supabaseAdmin()
  const { error } = await admin.storage.from(BUCKET).remove([path])
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/products')
  return { ok: true }
}
