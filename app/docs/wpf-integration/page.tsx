import { CodeBlock, Callout } from '@/components/docs/CodeBlock'
import Link from 'next/link'

export default function WPFIntegrationPage() {
  return (
    <>
      <div className="mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ff3a00]">Integration</span>
        <h1 className="text-white font-bold text-3xl tracking-tight mt-2 mb-3" style={{ letterSpacing: '-0.025em' }}>WPF (C#) Integration</h1>
        <p className="text-[#9ca3af] text-base">Complete drop-in code for a WPF / .NET 6+ application.</p>
      </div>

      <Callout variant="info" title="What you'll build">
        A reusable <code>OnyxAuth</code> service that handles HWID generation, license authentication, the heartbeat loop, auto-update check, and graceful shutdown.
      </Callout>

      <h2>Step 1 — Install dependencies</h2>
      <p>Add these NuGet packages to your WPF project:</p>
      <CodeBlock filename="terminal" language="bash">{`dotnet add package System.Net.Http.Json
dotnet add package System.Management         # For WMI / HWID
dotnet add package System.Text.Json`}</CodeBlock>

      <h2>Step 2 — HWID generator</h2>
      <p>Generate a stable hardware fingerprint from CPU, motherboard, and disk serials. SHA-256 the result so we never send raw hardware data.</p>
      <CodeBlock filename="HardwareId.cs">{`using System;
using System.Management;
using System.Security.Cryptography;
using System.Text;

public static class HardwareId
{
    public static string Generate()
    {
        string cpu  = Query("Win32_Processor",  "ProcessorId");
        string mobo = Query("Win32_BaseBoard",  "SerialNumber");
        string disk = Query("Win32_DiskDrive",  "SerialNumber");

        string raw = $"{cpu}-{mobo}-{disk}";
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    static string Query(string @class, string prop)
    {
        try
        {
            using var s = new ManagementObjectSearcher($"SELECT {prop} FROM {@class}");
            foreach (var o in s.Get())
                return o[prop]?.ToString() ?? string.Empty;
        }
        catch { /* WMI unavailable */ }
        return string.Empty;
    }
}`}</CodeBlock>

      <h2>Step 3 — Models</h2>
      <CodeBlock filename="Models.cs">{`public record AuthRequest(string LicenseKey, string Hwid, string ToolSlug, string Version);

public record AuthResponse(
    bool Ok,
    SessionInfo? Session,
    UserInfo?    User,
    LicenseInfo? License,
    string?      Reason,
    string?      Code
);

public record SessionInfo(string Token, DateTime ExpiresAt, int HeartbeatInterval);
public record UserInfo(string Id, string Username, string Tier);
public record LicenseInfo(string Plan, DateTime ExpiresAt, int HwidSlotsUsed, int HwidSlotsTotal);

public record HeartbeatRequest(string SessionToken);
public record HeartbeatResponse(bool Ok, string? Reason, string? Code);`}</CodeBlock>

      <h2>Step 4 — The OnyxAuth service</h2>
      <p>This is the heart of the integration. It handles auth, heartbeat loop, and exposes events the UI can subscribe to.</p>
      <CodeBlock filename="OnyxAuth.cs">{`using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;

public class OnyxAuth : IDisposable
{
    const string BaseUrl  = "https://onyx.gg/api/license";
    const string ToolSlug = "onyx-rage";          // change per tool
    const string Version  = "2.1.0";

    readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(15) };
    string?              _sessionToken;
    CancellationTokenSource? _hbCts;
    int                  _missedBeats = 0;

    public UserInfo?    User    { get; private set; }
    public LicenseInfo? License { get; private set; }

    public event Action<string>? OnDisconnected;     // raise when tool must shut down
    public event Action<UserInfo>? OnAuthenticated;

    public async Task<bool> AuthenticateAsync(string licenseKey)
    {
        var req = new AuthRequest(licenseKey, HardwareId.Generate(), ToolSlug, Version);
        try
        {
            var res = await _http.PostAsJsonAsync($"{BaseUrl}/auth", req);
            var body = await res.Content.ReadFromJsonAsync<AuthResponse>();

            if (body is null || !body.Ok || body.Session is null)
            {
                OnDisconnected?.Invoke(body?.Reason ?? "Authentication failed");
                return false;
            }

            _sessionToken = body.Session.Token;
            User          = body.User;
            License       = body.License;

            OnAuthenticated?.Invoke(body.User!);
            StartHeartbeat(body.Session.HeartbeatInterval);
            return true;
        }
        catch (Exception ex)
        {
            OnDisconnected?.Invoke($"Network error: {ex.Message}");
            return false;
        }
    }

    void StartHeartbeat(int intervalSec)
    {
        _hbCts = new CancellationTokenSource();
        _ = Task.Run(async () =>
        {
            while (!_hbCts.IsCancellationRequested)
            {
                await Task.Delay(intervalSec * 1000, _hbCts.Token).ContinueWith(_ => { });
                if (_hbCts.IsCancellationRequested) break;

                try
                {
                    var res  = await _http.PostAsJsonAsync($"{BaseUrl}/heartbeat", new HeartbeatRequest(_sessionToken!));
                    var body = await res.Content.ReadFromJsonAsync<HeartbeatResponse>();

                    if (body is null || !body.Ok)
                    {
                        OnDisconnected?.Invoke(body?.Reason ?? "Session ended");
                        return;
                    }
                    _missedBeats = 0;
                }
                catch
                {
                    if (++_missedBeats >= 3)
                    {
                        OnDisconnected?.Invoke("Lost connection to license server");
                        return;
                    }
                }
            }
        }, _hbCts.Token);
    }

    public void Dispose()
    {
        _hbCts?.Cancel();
        _hbCts?.Dispose();
        _http.Dispose();
    }
}`}</CodeBlock>

      <h2>Step 5 — Use it in MainWindow</h2>
      <p>In <code>MainWindow.xaml.cs</code>, instantiate <code>OnyxAuth</code> on startup and lock the UI until authentication succeeds.</p>
      <CodeBlock filename="MainWindow.xaml.cs">{`public partial class MainWindow : Window
{
    readonly OnyxAuth _auth = new();

    public MainWindow()
    {
        InitializeComponent();
        UnlockUI(false);

        _auth.OnAuthenticated += user => Dispatcher.Invoke(() =>
        {
            WelcomeLabel.Content = $"Welcome, {user.Username}";
            UnlockUI(true);
        });

        _auth.OnDisconnected += reason => Dispatcher.Invoke(() =>
        {
            MessageBox.Show($"Session ended:\\n{reason}", "Onyx",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            Application.Current.Shutdown();
        });
    }

    async void LoginButton_Click(object sender, RoutedEventArgs e)
    {
        LoginButton.IsEnabled = false;
        bool ok = await _auth.AuthenticateAsync(LicenseKeyBox.Text);
        if (!ok) LoginButton.IsEnabled = true;
    }

    void UnlockUI(bool unlocked)
    {
        ToolPanel.IsEnabled = unlocked;
        LoginPanel.Visibility = unlocked ? Visibility.Collapsed : Visibility.Visible;
    }

    protected override void OnClosed(EventArgs e)
    {
        _auth.Dispose();
        base.OnClosed(e);
    }
}`}</CodeBlock>

      <h2>Step 6 — Add the updater (optional)</h2>
      <p>On launch, before authentication, call the manifest endpoint. If a newer version exists, download and replace yourself. Full guide in <Link href="/docs/auto-update" className="text-[#ff3a00] hover:underline">Auto-Update</Link>.</p>
      <CodeBlock filename="OnyxUpdater.cs">{`public static class OnyxUpdater
{
    const string ToolSlug = "onyx-rage";
    const string Current  = "2.1.0";

    public record Manifest(string Version, string Sha256, string Url, bool Required);

    public static async Task<Manifest?> CheckAsync()
    {
        using var http = new HttpClient();
        var res = await http.GetFromJsonAsync<Manifest>($"https://onyx.gg/api/tools/{ToolSlug}/latest");
        if (res is null || res.Version == Current) return null;
        return res;
    }
}`}</CodeBlock>

      <Callout variant="success" title="You're integrated">
        Run the tool, paste your license key, and it should authenticate, show your username, and start the heartbeat loop. Check the <Link href="/dashboard/security" className="underline">Security page</Link> in your account — your session will appear there in real time.
      </Callout>

      <h2>Next steps</h2>
      <ul>
        <li><Link href="/docs/auto-update" className="text-[#ff3a00] hover:underline">Auto-Update flow</Link> — Have your tool download and replace itself</li>
        <li><Link href="/docs/error-handling" className="text-[#ff3a00] hover:underline">Error handling</Link> — Map every error code to a user-friendly message</li>
        <li><Link href="/docs/redeem-codes" className="text-[#ff3a00] hover:underline">Redeem codes</Link> — Let users redeem codes inside the tool</li>
      </ul>
    </>
  )
}
