import Link from 'next/link'

export interface Product {
  slug:     string
  name:     string
  category: string
  version:  string
  price:    number
  status:   'undetected' | 'updating' | 'detected' | 'beta'
  lastUpdated: string
  artMesh?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  accent?: string
}

const statusMap = {
  undetected: { label: 'Undetected', cls: 'status-ok'   },
  updating:   { label: 'Updating',   cls: 'status-warn' },
  detected:   { label: 'Detected',   cls: 'status-bad'  },
  beta:       { label: 'Beta',       cls: 'status-info' },
} as const

export function ProductCard({ p }: { p: Product }) {
  const s     = statusMap[p.status]
  const mesh  = p.artMesh ?? 1
  const accent = p.accent ?? '#ff3a00'

  return (
    <Link href={`/shop/${p.slug}`} className="card-glow-hover card overflow-hidden flex flex-col group">

      {/* RICH product artwork */}
      <div className="relative aspect-[5/3] overflow-hidden">

        {/* Base mesh gradient */}
        <div className={`absolute inset-0 art-mesh art-mesh-${mesh} art-grain`} />

        {/* Concentric rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] rounded-full pointer-events-none"
          style={{ border: `1px solid ${accent}25` }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] rounded-full pointer-events-none"
          style={{ border: `1px solid ${accent}40` }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] rounded-full pointer-events-none"
          style={{ border: `1px solid ${accent}55` }}
        />

        {/* Center orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-700 group-hover:scale-110">
          <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${accent}66 100%)`,
              boxShadow: `0 12px 40px ${accent}55, inset 0 2px 8px rgba(255,255,255,0.3)`,
            }}
          >
            {/* Inner highlight */}
            <div className="absolute top-1.5 left-1.5 right-3 h-1/3 rounded-xl opacity-50"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.45), transparent)' }}
            />
            <span className="relative text-2xl font-black text-white" style={{ letterSpacing: '-0.04em', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              {p.name.replace('Onyx ', '').slice(0, 2).toUpperCase()}
            </span>
          </div>

          {/* Glow underneath */}
          <div className="absolute inset-0 rounded-2xl blur-2xl opacity-60 -z-10" style={{ background: accent }} />
        </div>

        {/* Decorative dots */}
        {[
          { top: '20%', left: '15%' },
          { top: '78%', left: '25%' },
          { top: '25%', right: '18%' },
          { top: '75%', right: '15%' },
        ].map((pos, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full" style={{
            ...pos,
            background: accent,
            boxShadow: `0 0 6px ${accent}`,
            opacity: 0.7,
          }} />
        ))}

        {/* Diagonal accent line */}
        <div className="absolute -top-20 -right-20 w-40 h-40 transform rotate-45 pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}12, transparent)` }}
        />

        {/* Status & version badges */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`status ${s.cls}`}>
            <span className="status-dot" />
            {s.label}
          </span>
        </div>
        <div className="absolute top-3 right-3 z-10">
          <span className="status status-mute backdrop-blur-md">v{p.version}</span>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #141823, transparent)' }}
        />
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col gap-3">

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">{p.category}</span>
            <h3 className="text-white font-bold text-base leading-tight mt-0.5 truncate group-hover:text-[#ff3a00] transition-colors duration-200">
              {p.name}
            </h3>
          </div>
        </div>

        <p className="text-xs text-[#6b7280]">Updated {p.lastUpdated}</p>

        <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-white/[0.04]">
          <div className="price-chip">
            <span className="price-chip-amount">${(p.price / 100).toFixed(2)}</span>
            <span className="price-chip-period">/mo</span>
          </div>
          <span className="text-[#ff3a00] text-[13px] font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            View →
          </span>
        </div>
      </div>
    </Link>
  )
}
