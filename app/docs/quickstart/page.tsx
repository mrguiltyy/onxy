import { CodeBlock, Callout, MethodEndpoint } from '@/components/docs/CodeBlock'
import Link from 'next/link'

export default function QuickStartPage() {
  return (
    <>
      <div className="mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ff3a00]">Getting Started</span>
        <h1 className="text-white font-bold text-3xl tracking-tight mt-2 mb-3" style={{ letterSpacing: '-0.025em' }}>Quick Start</h1>
        <p className="text-[#9ca3af] text-base">Authenticate your tool against the Onyx license server in under 10 minutes.</p>
      </div>

      <Callout variant="info" title="Before you start">
        You need an active Onyx account and at least one product configured in your <Link href="/admin/products" className="underline">admin panel</Link>. Each product has its own API key. The user&apos;s license key is what the tool will validate against.
      </Callout>

      <h2>The flow at a glance</h2>
      <ol>
        <li>Tool launches → collects HWID</li>
        <li>Tool sends license key + HWID to <code>/api/license/auth</code></li>
        <li>Server validates and returns a session token</li>
        <li>Tool stores session token in memory only</li>
        <li>Tool pings <code>/api/license/heartbeat</code> every 5 minutes</li>
        <li>If heartbeat fails 3 times → tool shuts down</li>
      </ol>

      <h2>1. Get your endpoint URLs</h2>
      <p>The license server lives at the same host as your store. All endpoints are JSON over HTTPS.</p>
      <MethodEndpoint method="POST" path="https://onyx.gg/api/license/auth"      description="Authenticate"  />
      <MethodEndpoint method="POST" path="https://onyx.gg/api/license/heartbeat" description="Keep alive"    />
      <MethodEndpoint method="GET"  path="https://onyx.gg/api/tools/:slug/latest" description="Auto-update"   />

      <h2>2. Authenticate on tool launch</h2>
      <p>Send a POST request with the user&apos;s license key and your generated HWID hash.</p>
      <CodeBlock filename="auth-request.json" language="json">{`POST /api/license/auth
Content-Type: application/json

{
  "licenseKey": "ONYX-R4G3-XK2M-9P7Q-LWTZ",
  "hwid":       "a3f7c9e2d8f1...",
  "toolSlug":   "onyx-rage",
  "version":    "2.1.0"
}`}</CodeBlock>

      <p>Successful response:</p>
      <CodeBlock filename="auth-response.json" language="json">{`{
  "ok": true,
  "session": {
    "token":              "sess_4f8a7c...d2e1b8",
    "expiresAt":          "2026-06-01T18:30:00Z",
    "heartbeatInterval":  300
  },
  "user": {
    "id":       "usr_xy12",
    "username": "DarkByte",
    "tier":     "Gold"
  },
  "license": {
    "plan":     "1-month",
    "expiresAt":"2026-06-30T00:00:00Z",
    "hwidSlotsUsed":  1,
    "hwidSlotsTotal": 2
  }
}`}</CodeBlock>

      <Callout variant="warn" title="Store the session token in memory only">
        Never write it to disk. If it leaks, an attacker can use it to keep the tool running on their own machine.
      </Callout>

      <h2>3. Send heartbeats</h2>
      <p>Every 5 minutes (or whatever <code>heartbeatInterval</code> the server returned), call:</p>
      <CodeBlock filename="heartbeat.json" language="json">{`POST /api/license/heartbeat
Content-Type: application/json

{
  "sessionToken": "sess_4f8a7c...d2e1b8"
}`}</CodeBlock>

      <p>Server replies with <code>{`{ "ok": true }`}</code> when all good. If it returns <code>{`{ "ok": false, "reason": "..." }`}</code>, the tool must shut down immediately.</p>

      <h2>4. Handle errors</h2>
      <p>Every failure response includes a machine-readable <code>code</code> field. See <Link href="/docs/error-handling" className="text-[#ff3a00] hover:underline">Error Handling</Link> for the full list. The most common:</p>
      <ul>
        <li><code>INVALID_KEY</code> — License key doesn&apos;t exist</li>
        <li><code>EXPIRED</code> — License has expired</li>
        <li><code>HWID_LIMIT</code> — All HWID slots are taken by other devices</li>
        <li><code>BANNED</code> — User account is banned</li>
        <li><code>FLAGGED</code> — Account is under review</li>
      </ul>

      <h2>5. Implement in WPF</h2>
      <p>Jump to <Link href="/docs/wpf-integration" className="text-[#ff3a00] hover:underline">WPF Integration</Link> for the complete drop-in C# code, including HWID generation, the auth call, heartbeat loop with graceful shutdown, and the auto-updater.</p>

      <Callout variant="success" title="That's it">
        Once your tool can authenticate and heartbeat, you&apos;re fully integrated. Auto-update is a separate optional flow covered in <Link href="/docs/auto-update" className="underline">Auto-Update</Link>.
      </Callout>
    </>
  )
}
