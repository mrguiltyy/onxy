import { CodeBlock, Callout, MethodEndpoint } from '@/components/docs/CodeBlock'

export default function HeartbeatDocsPage() {
  return (
    <>
      <div className="mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ff3a00]">Authentication</span>
        <h1 className="text-white font-bold text-3xl tracking-tight mt-2 mb-3" style={{ letterSpacing: '-0.025em' }}>Heartbeat</h1>
        <p className="text-[#9ca3af] text-base">Keep sessions alive with periodic pings — and shut down cleanly when they fail.</p>
      </div>

      <h2>Why heartbeats?</h2>
      <p>The auth endpoint gives you a 5-minute session token. Without heartbeats, the session expires after 5 minutes and the tool would die. The heartbeat tells the server &ldquo;I&apos;m still here, extend my session.&rdquo;</p>
      <p>This is also how we detect leaked sessions: if your tool stops heartbeating, we know the user shut down. If we see heartbeats from a different IP suddenly, we flag and kill the session.</p>

      <h2>The endpoint</h2>
      <MethodEndpoint method="POST" path="/api/license/heartbeat" description="Extend session by one interval" />

      <h2>Request</h2>
      <CodeBlock filename="POST /api/license/heartbeat" language="json">{`{
  "sessionToken": "sess_4f8a7c92e1..."
}`}</CodeBlock>

      <h2>Successful response</h2>
      <CodeBlock language="json">{`{
  "ok": true,
  "session": {
    "expiresAt":          "2026-06-01T18:35:00Z",
    "heartbeatInterval":  300
  }
}`}</CodeBlock>

      <h2>Failure response</h2>
      <p>If the server returns <code>ok: false</code>, <strong>shut down the tool immediately</strong>:</p>
      <CodeBlock language="json">{`{
  "ok": false,
  "reason": "Account suspended for review.",
  "code":   "FLAGGED"
}`}</CodeBlock>

      <h2>The loop</h2>
      <p>Standard pattern: a background task that pings every <code>heartbeatInterval</code> seconds.</p>
      <CodeBlock filename="HeartbeatLoop.cs">{`async Task HeartbeatLoopAsync(int intervalSec, CancellationToken ct)
{
    int missed = 0;
    while (!ct.IsCancellationRequested)
    {
        await Task.Delay(intervalSec * 1000, ct);
        try
        {
            var res  = await _http.PostAsJsonAsync($"{BaseUrl}/heartbeat", new { sessionToken = _token });
            var body = await res.Content.ReadFromJsonAsync<HeartbeatResponse>();

            if (body is null || !body.Ok)
            {
                ShutdownTool(body?.Reason ?? "Session ended");
                return;
            }
            missed = 0;
        }
        catch
        {
            if (++missed >= 3)
            {
                ShutdownTool("Lost connection to license server");
                return;
            }
        }
    }
}`}</CodeBlock>

      <Callout variant="warn" title="Three strikes rule">
        Allow up to 3 missed beats before shutting down. Real-world networks have transient hiccups. But after 3 consecutive failures (~15 minutes of silence), there&apos;s no excuse — terminate.
      </Callout>

      <h2>Common failure codes</h2>
      <ul>
        <li><code>SESSION_EXPIRED</code> — Token expired (you missed beats for too long)</li>
        <li><code>SESSION_KILLED</code> — Admin or user killed the session manually</li>
        <li><code>FLAGGED</code> — Account under review, sessions paused</li>
        <li><code>BANNED</code> — Account banned, license revoked</li>
        <li><code>LICENSE_EXPIRED</code> — Subscription ran out mid-session</li>
        <li><code>IP_CHANGED</code> — Heartbeat came from a different IP than auth (strict mode)</li>
      </ul>

      <h2>Graceful shutdown</h2>
      <p>When you must shut down, do it cleanly:</p>
      <ul>
        <li>Pause any active work / unsaved state</li>
        <li>Show the user the reason (use the <code>reason</code> string)</li>
        <li>Optionally let them open a ticket or retry</li>
        <li>Then exit the process</li>
      </ul>
    </>
  )
}
