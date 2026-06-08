/**
 * Code snippet generator for the API docs page.
 * Takes the endpoint + params + sellerkey and renders ready-to-copy code
 * in 14 languages.
 */

export type Language = 'ts' | 'js' | 'py' | 'php' | 'sh' | 'go' | 'jv' | 'kt' | 'cs' | 'rs' | 'rb' | 'sw' | 'lua' | 'ps'

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'ts',  label: 'TS'  },
  { code: 'js',  label: 'JS'  },
  { code: 'py',  label: 'Py'  },
  { code: 'php', label: 'PHP' },
  { code: 'sh',  label: 'sh'  },
  { code: 'go',  label: 'Go'  },
  { code: 'jv',  label: 'Jv'  },
  { code: 'kt',  label: 'Kt'  },
  { code: 'cs',  label: 'C#'  },
  { code: 'rs',  label: 'Rs'  },
  { code: 'rb',  label: 'Rb'  },
  { code: 'sw',  label: 'Sw'  },
  { code: 'lua', label: 'Lua' },
  { code: 'ps',  label: 'PS'  },
]

interface BuildOpts {
  endpoint: string
  params:   Record<string, string>
  baseUrl:  string
  sellerKey: string
}

function paramsLine(params: Record<string, string>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `  ${k}: '${v.replace(/'/g, "\\'")}'`)
    .join(',\n')
}

export function buildUrl(opts: BuildOpts): string {
  const url = new URL(opts.baseUrl)
  url.searchParams.set('ag', opts.endpoint)
  url.searchParams.set('sellerkey', opts.sellerKey)
  for (const [k, v] of Object.entries(opts.params)) {
    if (v !== '') url.searchParams.set(k, v)
  }
  return url.toString()
}

export function snippet(lang: Language, opts: BuildOpts): string {
  const { endpoint, sellerKey, params, baseUrl } = opts
  const allParams = { ag: endpoint, sellerkey: sellerKey, ...params }

  switch (lang) {
    case 'ts':
    case 'js':
      return `/**
 * OP Seller API — ${endpoint}
 * Works in Node 18+ (global fetch) and modern browsers.
 */
const API_BASE = '${baseUrl}';

const params${lang === 'ts' ? ': Record<string, string>' : ''} = {
${paramsLine(allParams)},
};

async function call() {
  const url = new URL(API_BASE);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '') url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  const data = await res.json();
  console.log('HTTP', res.status, data);
  return data;
}

call().catch(console.error);`

    case 'py':
      return `"""OP Seller API — ${endpoint}"""
import requests

API_BASE = '${baseUrl}'
params = {
${Object.entries(allParams).filter(([,v]) => v !== '').map(([k, v]) => `    '${k}': '${v}'`).join(',\n')},
}

response = requests.get(API_BASE, params=params, headers={'Accept': 'application/json'})
print('HTTP', response.status_code, response.json())`

    case 'php':
      return `<?php
// OP Seller API — ${endpoint}
$apiBase = '${baseUrl}';
$params = [
${Object.entries(allParams).filter(([,v]) => v !== '').map(([k, v]) => `    '${k}' => '${v}'`).join(',\n')},
];

$url = $apiBase . '?' . http_build_query($params);
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json']);
$response = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP $code\\n";
print_r(json_decode($response, true));`

    case 'sh':
      return `# OP Seller API — ${endpoint}
curl -sS -H "Accept: application/json" \\
  "${buildUrl(opts)}" \\
  | jq .`

    case 'go':
      return `// OP Seller API — ${endpoint}
package main

import (
\t"encoding/json"
\t"fmt"
\t"io"
\t"net/http"
\t"net/url"
)

func main() {
\tbase, _ := url.Parse("${baseUrl}")
\tq := base.Query()
${Object.entries(allParams).filter(([,v]) => v !== '').map(([k, v]) => `\tq.Set("${k}", "${v}")`).join('\n')}
\tbase.RawQuery = q.Encode()

\treq, _ := http.NewRequest("GET", base.String(), nil)
\treq.Header.Set("Accept", "application/json")

\tres, err := http.DefaultClient.Do(req)
\tif err != nil { panic(err) }
\tdefer res.Body.Close()

\tbody, _ := io.ReadAll(res.Body)
\tvar data map[string]interface{}
\tjson.Unmarshal(body, &data)
\tfmt.Println("HTTP", res.StatusCode, data)
}`

    case 'jv':
      return `// OP Seller API — ${endpoint} (Java 11+)
import java.net.URI;
import java.net.http.*;
import java.util.*;

public class OPApi {
    public static void main(String[] args) throws Exception {
        String base = "${baseUrl}";
        StringBuilder qs = new StringBuilder();
${Object.entries(allParams).filter(([,v]) => v !== '').map(([k, v]) => `        qs.append("${k}=${encodeURIComponent(v)}&");`).join('\n')}
        String url = base + "?" + qs.substring(0, qs.length() - 1);

        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
            .header("Accept", "application/json").GET().build();
        HttpResponse<String> res = HttpClient.newHttpClient().send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("HTTP " + res.statusCode() + " " + res.body());
    }
}`

    case 'kt':
      return `// OP Seller API — ${endpoint} (Kotlin, ktor or fetch)
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.request.*
import io.ktor.client.statement.*

suspend fun main() {
    val client = HttpClient(CIO)
    val url = "${buildUrl(opts)}"
    val response: HttpResponse = client.get(url) { headers.append("Accept", "application/json") }
    println("HTTP \${response.status} \${response.bodyAsText()}")
    client.close()
}`

    case 'cs':
      return `// OP Seller API — ${endpoint}
using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program {
    static readonly HttpClient http = new();
    static async Task Main() {
        var url = "${buildUrl(opts)}";
        http.DefaultRequestHeaders.Add("Accept", "application/json");
        var res = await http.GetAsync(url);
        var body = await res.Content.ReadAsStringAsync();
        Console.WriteLine($"HTTP {(int)res.StatusCode} {body}");
    }
}`

    case 'rs':
      return `// OP Seller API — ${endpoint} (reqwest)
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), reqwest::Error> {
    let url = "${buildUrl(opts)}";
    let res = Client::new().get(url).header("Accept", "application/json").send().await?;
    let status = res.status();
    let body = res.text().await?;
    println!("HTTP {} {}", status, body);
    Ok(())
}`

    case 'rb':
      return `# OP Seller API — ${endpoint}
require 'net/http'
require 'json'
require 'uri'

uri = URI('${baseUrl}')
uri.query = URI.encode_www_form({
${Object.entries(allParams).filter(([,v]) => v !== '').map(([k, v]) => `  '${k}' => '${v}'`).join(',\n')},
})

response = Net::HTTP.get_response(uri)
puts "HTTP #{response.code} #{JSON.parse(response.body)}"`

    case 'sw':
      return `// OP Seller API — ${endpoint} (Swift 5.5+)
import Foundation

let url = URL(string: "${buildUrl(opts)}")!
var req = URLRequest(url: url)
req.setValue("application/json", forHTTPHeaderField: "Accept")

let (data, response) = try await URLSession.shared.data(for: req)
print("HTTP \\((response as! HTTPURLResponse).statusCode)")
print(String(data: data, encoding: .utf8) ?? "")`

    case 'lua':
      return `-- OP Seller API — ${endpoint} (lua-http or LuaSocket)
local http = require("socket.http")
local ltn12 = require("ltn12")
local response = {}

http.request({
  url     = "${buildUrl(opts)}",
  method  = "GET",
  headers = { ["Accept"] = "application/json" },
  sink    = ltn12.sink.table(response),
})
print(table.concat(response))`

    case 'ps':
      return `# OP Seller API — ${endpoint} (PowerShell)
$url = "${buildUrl(opts)}"
$response = Invoke-RestMethod -Uri $url -Method Get -Headers @{ Accept = "application/json" }
$response | ConvertTo-Json -Depth 10`
  }
}

function encodeURIComponent(s: string): string {
  return s.replace(/[&=?#]/g, c => '%' + c.charCodeAt(0).toString(16))
}
