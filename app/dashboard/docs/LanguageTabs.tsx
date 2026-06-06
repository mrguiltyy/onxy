'use client'
import { useState } from 'react'
import { FileCode, Package } from 'lucide-react'
import { CodeBlock } from './CodeBlock'
import { LANGUAGES, LANGUAGE_ORDER, type Language, type LanguageSnippet } from './snippets'

interface Props {
  selectedAppId: string
  baseUrl:       string
}

export function LanguageTabs({ selectedAppId, baseUrl }: Props) {
  const [active, setActive] = useState<Language>('csharp')

  const lang: LanguageSnippet = LANGUAGES[active]

  const fill = (s: string) => s
    .replace(/__APP_ID__/g, selectedAppId)
    .replace(/__BASE_URL__/g, baseUrl)
    .replace(/__HOSTNAME__/g, baseUrl.replace(/^https?:\/\//, '').split('/')[0])

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5 -mt-1">
        {LANGUAGE_ORDER.map(key => {
          const l = LANGUAGES[key]
          const isActive = key === active
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className="px-3 py-1.5 rounded-md text-[12.5px] font-medium border transition-colors"
              style={{
                background:  isActive ? 'var(--brand-faint)' : 'transparent',
                color:       isActive ? 'var(--brand)'      : 'var(--fg-dim)',
                borderColor: isActive ? 'rgba(59,130,246,0.30)' : 'var(--hairline)',
              }}
            >
              {l.name}
            </button>
          )
        })}
      </div>

      {/* Install / notes (if present) */}
      {(lang.install || lang.notes) && (
        <div
          className="rounded-md p-3 mb-4 flex items-start gap-3"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}
        >
          <Package size={14} className="text-[var(--brand)] mt-0.5 shrink-0" />
          <div className="text-[12.5px] text-[var(--fg-dim)] leading-relaxed">
            {lang.install && (
              <p>
                <span className="text-[var(--fg-mute)]">Install: </span>
                <code className="font-mono text-[var(--brand)]">{lang.install}</code>
              </p>
            )}
            {lang.notes && <p className="mt-1">{lang.notes}</p>}
          </div>
        </div>
      )}

      {/* SDK file */}
      <div className="mb-2 flex items-center gap-2 text-[12px] text-[var(--fg-dim)]">
        <FileCode size={12} className="text-[var(--brand)]" />
        <span>SDK · save as</span>
        <code className="font-mono text-[var(--brand)]">{lang.filename}</code>
      </div>
      <CodeBlock language={lang.ext} code={fill(lang.sdk)} />

      {/* Usage example */}
      <div className="mt-5 mb-2 flex items-center gap-2 text-[12px] text-[var(--fg-dim)]">
        <FileCode size={12} className="text-[var(--brand)]" />
        <span>Usage example</span>
      </div>
      <CodeBlock language={lang.ext} code={fill(lang.usage)} />
    </div>
  )
}
