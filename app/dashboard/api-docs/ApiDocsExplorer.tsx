'use client'
import { useState, useMemo } from 'react'
import { Copy, Check, Play, Loader2, ChevronDown } from 'lucide-react'
import { LANGUAGES, snippet, buildUrl, type Language } from './snippets'

interface KeyOption { id: string; key_prefix: string; name: string }
interface ProductOption { id: string; name: string }

interface Endpoint {
  id:           string
  ag:           string
  name:         string
  description:  string
  params:       { name: string; type: string; required?: boolean; description: string; default?: string }[]
  destructive?: boolean
}

const ENDPOINTS: Endpoint[] = [
  {
    id: 'getsubprojects',
    ag: 'getsubprojects',
    name: 'List projects',
    description: 'Returns the products you\'re approved to resell. Use these IDs in other endpoints.',
    params: [],
  },
  {
    id: 'getbalance',
    ag: 'getbalance',
    name: 'Get wallet balance',
    description: 'Returns your current wallet balance in cents and USD.',
    params: [],
  },
  {
    id: 'getdaymaps',
    ag: 'getdaymaps',
    name: 'Get day maps',
    description: 'Returns valid duration keys (1d / 7d / 30d / lifetime) for a project. Call before createkey.',
    params: [
      { name: 'project_id', type: 'string', description: 'Product UUID (defaults to your first approved product)' },
    ],
  },
  {
    id: 'getduration',
    ag: 'getduration',
    name: 'Get duration pricing',
    description: 'Returns duration pricing config (wholesale per-key cost) for a project.',
    params: [
      { name: 'project_id', type: 'string', description: 'Product UUID (defaults to your first approved product)' },
    ],
  },
  {
    id: 'createkey',
    ag: 'createkey',
    name: 'Create license',
    description: 'Generate one or more license keys. Deducts the wholesale cost from your wallet per key.',
    destructive: true,
    params: [
      { name: 'duration',           type: 'string',  required: true, description: 'Duration key from getdaymaps (e.g. 30d)', default: '30d' },
      { name: 'project_id',         type: 'string',  description: 'Product UUID (defaults to your first approved product)' },
      { name: 'amount',             type: 'integer', description: '1-15, default 1', default: '1' },
      { name: 'hwid_lock',          type: 'integer', description: '0 or 1', default: '0' },
      { name: 'pattern',            type: 'string',  description: 'Custom key pattern (e.g. ****-****-****-****)' },
    ],
  },
  {
    id: 'keyinfo',
    ag: 'keyinfo',
    name: 'Get key info',
    description: 'Returns full info for a license you own. Use full=1 to include extended fields.',
    params: [
      { name: 'key',  type: 'string',  required: true, description: 'License key (case-insensitive)' },
      { name: 'full', type: 'integer', description: '1 to return all fields' },
    ],
  },
  {
    id: 'getkeys',
    ag: 'getkeys',
    name: 'List your keys',
    description: 'Returns paginated list of all licenses you\'ve generated.',
    params: [
      { name: 'limit',  type: 'integer', description: '1-100, default 25', default: '25' },
      { name: 'offset', type: 'integer', description: 'Pagination offset', default: '0' },
    ],
  },
  {
    id: 'banuser',
    ag: 'banuser',
    name: 'Ban a key',
    description: 'Bans a license. The customer\'s tool will be kicked at next heartbeat.',
    destructive: true,
    params: [
      { name: 'key',    type: 'string', required: true, description: 'License key' },
      { name: 'reason', type: 'string', description: 'Ban reason (shown to user)' },
    ],
  },
  {
    id: 'unbanuser',
    ag: 'unbanuser',
    name: 'Unban a key',
    description: 'Removes a ban from a license.',
    params: [
      { name: 'key', type: 'string', required: true, description: 'License key' },
    ],
  },
  {
    id: 'resethwid',
    ag: 'resethwid',
    name: 'Reset HWID',
    description: 'Clears the bound HWID. The next login binds whatever device connects.',
    destructive: true,
    params: [
      { name: 'key', type: 'string', required: true, description: 'License key' },
    ],
  },
  {
    id: 'deletekey',
    ag: 'deletekey',
    name: 'Delete a key',
    description: 'Permanently deletes a license. Cannot be undone.',
    destructive: true,
    params: [
      { name: 'key', type: 'string', required: true, description: 'License key' },
    ],
  },
]

interface Props {
  apiBase:  string
  keys:     KeyOption[]
  products: ProductOption[]
}

export function ApiDocsExplorer({ apiBase, keys, products }: Props) {
  const [activeKeyId, setActiveKeyId] = useState(keys[0]?.id ?? '')
  const [showSecret, setShowSecret] = useState(false)
  const [keySecret, setKeySecret] = useState('')   // Full key (with secret) — user pastes if they want live testing
  const [language, setLanguage]   = useState<Language>('ts')

  const sellerKeyForCode = useMemo(() => {
    if (keySecret) return keySecret
    const k = keys.find(k => k.id === activeKeyId)
    return k ? `${k.key_prefix}:[your-secret-here]` : 'ops_xxxxxxxx:[your-secret-here]'
  }, [keySecret, activeKeyId, keys])

  return (
    <div>
      {/* Top bar: key + language + project picker */}
      <div className="card p-4 mb-5 flex items-center gap-3 flex-wrap sticky top-[68px] z-10"
        style={{ background: 'rgba(19,24,38,0.92)', backdropFilter: 'blur(10px)' }}>
        {/* Key picker */}
        {keys.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-[10.5px] text-[var(--fg-mute)] uppercase tracking-wider font-bold">Key</label>
            <select value={activeKeyId} onChange={e => setActiveKeyId(e.target.value)}
              className="form-input text-[12px] py-1.5">
              {keys.map(k => (
                <option key={k.id} value={k.id}>{k.name} ({k.key_prefix})</option>
              ))}
            </select>
          </div>
        )}

        {/* Optional secret input */}
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <label className="text-[10.5px] text-[var(--fg-mute)] uppercase tracking-wider font-bold whitespace-nowrap">Secret</label>
          <input
            type={showSecret ? 'text' : 'password'}
            value={keySecret}
            onChange={e => setKeySecret(e.target.value)}
            placeholder="Paste full key to enable live tests"
            className="form-input text-[11px] font-mono py-1.5"
          />
          <button onClick={() => setShowSecret(!showSecret)}
            className="text-[10.5px] text-[var(--fg-mute)] hover:text-[var(--fg)]">
            {showSecret ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Language picker */}
        <div className="flex items-center gap-1 bg-[var(--surface-2)] rounded-md px-1 py-1">
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => setLanguage(l.code)}
              className="px-2 py-1 text-[10.5px] font-mono uppercase rounded transition-colors"
              style={{
                background: language === l.code ? 'var(--brand-faint)' : 'transparent',
                color:      language === l.code ? 'var(--brand)' : 'var(--fg-dim)',
              }}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-4">
        {ENDPOINTS.map(ep => (
          <EndpointCard
            key={ep.id}
            endpoint={ep}
            apiBase={apiBase}
            sellerKey={sellerKeyForCode}
            liveSellerKey={keySecret}
            language={language}
            products={products}
          />
        ))}
      </div>
    </div>
  )
}

function EndpointCard({
  endpoint, apiBase, sellerKey, liveSellerKey, language, products,
}: {
  endpoint:      Endpoint
  apiBase:       string
  sellerKey:     string         // The key shown in code (may be redacted)
  liveSellerKey: string         // The full key for live testing (may be empty)
  language:      Language
  products:      ProductOption[]
}) {
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {}
    for (const p of endpoint.params) if (p.default) out[p.name] = p.default
    return out
  })
  const [copied, setCopied] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult]   = useState<{ status: number; body: string } | null>(null)

  const url = buildUrl({
    endpoint: endpoint.ag,
    params:   paramValues,
    baseUrl:  apiBase,
    sellerKey: liveSellerKey || sellerKey,
  })
  const code = snippet(language, {
    endpoint: endpoint.ag,
    params:   paramValues,
    baseUrl:  apiBase,
    sellerKey,
  })

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function run() {
    setRunning(true)
    setResult(null)
    try {
      const liveUrl = buildUrl({
        endpoint: endpoint.ag,
        params:   paramValues,
        baseUrl:  apiBase,
        sellerKey: liveSellerKey,
      })
      const res = await fetch(liveUrl, { headers: { Accept: 'application/json' } })
      const body = await res.text()
      let pretty = body
      try { pretty = JSON.stringify(JSON.parse(body), null, 2) } catch {}
      setResult({ status: res.status, body: pretty })
    } catch (err) {
      setResult({ status: 0, body: err instanceof Error ? err.message : 'Network error' })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="card overflow-hidden" id={endpoint.id}>
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--hairline)' }}>
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-mono"
              style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
              GET
            </span>
            <h2 className="text-[16px] font-bold tracking-tight">{endpoint.name}</h2>
            {endpoint.destructive && (
              <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(239,68,68,0.10)', color: 'var(--bad)' }}>
                Destructive
              </span>
            )}
          </div>
        </div>
        <p className="text-[12.5px] text-[var(--fg-dim)]">{endpoint.description}</p>
        <code className="block mt-3 text-[11.5px] font-mono break-all px-3 py-2 rounded"
          style={{ background: 'var(--surface-2)', color: 'var(--fg-dim)' }}>
          {url.replace(/sellerkey=[^&]+/, 'sellerkey=•••')}
        </code>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] divide-x" style={{ borderColor: 'var(--hairline)' }}>

        {/* Parameters */}
        <div className="p-5" style={{ borderColor: 'var(--hairline)' }}>
          <p className="label-mono mb-3">Try it</p>
          {endpoint.params.length === 0 ? (
            <p className="text-[12px] text-[var(--fg-mute)]">No parameters required.</p>
          ) : (
            <div className="space-y-3">
              {endpoint.params.map(p => (
                <div key={p.name}>
                  <label className="flex items-center gap-1 form-label mb-1">
                    {p.name}
                    {p.required && <span className="text-[var(--bad)]">*</span>}
                    <span className="ml-auto text-[9.5px] font-mono text-[var(--fg-mute)]">{p.type}</span>
                  </label>
                  {p.name === 'project_id' && products.length > 0 ? (
                    <select value={paramValues[p.name] ?? ''}
                      onChange={e => setParamValues(prev => ({ ...prev, [p.name]: e.target.value }))}
                      className="form-input text-[12px] py-1.5">
                      <option value="">(default — first product)</option>
                      {products.map(prod => <option key={prod.id} value={prod.id}>{prod.name}</option>)}
                    </select>
                  ) : (
                    <input
                      type={p.type === 'integer' ? 'number' : 'text'}
                      value={paramValues[p.name] ?? ''}
                      onChange={e => setParamValues(prev => ({ ...prev, [p.name]: e.target.value }))}
                      placeholder={p.default ?? p.description.slice(0, 40)}
                      className="form-input text-[12px] py-1.5"
                    />
                  )}
                  <p className="text-[10px] text-[var(--fg-mute)] mt-0.5 leading-snug">{p.description}</p>
                </div>
              ))}
            </div>
          )}

          {endpoint.destructive && (
            <p className="text-[10.5px] text-[var(--bad)] mt-3 leading-snug">
              ⚠ This endpoint modifies data. Test carefully.
            </p>
          )}

          <button onClick={run} disabled={running || !liveSellerKey}
            className="btn btn-primary btn-sm w-full mt-4">
            {running
              ? <><Loader2 size={11} className="animate-spin" /> Running…</>
              : <><Play size={11} /> Run test</>}
          </button>
          {!liveSellerKey && (
            <p className="text-[10px] text-[var(--fg-mute)] text-center mt-1.5">
              Paste your full key in the top bar to enable
            </p>
          )}

          {result && (
            <div className="mt-4">
              <p className="text-[10.5px] font-mono uppercase tracking-wider mb-1.5"
                style={{ color: result.status >= 200 && result.status < 300 ? 'var(--ok)' : 'var(--bad)' }}>
                HTTP {result.status}
              </p>
              <pre className="text-[10.5px] font-mono leading-[1.5] p-3 rounded overflow-x-auto max-h-[300px]"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)', color: 'var(--fg-dim)' }}>
                {result.body}
              </pre>
            </div>
          )}
        </div>

        {/* Code */}
        <div>
          <div className="px-4 py-2.5 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--hairline)', background: 'var(--surface-2)' }}>
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--fg-mute)]">{language}</span>
            <button onClick={copy}
              className="text-[11px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1">
              {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
            </button>
          </div>
          <pre className="text-[11.5px] font-mono leading-[1.55] p-5 overflow-x-auto max-h-[480px]"
            style={{ background: 'var(--surface)', color: 'var(--fg-dim)' }}>
            {code}
          </pre>
        </div>
      </div>
    </div>
  )
}
