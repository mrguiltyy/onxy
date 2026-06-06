'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'

interface Profile { role: string }

async function requireAdmin() {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not signed in.' }
  const { data: pRaw } = await supa.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = (pRaw as Profile | null)?.role
  if (role !== 'super_admin') return { ok: false as const, error: 'Admin only.' }
  return { ok: true as const, userId: user.id }
}

interface SavePagePayload {
  id?:               string
  slug:              string
  title:             string
  subtitle:          string | null
  body:              string
  page_type:         string
  status:            string
  featured:          boolean
  meta_title:        string
  meta_description:  string
  meta_keywords:     string    // comma-separated
  og_image_url:      string
}

export async function savePage(p: SavePagePayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  const gate = await requireAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }

  if (!p.title || !p.slug || !p.body) {
    return { ok: false, error: 'Title, slug, and body are required.' }
  }
  if (!['page','faq','blog','announcement','giveaway'].includes(p.page_type)) {
    return { ok: false, error: 'Invalid page type.' }
  }
  if (!['draft','published','archived'].includes(p.status)) {
    return { ok: false, error: 'Invalid status.' }
  }

  const admin = supabaseAdmin()
  const payload = {
    slug:        p.slug.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 64),
    page_type:   p.page_type,
    title:       p.title.trim(),
    subtitle:    p.subtitle ? p.subtitle.trim() : null,
    body:        p.body,
    status:      p.status,
    featured:    p.featured,
    meta_title:       p.meta_title.trim()       || null,
    meta_description: p.meta_description.trim() || null,
    meta_keywords:    p.meta_keywords ? p.meta_keywords.split(',').map(s => s.trim()).filter(Boolean) : [],
    og_image_url:     p.og_image_url.trim() || null,
    updated_at:       new Date().toISOString(),
    published_at:     p.status === 'published' ? new Date().toISOString() : null,
    author_id:        gate.userId,
  }

  if (p.id) {
    const { error } = await admin.from('cms_pages').update(payload as never).eq('id', p.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/pages')
    revalidatePath(`/admin/pages/${p.id}`)
    revalidatePath(`/${p.page_type === 'page' ? '' : p.page_type + '/'}${payload.slug}`)
    return { ok: true, id: p.id }
  } else {
    const { data: insRaw, error } = await admin.from('cms_pages').insert(payload as never).select('id').single()
    if (error) {
      if (error.code === '23505') return { ok: false, error: `A page with slug "${payload.slug}" already exists.` }
      return { ok: false, error: error.message }
    }
    const id = (insRaw as { id: string }).id
    revalidatePath('/admin/pages')
    return { ok: true, id }
  }
}

export async function deletePage(id: string) {
  const gate = await requireAdmin()
  if (!gate.ok) return
  const admin = supabaseAdmin()
  await admin.from('cms_pages').delete().eq('id', id)
  revalidatePath('/admin/pages')
  redirect('/admin/pages')
}
