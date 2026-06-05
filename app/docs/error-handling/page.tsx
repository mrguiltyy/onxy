import { CodeBlock, Callout } from '@/components/docs/CodeBlock'
import { StatusBadge } from '@/components/ui/StatusBadge'

const errors = [
  { code: 'INVALID_KEY',     when: 'License key not found',                              action: 'Show "Invalid license key" — user must check what they entered.' },
  { code: 'EXPIRED',         when: 'License expired',                                    action: 'Direct user to dashboard to renew.' },
  { code: 'BANNED',          when: 'User account banned',                                action: 'Terminate. Show ban reason if provided.' },
  { code: 'FLAGGED',         when: 'Account under review',                               action: 'Terminate. Tell user to open a ticket.' },
  { code: 'HWID_LIMIT',      when: 'All HWID slots in use',                              action: 'Tell user to reset a slot from dashboard.' },
  { code: 'HWID_BLOCKED',    when: 'This HWID was reset and banned',                     action: 'Terminate. Tell user to contact support.' },
  { code: 'VPN_BLOCKED',     when: 'VPN/proxy detected on a restricted product',         action: 'Tell user to disable VPN and retry.' },
  { code: 'SESSION_EXPIRED', when: 'Session token expired (missed too many heartbeats)', action: 'Re-authenticate from scratch.' },
  { code: 'SESSION_KILLED',  when: 'Admin/user killed the session',                      action: 'Terminate immediately.' },
  { code: 'IP_CHANGED',      when: 'Heartbeat IP differs from auth IP (strict mode)',    action: 'Re-authenticate from scratch.' },
  { code: 'LICENSE_EXPIRED', when: 'License expired during session',                     action: 'Terminate. Prompt to renew.' },
  { code: 'MAINTENANCE',     when: 'Tool is in maintenance mode',                        action: 'Show message + ETA. Retry later.' },
  { code: 'UPDATE_REQUIRED', when: 'Tool version is too old',                            action: 'Run updater. Cannot proceed without updating.' },
  { code: 'RATE_LIMITED',    when: 'Too many requests',                                  action: 'Back off — show cooldown timer.' },
  { code: 'NETWORK_ERROR',   when: 'Cannot reach Onyx servers',                          action: 'Retry up to 3 times then shut down.' },
]

export default function ErrorHandlingDocsPage() {
  return (
    <>
      <div className="mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ff3a00]">Features</span>
        <h1 className="text-white font-bold text-3xl tracking-tight mt-2 mb-3" style={{ letterSpacing: '-0.025em' }}>Error Handling</h1>
        <p className="text-[#9ca3af] text-base">Every code your tool can receive — and what to do about it.</p>
      </div>

      <h2>Error format</h2>
      <p>Every failed response (auth, heartbeat, downloads) returns the same JSON shape:</p>
      <CodeBlock language="json">{`{
  "ok": false,
  "code":   "HWID_LIMIT",
  "reason": "All HWID slots are taken. Reset one via your dashboard."
}`}</CodeBlock>

      <p>Pattern-match on <code>code</code> — that&apos;s the stable machine identifier. The <code>reason</code> is human text you can show as a fallback.</p>

      <h2>Error code reference</h2>

      <div className="not-prose flex flex-col gap-2 my-6">
        {errors.map(e => (
          <div key={e.code} className="p-4 rounded-lg bg-[#0e1119] border border-white/[0.04]">
            <div className="flex items-start gap-3 mb-2">
              <code className="font-mono text-[12.5px] font-bold text-[#ff3a00] bg-[rgba(255,58,0,0.08)] px-2 py-0.5 rounded">
                {e.code}
              </code>
            </div>
            <p className="text-[13px] text-white font-medium mb-1">When: <span className="text-[#9ca3af] font-normal">{e.when}</span></p>
            <p className="text-[13px] text-white font-medium">Do: <span className="text-[#9ca3af] font-normal">{e.action}</span></p>
          </div>
        ))}
      </div>

      <h2>Pattern: central error handler</h2>
      <p>Centralize your error responses so you only have to update one place:</p>
      <CodeBlock filename="OnyxErrors.cs">{`public static class OnyxErrors
{
    public static (string Title, string Body, bool ShouldExit) Map(string code, string fallback)
        => code switch
        {
            "INVALID_KEY"     => ("Invalid License", "The license key you entered isn't recognized.", true),
            "EXPIRED"         => ("License Expired", "Your license has run out. Renew on the website.", true),
            "BANNED"          => ("Account Banned", "Your account has been permanently terminated.", true),
            "FLAGGED"         => ("Account Under Review", "Open a ticket to resolve this.", true),
            "HWID_LIMIT"      => ("Device Limit Reached", "Reset a HWID slot in your dashboard.", true),
            "VPN_BLOCKED"     => ("VPN Detected", "Disable your VPN/proxy and try again.", false),
            "SESSION_EXPIRED" => ("Session Expired", "Re-authenticate to continue.", true),
            "MAINTENANCE"     => ("Maintenance Mode", "The tool is offline. Try again soon.", true),
            "UPDATE_REQUIRED" => ("Update Required", "An update will start automatically.", false),
            "NETWORK_ERROR"   => ("Connection Lost", "Check your internet and retry.", false),
            _                 => ("Error", fallback, true),
        };
}`}</CodeBlock>

      <Callout variant="info" title="Always show the reason">
        Even if you pattern-match the code, use the server&apos;s <code>reason</code> string as a fallback in your UI. The server may add detail (&ldquo;Reset blocked until June 15&rdquo;) that your hardcoded text won&apos;t have.
      </Callout>
    </>
  )
}
