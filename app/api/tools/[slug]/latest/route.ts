import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/tools/:slug/latest
 *
 * Public manifest endpoint — tools call this on launch (before auth)
 * to decide whether to download a newer version.
 */
export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  interface ProductRow {
    current_version:  string | null
    current_file_key: string | null
    current_sha256:   string | null
    force_update:     boolean
    is_active:        boolean
  }

  const { data: product } = await supabaseAdmin()
    .from('products')
    .select('current_version, current_file_key, current_sha256, force_update, is_active')
    .eq('slug', slug)
    .single<ProductRow>()

  if (!product) {
    return NextResponse.json({ ok: false, code: 'NOT_FOUND' }, { status: 404 })
  }

  if (!product.is_active) {
    return NextResponse.json({
      ok:     false,
      code:   'PRODUCT_INACTIVE',
      reason: 'This tool is no longer available.',
    }, { status: 410 })
  }

  return NextResponse.json({
    ok:       true,
    version:  product.current_version,
    sha256:   product.current_sha256,
    url:      product.current_file_key,
    required: product.force_update,
  })
}
