'use client'
import { useState, useEffect, useRef, useTransition, useMemo } from 'react'
import { Wand2, Download, Loader2, Check, Sparkles } from 'lucide-react'
import { uploadProductImage } from './image-actions'

interface Props {
  onGenerated: (url: string) => void
}

const PRESETS: { id: string; name: string; bg: string; bg2: string; tint: string }[] = [
  { id: 'tech-blue',    name: 'Tech Blue',     bg: '#0a0d14',    bg2: '#1a3050', tint: 'rgba(96,165,250,0.30)' },
  { id: 'tech-pink',    name: 'Pastel Pink',   bg: '#1a0a14',    bg2: '#3a1a2e', tint: 'rgba(240,164,183,0.25)' },
  { id: 'sunset',       name: 'Sunset',        bg: '#1c0a14',    bg2: '#3a1a14', tint: 'rgba(250,180,120,0.20)' },
  { id: 'midnight',     name: 'Midnight',      bg: '#050810',    bg2: '#0a1424', tint: 'rgba(150,180,220,0.20)' },
  { id: 'forest',       name: 'Forest',        bg: '#0a140a',    bg2: '#1a2818', tint: 'rgba(110,200,140,0.22)' },
  { id: 'rose',         name: 'Rose',          bg: '#1a0a14',    bg2: '#3a1828', tint: 'rgba(255,160,200,0.20)' },
]

const LAYOUTS: { id: string; name: string }[] = [
  { id: 'split',  name: 'Split (left visual + right text)' },
  { id: 'center', name: 'Centered headline' },
  { id: 'right',  name: 'Right text, left blank' },
]

export function BannerGenerator({ onGenerated }: Props) {
  const [topLine, setTopLine] = useState('PERM')
  const [bottomLine, setBottomLine] = useState('SPOOFER')
  const [preset, setPreset] = useState('tech-blue')
  const [layout, setLayout] = useState('split')
  const [visualUrl, setVisualUrl] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const palette = useMemo(() => PRESETS.find(p => p.id === preset) ?? PRESETS[0], [preset])

  // Re-render the canvas every time inputs change
  useEffect(() => {
    drawBanner()
  }, [topLine, bottomLine, preset, layout, visualUrl])      // eslint-disable-line react-hooks/exhaustive-deps

  function drawBanner() {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = canvas.width
    const H = canvas.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, palette.bg)
    grad.addColorStop(1, palette.bg2)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Optional visual on the left
    if (layout === 'split' && visualUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const visualW = W * 0.55
        // Cover-fit
        const r = Math.max(visualW / img.naturalWidth, H / img.naturalHeight)
        const dw = img.naturalWidth * r
        const dh = img.naturalHeight * r
        const dx = (visualW - dw) / 2
        const dy = (H - dh) / 2
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, visualW, H)
        ctx.clip()
        ctx.drawImage(img, dx, dy, dw, dh)
        ctx.restore()

        // Dark veil over visual
        const veil = ctx.createLinearGradient(0, 0, visualW, 0)
        veil.addColorStop(0, 'rgba(0,0,0,0.30)')
        veil.addColorStop(1, 'rgba(0,0,0,0.70)')
        ctx.fillStyle = veil
        ctx.fillRect(0, 0, visualW, H)

        // Color tint over visual
        ctx.fillStyle = palette.tint
        ctx.fillRect(0, 0, visualW, H)

        drawText(ctx, W, H)
      }
      img.onerror = () => { drawText(ctx, W, H) }
      img.src = visualUrl
    } else {
      // Add atmospheric grain
      addNoiseOverlay(ctx, W, H, 0.04)
      // Tint orb in the corner
      const orb = ctx.createRadialGradient(W * 0.85, H * 0.5, 0, W * 0.85, H * 0.5, W * 0.4)
      orb.addColorStop(0, palette.tint)
      orb.addColorStop(1, 'transparent')
      ctx.fillStyle = orb
      ctx.fillRect(0, 0, W, H)

      drawText(ctx, W, H)
    }
  }

  function drawText(ctx: CanvasRenderingContext2D, W: number, H: number) {
    // Text positioning
    let textX: number
    let textAlign: CanvasTextAlign

    if (layout === 'center') {
      textX = W / 2
      textAlign = 'center'
    } else if (layout === 'split') {
      // text on the right
      textX = W * 0.55 + (W * 0.45) / 2
      textAlign = 'center'
    } else {
      // right
      textX = W * 0.70
      textAlign = 'center'
    }

    ctx.textAlign = textAlign
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0,0,0,0.60)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 2

    // Top line — smaller
    const topSize = Math.floor(H * 0.18)
    ctx.font = `900 ${topSize}px Inter, system-ui, sans-serif`
    ctx.fillStyle = '#ffffff'
    if (topLine) ctx.fillText(topLine.toUpperCase(), textX, H * 0.36)

    // Bottom line — bigger
    const bottomSize = Math.floor(H * 0.30)
    ctx.font = `900 ${bottomSize}px Inter, system-ui, sans-serif`
    if (bottomLine) ctx.fillText(bottomLine.toUpperCase(), textX, H * 0.62)

    // Small accent underline below bottom line
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
    const lineWidth = Math.min(W * 0.18, 200)
    const tm = ctx.measureText(bottomLine.toUpperCase())
    const accentX = textX - (textAlign === 'center' ? lineWidth / 2 : tm.width / 2)
    ctx.fillStyle = palette.tint.replace(/[\d.]+\)/, '1)')
    ctx.fillRect(accentX, H * 0.78, lineWidth, 3)
  }

  function addNoiseOverlay(ctx: CanvasRenderingContext2D, W: number, H: number, intensity: number) {
    const imageData = ctx.getImageData(0, 0, W, H)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 255 * intensity
      data[i]     = Math.min(255, Math.max(0, data[i] + noise))
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise))
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise))
    }
    ctx.putImageData(imageData, 0, 0)
  }

  async function generateAndUpload() {
    setError(null)
    setDone(false)
    const canvas = canvasRef.current
    if (!canvas) return

    // Re-draw fresh in case
    drawBanner()
    // Wait a tick for any async image load to complete
    await new Promise(r => setTimeout(r, visualUrl ? 600 : 50))
    drawBanner()
    await new Promise(r => setTimeout(r, visualUrl ? 200 : 0))

    start(async () => {
      try {
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png', 0.95))
        if (!blob) { setError('Could not export image.'); return }

        const file = new File([blob], `${(topLine + '-' + bottomLine).toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' })
        const fd = new FormData()
        fd.append('file', file)
        const res = await uploadProductImage(fd)
        if (!res.ok) { setError(res.error ?? 'Upload failed.'); return }
        if (res.url) {
          onGenerated(res.url)
          setDone(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error.')
      }
    })
  }

  function downloadLocal() {
    const canvas = canvasRef.current
    if (!canvas) return
    drawBanner()
    setTimeout(() => {
      const link = document.createElement('a')
      link.download = `${(topLine + '-' + bottomLine).toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }, visualUrl ? 600 : 100)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Wand2 size={13} className="text-[var(--brand)]" />
        <p className="text-[12.5px] font-semibold">Generate a hero banner</p>
        <span className="ml-auto text-[10px] uppercase tracking-wider font-mono text-[var(--fg-mute)]">1920×1080 PNG</span>
      </div>

      {/* Live preview */}
      <div className="rounded-md overflow-hidden mb-4 relative" style={{ background: '#000', border: '1px solid var(--hairline)' }}>
        <canvas ref={canvasRef} width={1920} height={1080} className="w-full block" style={{ aspectRatio: '16/9' }} />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="form-label">Top line</label>
          <input
            type="text"
            value={topLine}
            onChange={e => setTopLine(e.target.value.slice(0, 20))}
            placeholder="PERM"
            className="form-input font-mono uppercase"
            maxLength={20}
          />
        </div>
        <div>
          <label className="form-label">Bottom line (large)</label>
          <input
            type="text"
            value={bottomLine}
            onChange={e => setBottomLine(e.target.value.slice(0, 20))}
            placeholder="SPOOFER"
            className="form-input font-mono uppercase"
            maxLength={20}
          />
        </div>
        <div>
          <label className="form-label">Color preset</label>
          <select value={preset} onChange={e => setPreset(e.target.value)} className="form-input">
            {PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Layout</label>
          <select value={layout} onChange={e => setLayout(e.target.value)} className="form-input">
            {LAYOUTS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="form-label">Background visual URL (optional)</label>
          <input
            type="url"
            value={visualUrl}
            onChange={e => setVisualUrl(e.target.value)}
            placeholder="https://example.com/motherboard.jpg (paste any image URL)"
            className="form-input"
          />
          <p className="text-[10.5px] text-[var(--fg-mute)] mt-1">
            Used as the background visual on the left in &quot;Split&quot; layout. Leave blank for solid background.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-5 flex-wrap">
        <button type="button" onClick={generateAndUpload} disabled={pending} className="btn btn-primary">
          {pending
            ? <><Loader2 size={13} className="animate-spin" /> Generating &amp; uploading…</>
            : done
              ? <><Check size={13} /> Uploaded — use this</>
              : <><Sparkles size={13} /> Generate &amp; save to library</>}
        </button>
        <button type="button" onClick={downloadLocal} disabled={pending} className="btn btn-secondary btn-sm">
          <Download size={11} /> Download only
        </button>
        {error && <p className="text-[12px] text-[var(--bad)] basis-full">{error}</p>}
      </div>
    </div>
  )
}
