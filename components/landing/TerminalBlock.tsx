'use client'
import { useEffect, useState } from 'react'

interface Line {
  delay: number
  type:  'cmd' | 'wait' | 'ok' | 'warn' | 'meta' | 'arrow'
  text:  string
}

const sequence: Line[] = [
  { delay: 0,    type: 'cmd',   text: 'onyx auth --license ONYX-R4G3-XK2M-9P7Q-LWTZ'                  },
  { delay: 350,  type: 'wait',  text: 'establishing tls 1.3 session'                                    },
  { delay: 700,  type: 'ok',    text: 'license verified · plan: 1-month · expires Jul 1, 2026'         },
  { delay: 950,  type: 'wait',  text: 'computing hardware fingerprint'                                  },
  { delay: 1200, type: 'ok',    text: 'hwid bound · slot 1 of 2'                                        },
  { delay: 1450, type: 'wait',  text: 'fetching manifest'                                               },
  { delay: 1700, type: 'ok',    text: 'binary v2.1.0 sha256 verified'                                   },
  { delay: 1950, type: 'meta',  text: 'session token · sess_4f8a7c92e1...'                              },
  { delay: 2200, type: 'meta',  text: 'heartbeat every 300s · expires in 5m'                            },
  { delay: 2500, type: 'arrow', text: 'access granted'                                                  },
]

export function TerminalBlock() {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    const timers = sequence.map((line, i) =>
      setTimeout(() => setShown(i + 1), line.delay + 300)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  const colorFor = (type: Line['type']) => {
    switch (type) {
      case 'cmd':   return 'var(--fg)'
      case 'wait':  return 'var(--fg-mute)'
      case 'ok':    return 'var(--ok)'
      case 'warn':  return 'var(--warn)'
      case 'meta':  return 'var(--fg-dim)'
      case 'arrow': return 'var(--c)'
    }
  }

  const prefixFor = (type: Line['type']) => {
    switch (type) {
      case 'cmd':   return <span style={{ color: 'var(--c)' }}>$ </span>
      case 'wait':  return <span style={{ color: 'var(--fg-faint)' }}>→ </span>
      case 'ok':    return <span style={{ color: 'var(--ok)' }}>✓ </span>
      case 'warn':  return <span style={{ color: 'var(--warn)' }}>! </span>
      case 'meta':  return <span style={{ color: 'var(--fg-faint)' }}># </span>
      case 'arrow': return <span style={{ color: 'var(--c)' }}>▸ </span>
    }
  }

  return (
    <div className="font-mono"
      style={{
        background: '#050505',
        border: '1px solid var(--hairline)',
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      {/* Window chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--hairline)]" style={{ background: '#0a0a0a' }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#3a3a3a' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#3a3a3a' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#3a3a3a' }} />
        </div>
        <span className="text-[10.5px] tracking-[0.16em] uppercase text-[var(--fg-mute)]">
          onyx-auth · live trace
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ok)' }} />
          <span className="text-[10px] uppercase tracking-widest text-[var(--ok)]">live</span>
        </div>
      </div>

      {/* Output */}
      <div className="p-5 text-[12.5px] leading-[1.85] min-h-[300px]">
        {sequence.slice(0, shown).map((line, i) => (
          <div key={i} style={{ color: colorFor(line.type) }}>
            {prefixFor(line.type)}
            {line.text}
            {i === shown - 1 && shown < sequence.length && (
              <span className="inline-block w-2 h-3 ml-1 align-middle" style={{ background: 'var(--c)', animation: 'blink 1s steps(1) infinite' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
