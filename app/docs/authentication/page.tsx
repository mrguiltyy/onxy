import { CodeBlock, Callout, MethodEndpoint } from '@/components/docs/CodeBlock'
import Link from 'next/link'

export default function AuthenticationPage() {
  return (
    <>
      <div className="mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ff3a00]">Authentication</span>
        <h1 className="text-white font-bold text-3xl tracking-tight mt-2 mb-3" style={{ letterSpacing: '-0.025em' }}>Auth Flow</h1>
        <p className="text-[#9ca3af] text-base">The single endpoint that turns a license key into an active session.</p>
      </div>

      <h2>The endpoint</h2>
      <MethodEndpoint method="POST" path="/api/license/auth" description="Authenticate a license" />

      <h2>Request</h2>
      <CodeBlock filename="POST /api/license/auth" language="json">{`{
  "licenseKey": "ONYX-R4G3-XK2M-9P7Q-LWTZ",
  "hwid":       "a3f7c9e2d8f1...",
  "toolSlug":   "onyx-rage",
  "version":    "2.1.0",
  "ip":         null
}`}</CodeBlock>

      <h3>Fields</h3>
      <ul>
        <li><code>licenseKey</code> — the 5-segment key the user purchased</li>
        <li><code>hwid</code> — SHA-256 of CPU + motherboard + disk serials (see <Link href="/docs/hwid" className="text-[#ff3a00] hover:underline">HWID Binding</Link>)</li>
        <li><code>toolSlug</code> — the product slug (e.g. <code>onyx-rage</code>)</li>
        <li><code>version</code> — your tool&apos;s embedded version constant</li>
        <li><code>ip</code> — leave null; server determines from connection</li>
      </ul>

      <h2>Successful response</h2>
      <CodeBlock filename="200 OK" language="json">{`{
  "ok": true,
  "session": {
    "token":              "sess_4f8a7c92e1...",
    "expiresAt":          "2026-06-01T18:30:00Z",
    "heartbeatInterval":  300
  },
  "user": {
    "id":       "usr_xy12abc",
    "username": "DarkByte",
    "tier":     "Gold"
  },
  "license": {
    "plan":           "1-month",
    "expiresAt":      "2026-06-30T00:00:00Z",
    "hwidSlotsUsed":  1,
    "hwidSlotsTotal": 2
  }
}`}</CodeBlock>

      <h2>What happens on the server</h2>
      <ol>
        <li>Server looks up license by key</li>
        <li>Checks: not expired, not revoked, account not banned</li>
        <li>Checks HWID: if registered → reuse, if new → claim a slot, if no slots → reject</li>
        <li>Logs IP, country, VPN check</li>
        <li>Runs flag rules (multi-country, concurrent sessions, etc.)</li>
        <li>Generates a session token (signed JWT, 5min sliding expiry)</li>
        <li>Returns session token + license metadata</li>
      </ol>

      <Callout variant="warn" title="The session token is bearer auth">
        Anyone holding the session token IS the authenticated session. Keep it in memory only. Never log it, never persist it.
      </Callout>

      <h2>Failure responses</h2>
      <p>Every failure response returns HTTP 200 with <code>ok: false</code> and a <code>code</code> you can pattern-match on:</p>
      <CodeBlock filename="example failure" language="json">{`{
  "ok": false,
  "reason": "All HWID slots are taken. Reset one via your dashboard.",
  "code":   "HWID_LIMIT"
}`}</CodeBlock>

      <p>Full error code reference in <Link href="/docs/error-handling" className="text-[#ff3a00] hover:underline">Error Handling</Link>.</p>

      <h2>Rate limits</h2>
      <p>The auth endpoint is rate-limited per IP and per license key:</p>
      <ul>
        <li><code>10 requests / minute</code> per IP</li>
        <li><code>5 failed attempts / hour</code> per license key (then 1-hour cooldown)</li>
      </ul>
      <p>Exceeding either returns <code>code: "RATE_LIMITED"</code> with HTTP 429.</p>
    </>
  )
}
