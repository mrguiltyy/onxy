import Link from 'next/link'

const items = [
  { name: 'Onyx Rage',    cat: 'Automation', ver: '2.1.0', status: 'undetected', updated: '2h ago'  },
  { name: 'Onyx Stealth', cat: 'Stealth',    ver: '1.4.2', status: 'undetected', updated: '5h ago'  },
  { name: 'Onyx Core',    cat: 'Utility',    ver: '3.0.1', status: 'undetected', updated: '1d ago'  },
  { name: 'Onyx Apex',    cat: 'Premium',    ver: '1.0.3', status: 'updating',   updated: 'now'     },
  { name: 'Onyx Pulse',   cat: 'Automation', ver: '0.9.1', status: 'beta',       updated: '3h ago'  },
  { name: 'Onyx Blade',   cat: 'Stealth',    ver: '2.4.0', status: 'undetected', updated: '8h ago'  },
  { name: 'Onyx Echo',    cat: 'Utility',    ver: '1.2.7', status: 'undetected', updated: '12h ago' },
  { name: 'Onyx Vortex',  cat: 'Premium',    ver: '1.5.2', status: 'undetected', updated: '4h ago'  },
]

const statusMap = {
  undetected: { label: 'Undetected', cls: 'status-ok'   },
  updating:   { label: 'Updating',   cls: 'status-warn' },
  detected:   { label: 'Detected',   cls: 'status-bad'  },
  beta:       { label: 'Beta',       cls: 'status-info' },
} as const

export function LiveStatus() {
  return (
    <section id="status" className="relative py-20 section-lazy bg-[#0e1119] border-y border-white/[0.04]">
      <div className="container-x">

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="status status-ok"><span className="status-dot" /> Live</span>
              <span className="text-[12px] text-[#9ca3af]">Updated 30 seconds ago</span>
            </div>
            <h2 className="text-white font-bold text-3xl md:text-4xl tracking-tight" style={{ letterSpacing: '-0.025em' }}>
              Live Product Status
            </h2>
          </div>
          <Link href="/status" className="btn btn-line">Full Status Page →</Link>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="table-onyx">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Version</th>
                <th>Last Update</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const s = statusMap[item.status as keyof typeof statusMap]
                return (
                  <tr key={item.name}>
                    <td className="text-white font-semibold">{item.name}</td>
                    <td>{item.cat}</td>
                    <td className="text-[#ff3a00] font-mono text-[13px]">v{item.ver}</td>
                    <td>{item.updated}</td>
                    <td>
                      <span className={`status ${s.cls}`}>
                        <span className="status-dot" />
                        {s.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
