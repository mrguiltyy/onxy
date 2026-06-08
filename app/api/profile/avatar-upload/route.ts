import { NextResponse } from 'next/server'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Upload an avatar to profile-images bucket and return the public URL.
 * Body: FormData with `file` field.
 */
export async function POST(req: Request) {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 })

  let formData: FormData
  try { formData = await req.formData() } catch {
    return NextResponse.json({ ok: false, error: 'Bad request.' }, { status: 400 })
  }
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ ok: false, error: 'No file provided.' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: 'Max file size is 5 MB.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const path = `${user.id}/${Date.now().toString(36)}.${ext}`

  const admin = supabaseAdmin()
  const bytes = Buffer.from(await file.arrayBuffer())

  const { error } = await admin.storage.from('profile-images').upload(path, bytes, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: true,
  })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const url = `${base}/storage/v1/object/public/profile-images/${path}`
  return NextResponse.json({ ok: true, url })
}
