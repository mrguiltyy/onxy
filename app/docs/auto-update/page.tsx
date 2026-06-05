import { CodeBlock, Callout, MethodEndpoint } from '@/components/docs/CodeBlock'

export default function AutoUpdateDocsPage() {
  return (
    <>
      <div className="mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ff3a00]">Features</span>
        <h1 className="text-white font-bold text-3xl tracking-tight mt-2 mb-3" style={{ letterSpacing: '-0.025em' }}>Auto-Update</h1>
        <p className="text-[#9ca3af] text-base">Have your tool silently fetch and apply updates on launch.</p>
      </div>

      <h2>The flow</h2>
      <ol>
        <li>Tool launches</li>
        <li>Tool calls <code>/api/tools/:slug/latest</code></li>
        <li>Server returns version, SHA-256, signed download URL, &amp; <code>required</code> flag</li>
        <li>If version matches current → skip update, continue to auth</li>
        <li>If version differs → download new exe to temp folder</li>
        <li>Verify SHA-256 — if mismatch, abort &amp; show error</li>
        <li>Write a small updater script that waits for the tool to exit, swaps the exe, then relaunches</li>
        <li>Tool exits — updater runs — new version starts</li>
      </ol>

      <h2>Manifest endpoint</h2>
      <MethodEndpoint method="GET" path="/api/tools/:slug/latest" description="Get latest version info" />

      <h2>Response</h2>
      <CodeBlock language="json">{`{
  "version":  "2.1.0",
  "sha256":   "c3f7e8d2a1b9...64chars",
  "url":      "https://cdn.onyx.gg/signed/...",
  "required": true,
  "notes":    "Improved stealth layer, reduced memory footprint by 30%."
}`}</CodeBlock>

      <ul>
        <li><code>version</code> — The latest published version</li>
        <li><code>sha256</code> — Expected hash of the binary (verify after download)</li>
        <li><code>url</code> — Signed CDN URL valid for 5 minutes</li>
        <li><code>required</code> — If true, old versions cannot run</li>
        <li><code>notes</code> — Changelog string to show the user</li>
      </ul>

      <h2>C# update checker</h2>
      <CodeBlock filename="OnyxUpdater.cs">{`using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Threading.Tasks;
using System.Diagnostics;

public static class OnyxUpdater
{
    public record Manifest(string Version, string Sha256, string Url, bool Required, string Notes);

    public static async Task<bool> CheckAndApplyAsync(string toolSlug, string current)
    {
        using var http = new HttpClient();
        var manifest = await http.GetFromJsonAsync<Manifest>(
            $"https://onyx.gg/api/tools/{toolSlug}/latest");

        if (manifest is null || manifest.Version == current) return false;
        if (!manifest.Required && !AskUserToUpdate(manifest)) return false;

        string tempPath = Path.Combine(Path.GetTempPath(), $"onyx-update-{Guid.NewGuid()}.exe");

        // Download
        await using (var stream = await http.GetStreamAsync(manifest.Url))
        await using (var file   = File.Create(tempPath))
            await stream.CopyToAsync(file);

        // Verify
        byte[] hash = SHA256.HashData(await File.ReadAllBytesAsync(tempPath));
        string actual = Convert.ToHexString(hash).ToLowerInvariant();
        if (actual != manifest.Sha256.ToLowerInvariant())
        {
            File.Delete(tempPath);
            throw new InvalidOperationException("Update integrity check failed.");
        }

        // Swap & relaunch via cmd script
        string current_exe = Environment.ProcessPath!;
        string script      = Path.Combine(Path.GetTempPath(), "onyx-swap.cmd");
        await File.WriteAllTextAsync(script, $@"
@echo off
timeout /t 2 /nobreak > nul
move /y ""{tempPath}"" ""{current_exe}""
start """" ""{current_exe}""
del ""%~f0""
");

        Process.Start(new ProcessStartInfo("cmd.exe", $"/C \\"{script}\\"")
        {
            CreateNoWindow = true, UseShellExecute = false
        });

        Environment.Exit(0);
        return true;
    }

    static bool AskUserToUpdate(Manifest m)
    {
        // Show your own dialog with m.Notes; return true to update.
        return true;
    }
}`}</CodeBlock>

      <h2>Wiring it up</h2>
      <p>Call the updater at the very start of <code>App.xaml.cs</code> before the main window opens:</p>
      <CodeBlock filename="App.xaml.cs">{`protected override async void OnStartup(StartupEventArgs e)
{
    base.OnStartup(e);

    try
    {
        await OnyxUpdater.CheckAndApplyAsync("onyx-rage", "2.1.0");
    }
    catch (Exception ex)
    {
        MessageBox.Show($"Update failed:\\n{ex.Message}", "Onyx", MessageBoxButton.OK, MessageBoxImage.Error);
        Shutdown();
        return;
    }

    new MainWindow().Show();
}`}</CodeBlock>

      <Callout variant="success" title="Integrity is everything">
        Always verify SHA-256 before swapping. Skipping this step is how supply-chain attacks happen. The hash comes from our server, the file comes from our CDN — if they don&apos;t match, abort.
      </Callout>

      <Callout variant="warn" title="Required vs. optional">
        When you push a critical security patch, set <code>required: true</code> in the admin panel. The tool will refuse to run on old versions. Use this sparingly — every required update forces the user to wait on download before they can work.
      </Callout>
    </>
  )
}
