'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  language?: string
  filename?: string
  children:  string
}

export function CodeBlock({ language = 'csharp', filename, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-xl bg-[#06080d] border border-white/[0.06] overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e1119] border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          {filename && <span className="text-[12px] font-mono text-[#d4d4d8]">{filename}</span>}
          {!filename && <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider">{language}</span>}
        </div>
        <button onClick={copy} className="flex items-center gap-1.5 text-[11px] text-[#9ca3af] hover:text-[#ff3a00] transition-colors">
          {copied
            ? <><Check size={12} className="text-[#5fcb88]" /> Copied</>
            : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      <pre className="px-5 py-4 overflow-x-auto text-[12.5px] leading-[1.75] font-mono text-[#d4d4d8] m-0">
        <code>{children}</code>
      </pre>
    </div>
  )
}

interface MethodEndpointProps {
  method:   'GET' | 'POST' | 'PUT' | 'DELETE'
  path:     string
  description?: string
}

export function MethodEndpoint({ method, path, description }: MethodEndpointProps) {
  const cls = method === 'GET' ? 'method-get' : method === 'POST' ? 'method-post' : method === 'PUT' ? 'method-put' : 'method-del'
  return (
    <div className="flex items-center gap-3 my-3 p-3 bg-[#0e1119] border border-white/[0.04] rounded-lg">
      <span className={`method-badge ${cls}`}>{method}</span>
      <code className="font-mono text-sm text-[#ff3a00] flex-1">{path}</code>
      {description && <span className="text-xs text-[#9ca3af]">{description}</span>}
    </div>
  )
}

interface CalloutProps {
  variant?: 'info' | 'warn' | 'success' | 'danger'
  title?:   string
  children: React.ReactNode
}

export function Callout({ variant = 'info', title, children }: CalloutProps) {
  const colorMap = {
    info:    { border: 'rgba(91,141,239,0.2)',  bg: 'rgba(91,141,239,0.05)',  fg: '#5b8def' },
    warn:    { border: 'rgba(255,174,80,0.2)',  bg: 'rgba(255,174,80,0.05)',  fg: '#ffae50' },
    success: { border: 'rgba(95,203,136,0.2)',   bg: 'rgba(95,203,136,0.05)',   fg: '#5fcb88' },
    danger:  { border: 'rgba(255,91,117,0.2)',   bg: 'rgba(255,91,117,0.05)',   fg: '#ff5b75' },
  }[variant]

  return (
    <div className="my-4 rounded-lg p-4 border" style={{ borderColor: colorMap.border, background: colorMap.bg }}>
      {title && <p className="font-semibold text-[14px] mb-1" style={{ color: colorMap.fg }}>{title}</p>}
      <div className="text-[13.5px] text-[#d4d4d8] leading-relaxed">{children}</div>
    </div>
  )
}
