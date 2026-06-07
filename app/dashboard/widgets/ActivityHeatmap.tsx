interface Day { date: string; count: number }

/**
 * GitHub-style activity heatmap.
 * Renders 53 weeks × 7 days grid of cells, color-coded by activity count.
 *
 * `days` must be exactly 365 entries oldest→newest.
 */
export function ActivityHeatmap({ days }: { days: Day[] }) {
  // Find the start of the first column so weeks align properly.
  // We render Sun..Sat. Pad the first column so its rows align with day-of-week.
  if (days.length === 0) return <p className="text-[12px] text-[var(--fg-mute)]">No data.</p>

  const firstDate = new Date(days[0].date + 'T00:00:00')
  const padding = firstDate.getUTCDay()    // 0 = Sunday

  // Build cells: padding empties + actual days
  const cells: (Day | null)[] = [
    ...Array(padding).fill(null),
    ...days,
  ]

  // Compute max for color scale
  const max = Math.max(1, ...days.map(d => d.count))

  // Split into weeks (7 per column)
  const weeks: (Day | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  function color(count: number) {
    if (count === 0) return 'var(--surface-2)'
    const ratio = Math.min(1, count / max)
    if (ratio < 0.25) return 'rgba(59,130,246,0.20)'
    if (ratio < 0.50) return 'rgba(59,130,246,0.45)'
    if (ratio < 0.75) return 'rgba(59,130,246,0.70)'
    return 'var(--brand)'
  }

  // Month labels — show the month name above the first column that starts in that month
  const monthLabels: { week: number; label: string }[] = []
  let lastMonth = -1
  for (let w = 0; w < weeks.length; w++) {
    const firstNonNull = weeks[w].find(d => d !== null) as Day | undefined
    if (!firstNonNull) continue
    const m = new Date(firstNonNull.date + 'T00:00:00').getUTCMonth()
    if (m !== lastMonth) {
      monthLabels.push({ week: w, label: new Date(0, m).toLocaleString('en', { month: 'short' }) })
      lastMonth = m
    }
  }

  const CELL = 11
  const GAP = 3
  const ROW_HEIGHT = CELL + GAP
  const COL_WIDTH = CELL + GAP

  return (
    <div className="overflow-x-auto">
      <div className="relative inline-flex flex-col gap-1" style={{ minWidth: weeks.length * COL_WIDTH + 30 }}>
        {/* Month labels row */}
        <div className="relative h-3 ml-7">
          {monthLabels.map(ml => (
            <span
              key={ml.week}
              className="absolute text-[10px] text-[var(--fg-mute)] font-mono uppercase tracking-wider"
              style={{ left: ml.week * COL_WIDTH }}
            >
              {ml.label}
            </span>
          ))}
        </div>

        {/* Day-of-week labels + grid */}
        <div className="flex gap-[3px]">
          <div className="flex flex-col gap-[3px] mr-1 text-[9.5px] text-[var(--fg-mute)] font-mono select-none" style={{ marginTop: 0 }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
              <span key={d} style={{ height: CELL, lineHeight: `${CELL}px`, visibility: i % 2 === 1 ? 'visible' : 'hidden' }}>
                {d}
              </span>
            ))}
          </div>

          {weeks.map((week, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, r) => {
                const day = week[r]
                if (!day) return <span key={r} style={{ width: CELL, height: CELL }} />
                return (
                  <span
                    key={r}
                    title={`${day.date} · ${day.count} event${day.count === 1 ? '' : 's'}`}
                    className="rounded-sm transition-colors hover:opacity-80"
                    style={{
                      width: CELL,
                      height: CELL,
                      background: color(day.count),
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
