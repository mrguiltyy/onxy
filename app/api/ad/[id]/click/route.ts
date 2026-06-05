import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * POST /api/ad/:id/click
 * Records a click on a sponsored slot.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
            || req.headers.get('x-real-ip')
            || '0.0.0.0'
  const userAgent = req.headers.get('user-agent')
  const referer   = req.headers.get('referer')

  const db = supabaseAdmin()

  await db.from('ad_events').insert({
    campaign_id: id,
    event_type:  'click',
    ip,
    user_agent:  userAgent,
    referer,
  } as never)

  interface CountRow { clicks_count: number }
  const { data: current } = await db
    .from('ad_campaigns')
    .select('clicks_count')
    .eq('id', id)
    .single<CountRow>()

  if (current) {
    await db
      .from('ad_campaigns')
      .update({ clicks_count: current.clicks_count + 1 } as never)
      .eq('id', id)
  }

  return NextResponse.json({ ok: true })
}
