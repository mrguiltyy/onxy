'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
        <span className="text-[10.5px] text-[var(--fg-mute)] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
          {language}
        </span>
        <button
          onClick={copy}
          className="text-[11.5px] font-medium px-2 py-1 rounded inline-flex items-center gap-1.5 transition-colors"
          style={{
            background: copied ? 'rgba(34,197,94,0.10)' : 'var(--surface-2)',
            color: copied ? 'var(--ok)' : 'var(--fg-dim)',
            border: `1px solid ${copied ? 'rgba(34,197,94,0.25)' : 'var(--hairline)'}`,
          }}
        >
          {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>
      <pre
        className="rounded-md p-4 pt-12 overflow-x-auto text-[12.5px] leading-[1.6]"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--hairline)',
          fontFamily: 'ui-monospace, SF Mono, Menlo, Consolas, monospace',
        }}
      >
        <code className="text-[var(--fg)] whitespace-pre">{code}</code>
      </pre>
    </div>
  )
}
