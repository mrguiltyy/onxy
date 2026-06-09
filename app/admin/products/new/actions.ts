'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'

interface Profile { role: string }

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

export async function createProductSimple(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const { data: pRaw } = await supa.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = (pRaw as Profile | null)?.role
  if (role !== 'super_admin') return { ok: false, error: 'Admin only.' }

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { ok: false, error: 'Name required.' }
  const slug = slugify(name)
  if (!slug) return { ok: false, error: 'Could not derive a URL slug from the name.' }

  const priceLifetime = parseInt(String(formData.get('price_lifetime') ?? '0'), 10) || 0
  if (priceLifetime <= 0) return { ok: false, error: 'Set a price greater than 0.' }
  const resellerPriceLifetime = parseInt(String(formData.get('reseller_price_lifetime') ?? '0'), 10) || Math.round(priceLifetime * 0.25)

  const tagline       = String(formData.get('tagline') ?? '').trim() || null
  const productType   = String(formData.get('product_type') ?? 'tool').trim() || 'tool'
  const imageUrl      = String(formData.get('image_url') ?? '').trim() || null
  const description   = String(formData.get('description') ?? '').trim() || null
  const featuresText  = String(formData.get('features') ?? '').trim()
  const features      = featuresText ? featuresText.split('\n').map(s => s.trim()).filter(Boolean) : []

  const admin = supabaseAdmin()
  const { error } = await admin.from('products').insert({
    slug,
    name,
    tagline,
    description,
    product_type:           productType,
    category:               'tool',
    image_url:              imageUrl,
    price_lifetime:         priceLifetime,
    reseller_price_lifetime: resellerPriceLifetime,
    features,
    status:                 'active',
    featured:               false,
    reseller_open:          true,
    lifetime_support:       true,
  } as never)

  if (error) {
    if (error.code === '23505') return { ok: false, error: `A product with the slug "${slug}" already exists. Pick a different name.` }
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/products')
  revalidatePath('/products')
  return { ok: true }
}
