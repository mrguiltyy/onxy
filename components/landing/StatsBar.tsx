import { TrendingUp, Shield, Clock, Award } from 'lucide-react'

const stats = [
  { value: '1,248+', label: 'Customers',  icon: TrendingUp, color: '#ff3a00' },
  { value: '892',    label: 'Licenses',   icon: Award,      color: '#ff5b75' },
  { value: '47d',    label: 'No incident',icon: Shield,     color: '#5fcb88' },
  { value: '<12ms',  label: 'Auth time',  icon: Clock,      color: '#ffae50' },
]

export function StatsBar() {
  return (
    <section className="relative py-10 border-y border-white/[0.04] section-lazy" style={{ background: '#070a10' }}>

      {/* Shimmer borders */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,58,0,0.25)] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,58,0,0.12)] to-transparent" />

      <div className="container-x">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.04] rounded-xl overflow-hidden border border-white/[0.04]">
          {stats.map(s => {
            const I = s.icon
            return (
              <div key={s.label} className="relative bg-[#0a0d14] p-5 group hover:bg-[#0e1119] transition-colors duration-300">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 50%, ${s.color}10, transparent 70%)` }}
                />
                <div className="relative flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                    <I size={15} style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-white text-xl font-bold leading-none" style={{ letterSpacing: '-0.025em' }}>{s.value}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold mt-1">{s.label}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
