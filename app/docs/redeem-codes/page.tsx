import { CodeBlock, Callout, MethodEndpoint } from '@/components/docs/CodeBlock'
import Link from 'next/link'

export default function RedeemCodesDocsPage() {
  return (
    <>
      <div className="mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ff3a00]">Features</span>
        <h1 className="text-white font-bold text-3xl tracking-tight mt-2 mb-3" style={{ letterSpacing: '-0.025em' }}>Redeem Codes</h1>
        <p className="text-[#9ca3af] text-base">Give users codes that grant licenses, wallet credit, or discounts.</p>
      </div>

      <h2>What redeem codes can do</h2>
      <p>From the <Link href="/admin/redeem-codes" className="text-[#ff3a00] hover:underline">admin panel</Link>, you create codes that grant one of three rewards:</p>

      <ul>
        <li><strong>License</strong> — Free access to a specific product for a duration (e.g. 1 week, 1 month, lifetime)</li>
        <li><strong>Wallet Credit</strong> — Dollar amount added directly to user&apos;s balance</li>
        <li><strong>Discount</strong> — Percentage or flat-rate discount applied at checkout</li>
      </ul>

      <h2>Code properties</h2>
      <ul>
        <li><code>code</code> — The string user enters (e.g. <code>LAUNCH-WEEK</code>, <code>SUMMER2026</code>)</li>
        <li><code>reward</code> — License / Credit / Discount</li>
        <li><code>maxUses</code> — How many times it can be redeemed total (null = unlimited)</li>
        <li><code>usesPerUser</code> — How many times a single user can redeem (default 1)</li>
        <li><code>expiresAt</code> — When the code stops working (null = never)</li>
        <li><code>productId</code> — Optional: restrict to a specific product</li>
        <li><code>requiredTier</code> — Optional: minimum tier required to redeem</li>
      </ul>

      <h2>Redemption endpoint</h2>
      <MethodEndpoint method="POST" path="/api/redeem" description="User redeems a code (requires auth)" />

      <CodeBlock filename="request" language="json">{`{
  "code": "LAUNCH-WEEK"
}`}</CodeBlock>

      <p>Success response (varies by reward type):</p>
      <CodeBlock filename="success — license granted" language="json">{`{
  "ok": true,
  "reward": "license",
  "license": {
    "key":       "ONYX-RC9X-LM4P-7TY3-NQVB",
    "product":   "Onyx Rage",
    "duration":  "7 days",
    "expiresAt": "2026-06-08T00:00:00Z"
  }
}`}</CodeBlock>

      <CodeBlock filename="success — wallet credit" language="json">{`{
  "ok": true,
  "reward": "credit",
  "credit": {
    "amount":       2500,
    "newBalance":   16750
  }
}`}</CodeBlock>

      <h2>Failure responses</h2>
      <ul>
        <li><code>CODE_NOT_FOUND</code> — Code doesn&apos;t exist</li>
        <li><code>CODE_EXPIRED</code> — Past the <code>expiresAt</code> date</li>
        <li><code>CODE_EXHAUSTED</code> — Max global uses reached</li>
        <li><code>ALREADY_REDEEMED</code> — User already used this code</li>
        <li><code>TIER_INSUFFICIENT</code> — User&apos;s tier is too low</li>
      </ul>

      <h2>In-app redemption (optional)</h2>
      <p>If you want users to redeem codes from inside your WPF tool (not just the website), add a UI box and call:</p>
      <CodeBlock filename="OnyxRedeem.cs">{`public record RedeemRequest(string Code, string SessionToken);
public record RedeemResponse(bool Ok, string? Reward, object? Payload, string? Code, string? Reason);

public static async Task<RedeemResponse?> RedeemAsync(string code, string sessionToken)
{
    using var http = new HttpClient();
    http.DefaultRequestHeaders.Authorization = new("Bearer", sessionToken);

    var res = await http.PostAsJsonAsync(
        "https://onyx.gg/api/redeem",
        new { code });

    return await res.Content.ReadFromJsonAsync<RedeemResponse>();
}`}</CodeBlock>

      <Callout variant="info" title="Why on the website too?">
        Most users will redeem on the dashboard (<Link href="/dashboard/redeem" className="underline">/dashboard/redeem</Link>). Building it into the tool is nice but optional — the website always works.
      </Callout>

      <h2>Generating bulk codes</h2>
      <p>From the admin panel, you can generate up to 1,000 unique codes at once for a single reward — useful for giveaways, partnerships, or content creator promo packs.</p>
    </>
  )
}
