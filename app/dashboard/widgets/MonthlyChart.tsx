interface MonthData { month: string; count: number }

/**
 * Compact SVG line chart for monthly key generations.
 * 7 data points, animated gradient stroke.
 */
export function MonthlyChart({ data }: { data: MonthData[] }) {
  if (data.length === 0) return null

  const W = 320
  const H = 130
  const PAD_L = 26
  const PAD_R = 12
  const PAD_T = 10
  const PAD_B = 22
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B

  const max = Math.max(...data.map(d => d.count), 4)
  const min = 0

  const xStep = chartW / Math.max(1, data.length - 1)

  function xy(i: number, v: number): [number, number] {
    const x = PAD_L + i * xStep
    const y = PAD_T + chartH - ((v - min) / (max - min || 1)) * chartH
    return [x, y]
  }

  // Path
  const points = data.map((d, i) => xy(i, d.count))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const fillPath =
    `${linePath} L ${points[points.length - 1][0].toFixed(1)} ${PAD_T + chartH} L ${points[0][0].toFixed(1)} ${PAD_T + chartH} Z`

  // Y gridlines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(t => {
    const y = PAD_T + chartH - t * chartH
    const v = Math.round(min + t * (max - min))
    return { y, v }
  })

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ maxHeight: 160 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#f0a4b7" />
            <stop offset="50%"  stopColor="#c5b3df" />
            <stop offset="100%" stopColor="#a2c8ee" />
          </linearGradient>
          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(197,179,223,0.30)" />
            <stop offset="100%" stopColor="rgba(197,179,223,0.00)" />
          </linearGradient>
        </defs>

        {/* Y gridlines */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={g.y} y2={g.y} stroke="var(--hairline)" strokeWidth={0.6} strokeDasharray="2 3" />
            <text x={PAD_L - 6} y={g.y + 3} fontSize="9" fill="var(--fg-mute)" textAnchor="end" fontFamily="ui-monospace, Menlo">
              {g.v}
            </text>
          </g>
        ))}

        {/* Fill area */}
        <path d={fillPath} fill="url(#fillGrad)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={3}
            fill="var(--bg)"
            stroke="#c5b3df"
            strokeWidth="1.5"
          />
        ))}

        {/* X labels */}
        {data.map((d, i) => {
          const x = PAD_L + i * xStep
          const label = new Date(d.month + '-01').toLocaleString('en', { month: 'short' })
          return (
            <text
              key={i}
              x={x}
              y={H - 6}
              fontSize="10"
              fill="var(--fg-mute)"
              textAnchor="middle"
              fontFamily="ui-monospace, Menlo"
            >
              {label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
