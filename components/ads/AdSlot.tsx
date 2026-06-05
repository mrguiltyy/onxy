'use client'
import { useEffect, useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

interface AdSlotProps {
  /** Unique slot identifier — must match `ad_spots.slot_key` */
  slotKey: string
  /** Optional className passed to outer wrapper */
  className?: string
  /** Fallback rendered when no active campaign exists */
  fallback?: React.ReactNode
}

interface ActiveCampaign {
  id:               string
  click_url:        string
  image_url:        string | null
  alt_text:         string | null
  advertiser_name:  string
}

/**
 * Public ad slot. Place anywhere on the site with a `slotKey`.
 *
 *   <AdSlot slotKey="hero-banner" />
 *
 * Fetches the currently active campaign for the slot, registers an
 * impression on mount, and tracks clicks. If no campaign is live,
 * renders the fallback (or nothing).
 */
export function AdSlot({ slotKey, className, fallback = null }: AdSlotProps) {
  const [campaign, setCampaign] = useState<ActiveCampaign | null>(null)
  const [loaded, setLoaded] = useState(false)
  const impressionLogged = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = supabaseBrowser()

      // Find the spot
      const { data: spot } = await supabase
        .from('ad_spots')
        .select('id, is_active')
        .eq('slot_key', slotKey)
        .single()

      if (cancelled || !spot || !(spot as { is_active: boolean }).is_active) {
        setLoaded(true)
        return
      }

      // Find the most recently-started active campaign currently in window
      const now = new Date().toISOString()
      const { data: camp } = await supabase
        .from('ad_campaigns')
        .select('id, click_url, image_url, alt_text, advertiser_name')
        .eq('spot_id', (spot as { id: string }).id)
        .eq('status', 'active')
        .lte('starts_at', now)
        .gte('ends_at',   now)
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled) return
      setCampaign(camp as ActiveCampaign | null)
      setLoaded(true)
    }

    load()
    return () => { cancelled = true }
  }, [slotKey])

  // Register impression once campaign is loaded
  useEffect(() => {
    if (!campaign || impressionLogged.current) return
    impressionLogged.current = true
    fetch(`/api/ad/${campaign.id}/impression`, { method: 'POST' }).catch(() => {})
  }, [campaign])

  const handleClick = () => {
    if (!campaign) return
    fetch(`/api/ad/${campaign.id}/click`, { method: 'POST' }).catch(() => {})
  }

  if (!loaded) {
    return <div className={className} aria-hidden="true" />
  }

  if (!campaign) {
    return <>{fallback}</>
  }

  return (
    <a
      href={campaign.click_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      className={`block relative overflow-hidden rounded-md group ${className ?? ''}`}
      style={{ border: '1px solid var(--hairline-2)' }}
    >
      {/* Sponsor label */}
      <span className="absolute top-2 right-2 z-10 font-mono text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded"
        style={{
          background:  'rgba(0,0,0,0.6)',
          color:       'var(--fg-mute)',
          backdropFilter: 'blur(4px)',
        }}
      >
        Sponsored
      </span>

      {campaign.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={campaign.image_url}
          alt={campaign.alt_text ?? campaign.advertiser_name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
        />
      ) : (
        // Text-only fallback campaign
        <div className="w-full h-full flex items-center justify-center p-6 text-center"
          style={{ background: 'var(--surface)' }}
        >
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--fg-mute)] mb-2">
              From the partner network
            </p>
            <p className="text-[var(--fg)] font-medium text-[15px]">
              {campaign.advertiser_name}
            </p>
            {campaign.alt_text && (
              <p className="text-[var(--fg-dim)] text-[13px] mt-1">{campaign.alt_text}</p>
            )}
          </div>
        </div>
      )}
    </a>
  )
}
