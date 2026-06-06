// Placeholders __APP_ID__ and __BASE_URL__ are replaced at render time
// with the user's selected application and the live base URL.

export type Language = 'csharp' | 'vbnet' | 'cpp' | 'python' | 'nodejs' | 'java' | 'rest'

export interface LanguageSnippet {
  name:     string
  ext:      string         // syntax-highlight hint (csharp, cpp, python, javascript, java, vbnet, bash)
  filename: string
  install?: string
  sdk:      string
  usage:    string
  notes?:   string
}

// ════════════════════════════════════════════════════════════════
//  C# / .NET 6+
// ════════════════════════════════════════════════════════════════
const CSHARP_SDK = `using System;
using System.Management;
using System.Net.Http;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace OP.Auth
{
    public sealed class OPAuth : IDisposable
    {
        private const string BaseUrl = "__BASE_URL__/api/v1/auth";
        private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(10) };

        public string AppId { get; }
        public string AppSecret { get; }
        public string Version { get; }
        public string? SessionToken { get; private set; }
        public DateTime ExpiresAt { get; private set; }

        private CancellationTokenSource? _hb;

        public OPAuth(string appId, string appSecret, string version = "1.0.0")
        { AppId = appId; AppSecret = appSecret; Version = version; }

        public static string GetHwid()
        {
            string cpu = "", mb = "";
            try { using var c = new ManagementClass("Win32_Processor");
                  foreach (ManagementObject mo in c.GetInstances()) { cpu = mo["ProcessorId"]?.ToString() ?? ""; break; }
            } catch { }
            try { using var c = new ManagementClass("Win32_BaseBoard");
                  foreach (ManagementObject mo in c.GetInstances()) { mb = mo["SerialNumber"]?.ToString() ?? ""; break; }
            } catch { }
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes($"{cpu}|{mb}"));
            var sb = new StringBuilder(bytes.Length * 2);
            foreach (var b in bytes) sb.Append(b.ToString("x2"));
            return sb.ToString();
        }

        public async Task<AuthResult> LoginAsync(string licenseKey, CancellationToken ct = default)
        {
            var body = new { app_id = AppId, app_secret = AppSecret, license_key = licenseKey, hwid = GetHwid(), version = Version };
            var res = await Http.PostAsJsonAsync($"{BaseUrl}/login", body, ct);
            var data = await res.Content.ReadFromJsonAsync<AuthResult>(cancellationToken: ct) ?? new() { Success = false, Message = "Empty response." };
            if (data.Success) { SessionToken = data.SessionToken; ExpiresAt = data.ExpiresAt; }
            return data;
        }

        public async Task<bool> CheckAsync(CancellationToken ct = default)
        {
            if (SessionToken == null) return false;
            var body = new { app_id = AppId, session_token = SessionToken, hwid = GetHwid() };
            try { var res = await Http.PostAsJsonAsync($"{BaseUrl}/check", body, ct);
                  return (await res.Content.ReadFromJsonAsync<AuthResult>(cancellationToken: ct))?.Valid ?? false; }
            catch { return false; }
        }

        public void StartHeartbeat(TimeSpan interval, Action? onInvalidated = null)
        {
            _hb?.Cancel(); _hb = new CancellationTokenSource(); var ct = _hb.Token;
            _ = Task.Run(async () =>
            {
                while (!ct.IsCancellationRequested)
                {
                    try { await Task.Delay(interval, ct); } catch { return; }
                    if (!await HeartbeatAsync(ct)) { onInvalidated?.Invoke(); return; }
                }
            }, ct);
        }

        public async Task<bool> HeartbeatAsync(CancellationToken ct = default)
        {
            if (SessionToken == null) return false;
            var body = new { app_id = AppId, session_token = SessionToken, hwid = GetHwid() };
            try { var res = await Http.PostAsJsonAsync($"{BaseUrl}/heartbeat", body, ct);
                  var data = await res.Content.ReadFromJsonAsync<AuthResult>(cancellationToken: ct);
                  if (data?.Valid == true) { ExpiresAt = data.ExpiresAt; return true; }
                  return false; }
            catch { return false; }
        }

        public void Dispose() => _hb?.Cancel();
    }

    public sealed class AuthResult
    {
        public bool Success { get; set; }
        public bool Valid { get; set; }
        public string? Code { get; set; }
        public string? Message { get; set; }
        public string? SessionToken { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}`

const CSHARP_USAGE = `// LoginWindow.xaml.cs
using System.Windows;
using OP.Auth;

private OPAuth? _auth;

private async void Login_Click(object sender, RoutedEventArgs e)
{
    _auth = new OPAuth(
        appId:     "__APP_ID__",
        appSecret: "YOUR_APP_SECRET_HERE",
        version:   "1.0.0"
    );

    var result = await _auth.LoginAsync(LicenseKeyBox.Text.Trim());
    if (!result.Success)
    {
        MessageBox.Show(result.Message, "Auth failed");
        return;
    }

    _auth.StartHeartbeat(TimeSpan.FromSeconds(60), onInvalidated: () =>
    {
        Application.Current.Dispatcher.Invoke(() =>
        {
            MessageBox.Show("Session ended.");
            Application.Current.Shutdown();
        });
    });

    new MainWindow().Show();
    this.Close();
}`

// ════════════════════════════════════════════════════════════════
//  VB.NET
// ════════════════════════════════════════════════════════════════
const VBNET_SDK = `Imports System.Management
Imports System.Net.Http
Imports System.Net.Http.Json
Imports System.Security.Cryptography
Imports System.Text
Imports System.Threading

Public Class OPAuth
    Implements IDisposable

    Private Const BaseUrl As String = "__BASE_URL__/api/v1/auth"
    Private Shared ReadOnly Http As New HttpClient() With { .Timeout = TimeSpan.FromSeconds(10) }

    Public ReadOnly Property AppId As String
    Public ReadOnly Property AppSecret As String
    Public ReadOnly Property Version As String
    Public Property SessionToken As String
    Public Property ExpiresAt As DateTime

    Private _hb As CancellationTokenSource

    Public Sub New(appId As String, appSecret As String, Optional version As String = "1.0.0")
        Me.AppId = appId : Me.AppSecret = appSecret : Me.Version = version
    End Sub

    Public Shared Function GetHwid() As String
        Dim cpu As String = "", mb As String = ""
        Try
            Using c As New ManagementClass("Win32_Processor")
                For Each mo As ManagementObject In c.GetInstances()
                    cpu = If(mo("ProcessorId")?.ToString(), "") : Exit For
                Next
            End Using
        Catch
        End Try
        Try
            Using c As New ManagementClass("Win32_BaseBoard")
                For Each mo As ManagementObject In c.GetInstances()
                    mb = If(mo("SerialNumber")?.ToString(), "") : Exit For
                Next
            End Using
        Catch
        End Try
        Using sha = SHA256.Create()
            Dim bytes = sha.ComputeHash(Encoding.UTF8.GetBytes($"{cpu}|{mb}"))
            Dim sb As New StringBuilder()
            For Each b In bytes : sb.Append(b.ToString("x2")) : Next
            Return sb.ToString()
        End Using
    End Function

    Public Async Function LoginAsync(licenseKey As String) As Threading.Tasks.Task(Of AuthResult)
        Dim body = New With { .app_id = AppId, .app_secret = AppSecret, .license_key = licenseKey, .hwid = GetHwid(), .version = Version }
        Dim res = Await Http.PostAsJsonAsync($"{BaseUrl}/login", body)
        Dim data = Await res.Content.ReadFromJsonAsync(Of AuthResult)()
        If data IsNot Nothing AndAlso data.Success Then
            SessionToken = data.SessionToken : ExpiresAt = data.ExpiresAt
        End If
        Return data
    End Function

    Public Async Function HeartbeatAsync() As Threading.Tasks.Task(Of Boolean)
        If SessionToken Is Nothing Then Return False
        Dim body = New With { .app_id = AppId, .session_token = SessionToken, .hwid = GetHwid() }
        Try
            Dim res = Await Http.PostAsJsonAsync($"{BaseUrl}/heartbeat", body)
            Dim data = Await res.Content.ReadFromJsonAsync(Of AuthResult)()
            If data IsNot Nothing AndAlso data.Valid Then
                ExpiresAt = data.ExpiresAt : Return True
            End If
            Return False
        Catch
            Return False
        End Try
    End Function

    Public Sub Dispose() Implements IDisposable.Dispose
        _hb?.Cancel()
    End Sub
End Class

Public Class AuthResult
    Public Property Success As Boolean
    Public Property Valid As Boolean
    Public Property Code As String
    Public Property Message As String
    Public Property SessionToken As String
    Public Property ExpiresAt As DateTime
End Class`

const VBNET_USAGE = `' LoginForm.vb
Private auth As OPAuth

Private Async Sub LoginButton_Click(sender As Object, e As EventArgs) Handles LoginButton.Click
    auth = New OPAuth(appId:="__APP_ID__", appSecret:="YOUR_APP_SECRET_HERE")
    Dim result = Await auth.LoginAsync(LicenseKeyBox.Text.Trim())
    If Not result.Success Then
        MessageBox.Show(result.Message)
        Return
    End If

    ' Start a 60-second heartbeat timer
    Dim hbTimer As New Timers.Timer(60000)
    AddHandler hbTimer.Elapsed, Async Sub()
        If Not Await auth.HeartbeatAsync() Then
            Me.Invoke(Sub() Application.Exit())
        End If
    End Sub
    hbTimer.Start()

    Dim main As New MainForm()
    main.Show()
    Me.Hide()
End Sub`

// ════════════════════════════════════════════════════════════════
//  C++ (Windows, WinHTTP + nlohmann/json header-only)
// ════════════════════════════════════════════════════════════════
const CPP_SDK = `// OPAuth.h — C++17, Windows only.
// Dependencies:
//   • WinHTTP   (link winhttp.lib — built into Windows SDK)
//   • nlohmann/json   (header-only, drop json.hpp next to this file)
// Compile: cl /std:c++17 /EHsc your_app.cpp /link winhttp.lib

#pragma once
#include <windows.h>
#include <winhttp.h>
#include <wbemidl.h>
#include <comdef.h>
#include <bcrypt.h>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <thread>
#include <chrono>
#include <atomic>
#include "json.hpp"

#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "wbemuuid.lib")
#pragma comment(lib, "bcrypt.lib")

namespace op {

using json = nlohmann::json;

struct AuthResult {
    bool success = false;
    bool valid   = false;
    std::string code;
    std::string message;
    std::string session_token;
    std::string expires_at;
};

class OPAuth {
public:
    OPAuth(std::string app_id, std::string app_secret, std::string version = "1.0.0")
        : app_id_(std::move(app_id)), app_secret_(std::move(app_secret)), version_(std::move(version)) {}

    ~OPAuth() { stop_heartbeat(); }

    AuthResult login(const std::string& license_key) {
        json body = {
            {"app_id", app_id_}, {"app_secret", app_secret_},
            {"license_key", license_key}, {"hwid", get_hwid()},
            {"version", version_},
        };
        auto res = post("/login", body.dump());
        if (res.success) { session_token_ = res.session_token; expires_at_ = res.expires_at; }
        return res;
    }

    bool heartbeat() {
        if (session_token_.empty()) return false;
        json body = { {"app_id", app_id_}, {"session_token", session_token_}, {"hwid", get_hwid()} };
        auto res = post("/heartbeat", body.dump());
        if (res.valid) { expires_at_ = res.expires_at; return true; }
        return false;
    }

    void start_heartbeat(int seconds, std::function<void()> on_invalidated) {
        stop_heartbeat();
        hb_running_ = true;
        hb_thread_ = std::thread([this, seconds, on_invalidated]() {
            while (hb_running_) {
                std::this_thread::sleep_for(std::chrono::seconds(seconds));
                if (!hb_running_) return;
                if (!heartbeat()) { if (on_invalidated) on_invalidated(); return; }
            }
        });
    }

    void stop_heartbeat() {
        hb_running_ = false;
        if (hb_thread_.joinable()) hb_thread_.join();
    }

    static std::string get_hwid() {
        std::string cpu = wmi_query(L"Win32_Processor", L"ProcessorId");
        std::string mb  = wmi_query(L"Win32_BaseBoard", L"SerialNumber");
        return sha256_hex(cpu + "|" + mb);
    }

private:
    std::string app_id_, app_secret_, version_;
    std::string session_token_, expires_at_;
    std::thread hb_thread_;
    std::atomic<bool> hb_running_{false};

    AuthResult post(const std::string& path, const std::string& json_body) {
        AuthResult out;
        HINTERNET hSession = WinHttpOpen(L"OPAuth/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, nullptr, nullptr, 0);
        if (!hSession) return out;
        HINTERNET hConnect = WinHttpConnect(hSession, L"__HOSTNAME__", INTERNET_DEFAULT_HTTPS_PORT, 0);
        if (!hConnect) { WinHttpCloseHandle(hSession); return out; }
        std::wstring wpath = L"/api/v1/auth" + std::wstring(path.begin(), path.end());
        HINTERNET hReq = WinHttpOpenRequest(hConnect, L"POST", wpath.c_str(), nullptr, nullptr, nullptr, WINHTTP_FLAG_SECURE);
        const wchar_t* hdrs = L"Content-Type: application/json\\r\\n";
        WinHttpSendRequest(hReq, hdrs, -1L, (LPVOID)json_body.c_str(), (DWORD)json_body.size(), (DWORD)json_body.size(), 0);
        WinHttpReceiveResponse(hReq, nullptr);
        std::string resp; DWORD avail = 0;
        while (WinHttpQueryDataAvailable(hReq, &avail) && avail) {
            std::vector<char> buf(avail); DWORD read = 0;
            WinHttpReadData(hReq, buf.data(), avail, &read);
            resp.append(buf.data(), read);
        }
        WinHttpCloseHandle(hReq); WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession);
        try {
            auto j = json::parse(resp);
            out.success       = j.value("success", false);
            out.valid         = j.value("valid", false);
            out.code          = j.value("code", "");
            out.message       = j.value("message", "");
            out.session_token = j.value("session_token", "");
            out.expires_at    = j.value("expires_at", "");
        } catch (...) {}
        return out;
    }

    static std::string wmi_query(const wchar_t* cls, const wchar_t* field) {
        std::string result;
        CoInitializeEx(0, COINIT_MULTITHREADED);
        IWbemLocator* loc = nullptr;
        if (FAILED(CoCreateInstance(CLSID_WbemLocator, 0, CLSCTX_INPROC_SERVER, IID_IWbemLocator, (void**)&loc))) return result;
        IWbemServices* svc = nullptr;
        if (FAILED(loc->ConnectServer(_bstr_t(L"ROOT\\\\CIMV2"), nullptr, nullptr, 0, 0, 0, 0, &svc))) { loc->Release(); return result; }
        std::wstring q = std::wstring(L"SELECT ") + field + L" FROM " + cls;
        IEnumWbemClassObject* en = nullptr;
        svc->ExecQuery(_bstr_t(L"WQL"), _bstr_t(q.c_str()), WBEM_FLAG_FORWARD_ONLY | WBEM_FLAG_RETURN_IMMEDIATELY, nullptr, &en);
        IWbemClassObject* obj = nullptr; ULONG ret = 0;
        if (en && en->Next(WBEM_INFINITE, 1, &obj, &ret) == 0 && obj) {
            VARIANT v; obj->Get(field, 0, &v, 0, 0);
            if (v.vt == VT_BSTR && v.bstrVal) {
                _bstr_t s(v.bstrVal); result = (const char*)s;
            }
            VariantClear(&v); obj->Release();
        }
        if (en) en->Release(); svc->Release(); loc->Release();
        return result;
    }

    static std::string sha256_hex(const std::string& input) {
        BCRYPT_ALG_HANDLE alg; BCryptOpenAlgorithmProvider(&alg, BCRYPT_SHA256_ALGORITHM, nullptr, 0);
        BYTE hash[32];
        BCryptHash(alg, nullptr, 0, (PUCHAR)input.data(), (ULONG)input.size(), hash, 32);
        BCryptCloseAlgorithmProvider(alg, 0);
        std::ostringstream os; for (auto b : hash) os << std::hex << std::setw(2) << std::setfill('0') << (int)b;
        return os.str();
    }
};

} // namespace op`

const CPP_USAGE = `// main.cpp
#include "OPAuth.h"
#include <iostream>
#include <string>

int main() {
    op::OPAuth auth("__APP_ID__", "YOUR_APP_SECRET_HERE", "1.0.0");

    std::string license_key;
    std::cout << "License key: ";
    std::getline(std::cin, license_key);

    auto result = auth.login(license_key);
    if (!result.success) {
        std::cerr << "Auth failed: " << result.message << " (" << result.code << ")\\n";
        return 1;
    }

    std::cout << "Authenticated! Session: " << result.session_token.substr(0, 8) << "...\\n";

    // 60-second heartbeat; shutdown on fail
    auth.start_heartbeat(60, []() {
        std::cerr << "Session lost. Exiting.\\n";
        std::exit(0);
    });

    // ... your main program here ...
    std::cin.get();
    return 0;
}`

// ════════════════════════════════════════════════════════════════
//  Python 3.9+
// ════════════════════════════════════════════════════════════════
const PYTHON_SDK = `# op_auth.py — pip install requests
import hashlib
import platform
import subprocess
import threading
import time
from dataclasses import dataclass, field
from typing import Callable, Optional

import requests

BASE_URL = "__BASE_URL__/api/v1/auth"


@dataclass
class AuthResult:
    success:       bool = False
    valid:         bool = False
    code:          str  = ""
    message:      str  = ""
    session_token: str  = ""
    expires_at:    str  = ""


def get_hwid() -> str:
    """SHA256 of CPU + motherboard serial. Windows-focused (auth.gg compatible).
    Falls back to a uuid-based ID on non-Windows."""
    parts = []
    if platform.system() == "Windows":
        try:
            cpu = subprocess.check_output(
                ["wmic", "cpu", "get", "ProcessorId"], stderr=subprocess.DEVNULL
            ).decode("utf-8", "ignore").split("\\n")[1].strip()
            parts.append(cpu)
        except Exception:
            pass
        try:
            mb = subprocess.check_output(
                ["wmic", "baseboard", "get", "SerialNumber"], stderr=subprocess.DEVNULL
            ).decode("utf-8", "ignore").split("\\n")[1].strip()
            parts.append(mb)
        except Exception:
            pass
    else:
        import uuid
        parts.append(hex(uuid.getnode()))

    raw = "|".join(parts)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class OPAuth:
    def __init__(self, app_id: str, app_secret: str, version: str = "1.0.0"):
        self.app_id    = app_id
        self.app_secret = app_secret
        self.version   = version
        self.session_token: Optional[str] = None
        self._hb_thread: Optional[threading.Thread] = None
        self._hb_stop = threading.Event()

    def login(self, license_key: str) -> AuthResult:
        body = {
            "app_id":      self.app_id,
            "app_secret":  self.app_secret,
            "license_key": license_key,
            "hwid":        get_hwid(),
            "version":     self.version,
        }
        return self._post("/login", body, login=True)

    def check(self) -> bool:
        if not self.session_token: return False
        body = {"app_id": self.app_id, "session_token": self.session_token, "hwid": get_hwid()}
        return self._post("/check", body).valid

    def heartbeat(self) -> bool:
        if not self.session_token: return False
        body = {"app_id": self.app_id, "session_token": self.session_token, "hwid": get_hwid()}
        return self._post("/heartbeat", body).valid

    def start_heartbeat(self, interval_seconds: int = 60,
                        on_invalidated: Optional[Callable[[], None]] = None):
        self.stop_heartbeat()
        self._hb_stop.clear()
        def loop():
            while not self._hb_stop.wait(interval_seconds):
                if not self.heartbeat():
                    if on_invalidated: on_invalidated()
                    return
        self._hb_thread = threading.Thread(target=loop, daemon=True)
        self._hb_thread.start()

    def stop_heartbeat(self):
        self._hb_stop.set()
        if self._hb_thread and self._hb_thread.is_alive():
            self._hb_thread.join(timeout=2)

    def _post(self, path: str, body: dict, login: bool = False) -> AuthResult:
        try:
            r = requests.post(BASE_URL + path, json=body, timeout=10)
            d = r.json()
        except Exception as e:
            return AuthResult(message=str(e))
        result = AuthResult(
            success=bool(d.get("success")),
            valid=bool(d.get("valid")),
            code=d.get("code", ""),
            message=d.get("message", ""),
            session_token=d.get("session_token", ""),
            expires_at=d.get("expires_at", ""),
        )
        if login and result.success:
            self.session_token = result.session_token
        return result`

const PYTHON_USAGE = `# main.py
from op_auth import OPAuth
import sys

auth = OPAuth(
    app_id="__APP_ID__",
    app_secret="YOUR_APP_SECRET_HERE",
    version="1.0.0",
)

key = input("License key: ").strip()
result = auth.login(key)

if not result.success:
    print(f"Auth failed: {result.message} ({result.code})")
    sys.exit(1)

print(f"Authenticated. Session expires: {result.expires_at}")

# Heartbeat every 60 seconds; quit if invalidated
auth.start_heartbeat(60, on_invalidated=lambda: (print("Session lost."), sys.exit(0)))

# ... your main loop here ...
input("Press Enter to quit...\\n")`

// ════════════════════════════════════════════════════════════════
//  Node.js 18+ (built-in fetch)
// ════════════════════════════════════════════════════════════════
const NODEJS_SDK = `// op-auth.js — Node 18+ (uses built-in fetch).
// HWID generation works on Windows out of the box. For Linux/macOS
// it falls back to MAC address via 'os' module.

const crypto = require('crypto')
const { execSync } = require('child_process')
const os = require('os')

const BASE_URL = '__BASE_URL__/api/v1/auth'

function getHwid() {
  const parts = []
  if (process.platform === 'win32') {
    try {
      const cpu = execSync('wmic cpu get ProcessorId', { stdio: ['pipe','pipe','ignore'] })
                  .toString().split('\\n')[1]?.trim() || ''
      parts.push(cpu)
    } catch {}
    try {
      const mb = execSync('wmic baseboard get SerialNumber', { stdio: ['pipe','pipe','ignore'] })
                  .toString().split('\\n')[1]?.trim() || ''
      parts.push(mb)
    } catch {}
  } else {
    const ifaces = os.networkInterfaces()
    for (const name of Object.keys(ifaces)) {
      const mac = ifaces[name]?.find(i => !i.internal)?.mac
      if (mac) { parts.push(mac); break }
    }
  }
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex')
}

class OPAuth {
  constructor(appId, appSecret, version = '1.0.0') {
    this.appId = appId
    this.appSecret = appSecret
    this.version = version
    this.sessionToken = null
    this._hb = null
  }

  async login(licenseKey) {
    const res = await this._post('/login', {
      app_id: this.appId, app_secret: this.appSecret,
      license_key: licenseKey, hwid: getHwid(), version: this.version,
    })
    if (res.success) this.sessionToken = res.session_token
    return res
  }

  async check() {
    if (!this.sessionToken) return false
    const res = await this._post('/check', {
      app_id: this.appId, session_token: this.sessionToken, hwid: getHwid(),
    })
    return res.valid === true
  }

  async heartbeat() {
    if (!this.sessionToken) return false
    const res = await this._post('/heartbeat', {
      app_id: this.appId, session_token: this.sessionToken, hwid: getHwid(),
    })
    return res.valid === true
  }

  startHeartbeat(intervalSeconds, onInvalidated) {
    this.stopHeartbeat()
    this._hb = setInterval(async () => {
      if (!(await this.heartbeat())) {
        this.stopHeartbeat()
        if (onInvalidated) onInvalidated()
      }
    }, intervalSeconds * 1000)
  }

  stopHeartbeat() {
    if (this._hb) { clearInterval(this._hb); this._hb = null }
  }

  async _post(path, body) {
    try {
      const r = await fetch(BASE_URL + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return await r.json()
    } catch (e) {
      return { success: false, valid: false, message: e.message }
    }
  }
}

module.exports = { OPAuth, getHwid }`

const NODEJS_USAGE = `// main.js
const { OPAuth } = require('./op-auth')
const readline = require('readline')

const auth = new OPAuth(
  '__APP_ID__',
  'YOUR_APP_SECRET_HERE',
  '1.0.0'
)

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
rl.question('License key: ', async (key) => {
  const result = await auth.login(key.trim())
  if (!result.success) {
    console.error(\`Auth failed: \${result.message} (\${result.code})\`)
    process.exit(1)
  }

  console.log('Authenticated! Expires:', result.expires_at)

  auth.startHeartbeat(60, () => {
    console.error('Session lost. Exiting.')
    process.exit(0)
  })

  // ... your app logic ...
})`

// ════════════════════════════════════════════════════════════════
//  Java 11+ (HttpClient + Gson)
// ════════════════════════════════════════════════════════════════
const JAVA_SDK = `// OPAuth.java
// Requires Java 11+ (java.net.http) and com.google.gson (any version).
// Maven: <dependency><groupId>com.google.code.gson</groupId>
//        <artifactId>gson</artifactId><version>2.10.1</version></dependency>

import com.google.gson.Gson;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.*;

public class OPAuth {
    private static final String BASE_URL = "__BASE_URL__/api/v1/auth";
    private static final HttpClient HTTP = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10)).build();
    private static final Gson GSON = new Gson();

    private final String appId, appSecret, version;
    private String sessionToken;
    private ScheduledExecutorService hb;

    public OPAuth(String appId, String appSecret, String version) {
        this.appId = appId; this.appSecret = appSecret; this.version = version;
    }

    public static String getHwid() {
        String cpu = "", mb = "";
        try {
            Process p = Runtime.getRuntime().exec(new String[]{"wmic","cpu","get","ProcessorId"});
            String out = new String(p.getInputStream().readAllBytes());
            String[] lines = out.split("\\n");
            if (lines.length >= 2) cpu = lines[1].trim();
        } catch (Exception ignored) {}
        try {
            Process p = Runtime.getRuntime().exec(new String[]{"wmic","baseboard","get","SerialNumber"});
            String out = new String(p.getInputStream().readAllBytes());
            String[] lines = out.split("\\n");
            if (lines.length >= 2) mb = lines[1].trim();
        } catch (Exception ignored) {}

        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest((cpu + "|" + mb).getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) { return ""; }
    }

    public AuthResult login(String licenseKey) {
        Map<String,Object> body = new HashMap<>();
        body.put("app_id", appId); body.put("app_secret", appSecret);
        body.put("license_key", licenseKey); body.put("hwid", getHwid());
        body.put("version", version);
        AuthResult r = post("/login", body);
        if (r.success) sessionToken = r.session_token;
        return r;
    }

    public boolean heartbeat() {
        if (sessionToken == null) return false;
        Map<String,Object> body = new HashMap<>();
        body.put("app_id", appId); body.put("session_token", sessionToken);
        body.put("hwid", getHwid());
        return post("/heartbeat", body).valid;
    }

    public void startHeartbeat(int seconds, Runnable onInvalidated) {
        stopHeartbeat();
        hb = Executors.newSingleThreadScheduledExecutor();
        hb.scheduleAtFixedRate(() -> {
            if (!heartbeat()) {
                stopHeartbeat();
                if (onInvalidated != null) onInvalidated.run();
            }
        }, seconds, seconds, TimeUnit.SECONDS);
    }

    public void stopHeartbeat() {
        if (hb != null) { hb.shutdownNow(); hb = null; }
    }

    private AuthResult post(String path, Map<String,Object> body) {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + path))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(GSON.toJson(body)))
                .timeout(Duration.ofSeconds(10))
                .build();
            HttpResponse<String> res = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
            return GSON.fromJson(res.body(), AuthResult.class);
        } catch (Exception e) {
            AuthResult r = new AuthResult(); r.message = e.getMessage(); return r;
        }
    }

    public static class AuthResult {
        public boolean success, valid;
        public String code, message, session_token, expires_at;
    }
}`

const JAVA_USAGE = `// Main.java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        OPAuth auth = new OPAuth("__APP_ID__", "YOUR_APP_SECRET_HERE", "1.0.0");

        Scanner sc = new Scanner(System.in);
        System.out.print("License key: ");
        String key = sc.nextLine().trim();

        OPAuth.AuthResult result = auth.login(key);
        if (!result.success) {
            System.err.println("Auth failed: " + result.message + " (" + result.code + ")");
            System.exit(1);
        }

        System.out.println("Authenticated. Expires: " + result.expires_at);

        auth.startHeartbeat(60, () -> {
            System.err.println("Session lost. Exiting.");
            System.exit(0);
        });

        // ... your app ...
    }
}`

// ════════════════════════════════════════════════════════════════
//  Raw REST (for anything else — Go, Rust, PHP, Lua, etc.)
// ════════════════════════════════════════════════════════════════
const REST_USAGE = `# 1) Login — exchange license_key + HWID for a session token
curl -X POST __BASE_URL__/api/v1/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{
    "app_id":      "__APP_ID__",
    "app_secret":  "your_app_secret",
    "license_key": "OP-XXXX-XXXX-XXXX-XXXX",
    "hwid":        "sha256_of_cpu_plus_motherboard",
    "version":     "1.0.0"
  }'

# Response:
# {
#   "success": true,
#   "session_token": "ab12cd34...",
#   "expires_at": "2026-06-07T14:32:00Z",
#   "user": { "product": "...", "expires_at": "...", "reseller": "..." }
# }

# 2) Check — one-shot validate (call once at startup after login)
curl -X POST __BASE_URL__/api/v1/auth/check \\
  -H 'Content-Type: application/json' \\
  -d '{
    "app_id":        "__APP_ID__",
    "session_token": "ab12cd34...",
    "hwid":          "sha256_of_cpu_plus_motherboard"
  }'

# 3) Heartbeat — keep the session alive (every 60-120 seconds)
curl -X POST __BASE_URL__/api/v1/auth/heartbeat \\
  -H 'Content-Type: application/json' \\
  -d '{
    "app_id":        "__APP_ID__",
    "session_token": "ab12cd34...",
    "hwid":          "sha256_of_cpu_plus_motherboard"
  }'`

const REST_NOTES = `HWID format: SHA-256 hex of a stable hardware fingerprint.
On Windows we use CPU ProcessorId + Motherboard SerialNumber joined with "|".
You can pick any other stable fingerprint as long as it's the same every time.

All endpoints return JSON with at minimum:
  { "success": bool, "valid": bool, "code": string, "message": string }

On failure, HTTP status is 401 (or 429 for rate limit). "code" is one of the
error codes listed at the bottom of the page.`

// ════════════════════════════════════════════════════════════════
//  Export
// ════════════════════════════════════════════════════════════════
export const LANGUAGES: Record<Language, LanguageSnippet> = {
  csharp: {
    name:     'C# / .NET',
    ext:      'csharp',
    filename: 'OPAuth.cs',
    sdk:      CSHARP_SDK,
    usage:    CSHARP_USAGE,
  },
  vbnet: {
    name:     'VB.NET',
    ext:      'vbnet',
    filename: 'OPAuth.vb',
    sdk:      VBNET_SDK,
    usage:    VBNET_USAGE,
  },
  cpp: {
    name:     'C++',
    ext:      'cpp',
    filename: 'OPAuth.h',
    sdk:      CPP_SDK,
    usage:    CPP_USAGE,
    notes:    'Windows only. Requires nlohmann/json (header-only). Link winhttp.lib + wbemuuid.lib + bcrypt.lib.',
  },
  python: {
    name:     'Python',
    ext:      'python',
    filename: 'op_auth.py',
    install:  'pip install requests',
    sdk:      PYTHON_SDK,
    usage:    PYTHON_USAGE,
  },
  nodejs: {
    name:     'Node.js',
    ext:      'javascript',
    filename: 'op-auth.js',
    sdk:      NODEJS_SDK,
    usage:    NODEJS_USAGE,
    notes:    'Node 18+ for built-in fetch.',
  },
  java: {
    name:     'Java',
    ext:      'java',
    filename: 'OPAuth.java',
    install:  '<dependency><groupId>com.google.code.gson</groupId><artifactId>gson</artifactId><version>2.10.1</version></dependency>',
    sdk:      JAVA_SDK,
    usage:    JAVA_USAGE,
    notes:    'Java 11+ for HttpClient. Requires Gson.',
  },
  rest: {
    name:     'REST (any language)',
    ext:      'bash',
    filename: 'curl examples',
    sdk:      REST_USAGE,
    usage:    REST_NOTES,
  },
}

export const LANGUAGE_ORDER: Language[] = ['csharp', 'cpp', 'python', 'nodejs', 'java', 'vbnet', 'rest']
