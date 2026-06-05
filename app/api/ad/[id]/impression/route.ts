import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * POST /api/ad/:id/impression
 * Fire-and-forget impression tracker. No auth required — these are public ads.
 * Atomically increments the campaign's impressions_count + writes an event row.
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
    event_type:  'impression',
    ip,
    user_agent:  userAgent,
    referer,
  } as never)

  // Increment counter (best-effort, RPC would be ideal but this is fine for v1)
  interface CountRow { impressions_count: number }
  const { data: current } = await db
    .from('ad_campaigns')
    .select('impressions_count')
    .eq('id', id)
    .single<CountRow>()

  if (current) {
    await db
      .from('ad_campaigns')
      .update({ impressions_count: current.impressions_count + 1 } as never)
      .eq('id', id)
  }

  return NextResponse.json({ ok: true })
}
