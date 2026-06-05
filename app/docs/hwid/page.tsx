import { CodeBlock, Callout } from '@/components/docs/CodeBlock'

export default function HwidDocsPage() {
  return (
    <>
      <div className="mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ff3a00]">Authentication</span>
        <h1 className="text-white font-bold text-3xl tracking-tight mt-2 mb-3" style={{ letterSpacing: '-0.025em' }}>HWID Binding</h1>
        <p className="text-[#9ca3af] text-base">How to generate a stable hardware fingerprint and lock licenses to it.</p>
      </div>

      <h2>What is HWID?</h2>
      <p>HWID is a hash of stable hardware identifiers — CPU ID, motherboard serial, disk serial. Hashing means we never see raw hardware data, but the hash stays consistent across reboots and OS reinstalls.</p>

      <Callout variant="info" title="Why hash?">
        Sending raw serials is a privacy nightmare and easy to spoof. SHA-256ing them gives you a 64-char fingerprint that&apos;s unique, stable, and tells us nothing about the user&apos;s machine.
      </Callout>

      <h2>The algorithm</h2>
      <ol>
        <li>Query <code>Win32_Processor</code> → <code>ProcessorId</code></li>
        <li>Query <code>Win32_BaseBoard</code> → <code>SerialNumber</code></li>
        <li>Query <code>Win32_DiskDrive</code> → first disk&apos;s <code>SerialNumber</code></li>
        <li>Concatenate: <code>{`{cpu}-{mobo}-{disk}`}</code></li>
        <li>SHA-256 the resulting string</li>
        <li>Lowercase hex output → that&apos;s your HWID</li>
      </ol>

      <h2>C# implementation</h2>
      <CodeBlock filename="HardwareId.cs">{`public static class HardwareId
{
    public static string Generate()
    {
        string cpu  = WmiValue("Win32_Processor",  "ProcessorId");
        string mobo = WmiValue("Win32_BaseBoard",  "SerialNumber");
        string disk = WmiValue("Win32_DiskDrive",  "SerialNumber");

        string raw  = $"{cpu}-{mobo}-{disk}";
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    static string WmiValue(string @class, string prop)
    {
        try
        {
            using var s = new ManagementObjectSearcher($"SELECT {prop} FROM {@class}");
            foreach (var o in s.Get())
                return o[prop]?.ToString() ?? "";
        }
        catch { }
        return "";
    }
}`}</CodeBlock>

      <h2>HWID slots</h2>
      <p>Each license has a maximum HWID slot count (set per product per plan — usually 1 or 2). When a tool authenticates from a new HWID:</p>
      <ul>
        <li>If slots are available → claim one, allow auth</li>
        <li>If slots are full → reject with <code>HWID_LIMIT</code></li>
        <li>User must reset via dashboard or open a support ticket</li>
      </ul>

      <Callout variant="warn" title="HWID reset policy">
        Free resets: 2 per month per license. Beyond that requires admin approval via ticket. Abuse (constant resets) is flagged automatically and may trigger account review.
      </Callout>

      <h2>What we store</h2>
      <p>For each license + HWID combination, we keep:</p>
      <ul>
        <li>HWID hash (the 64-char SHA-256)</li>
        <li>Optional label (e.g. &ldquo;Main PC&rdquo;, &ldquo;Laptop&rdquo;)</li>
        <li>First registration timestamp</li>
        <li>Last seen timestamp</li>
        <li>Last IP address</li>
      </ul>
      <p>Users can see all this on their <code>/dashboard/security</code> page.</p>
    </>
  )
}
