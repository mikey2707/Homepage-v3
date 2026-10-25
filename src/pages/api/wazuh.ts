import type { APIRoute } from 'astro';
import http from 'http';

const stripQuotes = (v: string) => v.replace(/^['"]|['"]$/g, '').trim();

let cachedPayload: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30000;

function portainerRequest(
  baseUrl: string,
  path: string,
  apiKey: string,
  method: 'GET' | 'POST' = 'GET',
  bodyObj?: any
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(path, baseUrl);
    const bodyStr = bodyObj ? JSON.stringify(bodyObj) : undefined;
    const headers: Record<string, string | number> = {
      'X-API-Key': apiKey,
    };
    if (bodyStr) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || 9000,
        path: u.pathname + u.search,
        method,
        headers,
        timeout: 4500,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode || 0, body: data }));
      }
    );
    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Portainer request timeout'));
    });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function execInContainer(
  baseUrl: string,
  apiKey: string,
  containerNameOrId: string,
  cmd: string
): Promise<string | null> {
  const createRes = await portainerRequest(
    baseUrl,
    `/api/endpoints/3/docker/containers/${containerNameOrId}/exec`,
    apiKey,
    'POST',
    {
      AttachStdout: true,
      AttachStderr: true,
      Cmd: ['sh', '-c', cmd],
    }
  );
  if (createRes.status !== 201) return null;
  const execId = JSON.parse(createRes.body).Id;
  const startRes = await portainerRequest(
    baseUrl,
    `/api/endpoints/3/docker/exec/${execId}/start`,
    apiKey,
    'POST',
    { Detach: false, Tty: true }
  );
  return startRes.status === 200 ? startRes.body : null;
}

export const GET: APIRoute = async () => {
  const nowMs = Date.now();
  if (cachedPayload && nowMs - cachedAt < CACHE_TTL_MS) {
    return new Response(cachedPayload, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  const PORTAINER_URL = stripQuotes(
    process.env.PORTAINER_URL || import.meta.env.PORTAINER_URL || 'http://portainer.local:9000'
  );
  const PORTAINER_API_KEY = stripQuotes(
    process.env.PORTAINER_API_KEY || import.meta.env.PORTAINER_API_KEY || ''
  );

  // Real homelab baseline snapshot from NPM ingress & CrowdSec/Wazuh SIEM
  const fallback = {
    online: true,
    simulated: true,
    wazuhVmStatus: 'Standby (VM 104 on pve01)',
    edgeCollector: 'Active (Wazuh Agent + CrowdSec IPS + NPM Ingress on docker1)',
    totalRequests: 93842,
    uniqueIps: 1428,
    activeBans: 6,
    topIps: [
      { ip: '50.172.91.26', requests: 46493, target: 'jelly.mikey.host', status: '200 OK', classification: 'Verified Streamer' },
      { ip: '75.0.196.173', requests: 8374, target: 'jelly.mikey.host', status: '101 WS', classification: 'Verified Streamer' },
      { ip: '73.228.165.188', requests: 8195, target: 'jelly.mikey.host', status: '101 WS', classification: 'Verified Streamer' },
      { ip: '98.124.93.134', requests: 7052, target: 'gym.mikey.host', status: '200 OK', classification: 'App Session' },
      { ip: '170.52.182.241', requests: 4492, target: 'jelly.mikey.host', status: '200 OK', classification: 'Verified Streamer' },
      { ip: '98.110.192.161', requests: 3566, target: 'jelly.mikey.host', status: '204 OK', classification: 'Verified Streamer' },
      { ip: '64.57.206.57', requests: 3241, target: 'jelly.mikey.host', status: '204 OK', classification: 'Verified Streamer' },
      { ip: '136.110.22.7', requests: 1504, target: 'portainer.mikey.host', status: '404 Scan', classification: 'Edge Probe' },
    ],
    securityAlerts: [
      { ip: '103.91.65.178', rule: 'http-cve-2021-42013', country: 'MY', asn: 'Gigabit Hosting Sdn Bhd', action: 'BANNED', time: 'Recent' },
      { ip: '47.245.110.93', rule: 'http-cve-probing', country: 'SG', asn: 'Alibaba US Technology Co.', action: 'BANNED', time: 'Recent' },
      { ip: '46.151.178.15', rule: 'http-sensitive-files', country: 'NL', asn: 'Sino Worldwide Trading', action: 'BANNED', time: 'Recent' },
      { ip: '45.156.87.150', rule: 'http-probing', country: 'NL', asn: 'Pfcloud UG', action: 'BANNED', time: 'Recent' },
      { ip: '79.124.58.82', rule: 'http-crawl-non_statics', country: 'BG', asn: 'Tamatiya EOOD', action: 'BANNED', time: 'Recent' },
      { ip: '35.247.64.110', rule: 'http-probing', country: 'US', asn: 'Google Cloud Platform', action: 'BANNED', time: 'Recent' },
    ],
  };

  if (!PORTAINER_API_KEY) {
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  try {
    const npmAwkCmd = `awk '{
      if ($1 ~ /^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$/) {
        ip = $1; host = "default-ingress"; status = $9;
        counts[ip]++; total++;
        if (!(ip in topHost)) topHost[ip] = host;
        lastStatus[ip] = status;
      } else {
        ip = ""; host = $9; status = $4;
        for (i=1; i<=NF; i++) {
          if ($i == "[Client" && $(i+1) ~ /^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+/) {
            ip = $(i+1);
            gsub(/\\]/, "", ip);
            break;
          }
        }
        if (ip != "") {
          counts[ip]++; total++;
          topHost[ip] = host;
          lastStatus[ip] = status;
        }
      }
    } END {
      u = 0;
      for (ip in counts) u++;
      printf "META|%d|%d\\n", total, u;
      for (ip in counts) {
        printf "IP|%d|%s|%s|%s\\n", counts[ip], ip, topHost[ip], lastStatus[ip];
      }
    }' /data/logs/default-host_access.log /data/logs/proxy-host-*_access.log 2>/dev/null | sort -t"|" -k2,2nr | head -n 12`;

    const [npmRaw, crowdsecRaw] = await Promise.all([
      execInContainer(PORTAINER_URL, PORTAINER_API_KEY, 'nginx-proxy-manager', npmAwkCmd).catch(() => null),
      execInContainer(
        PORTAINER_URL,
        PORTAINER_API_KEY,
        'crowdsec',
        'cscli alerts list -l 6 -o json 2>/dev/null'
      ).catch(() => null),
    ]);

    let totalRequests = fallback.totalRequests;
    let uniqueIps = fallback.uniqueIps;
    const topIps: typeof fallback.topIps = [];

    if (npmRaw) {
      const lines = npmRaw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.startsWith('META|')) {
          const parts = line.split('|');
          totalRequests = parseInt(parts[1], 10) || fallback.totalRequests;
          uniqueIps = parseInt(parts[2], 10) || fallback.uniqueIps;
        } else if (line.startsWith('IP|') && topIps.length < 8) {
          const parts = line.split('|');
          const reqCount = parseInt(parts[1], 10) || 0;
          const ip = parts[2] || '';
          const target = parts[3] || 'default-ingress';
          const code = parts[4] || '200';
          if (ip && reqCount > 0) {
            const isBlockedOrScan = code === '444' || code === '404' || code === '403' || target === 'default-ingress';
            topIps.push({
              ip,
              requests: reqCount,
              target,
              status: code === '101' ? '101 WS' : code === '444' ? '444 DROP' : `${code}`,
              classification: isBlockedOrScan ? 'Edge Probe / Filtered' : 'Verified Client',
            });
          }
        }
      }
    }

    let securityAlerts = fallback.securityAlerts;
    if (crowdsecRaw) {
      try {
        const jsonStart = crowdsecRaw.indexOf('[');
        if (jsonStart !== -1) {
          const parsed = JSON.parse(crowdsecRaw.slice(jsonStart));
          if (Array.isArray(parsed) && parsed.length > 0) {
            securityAlerts = parsed.slice(0, 6).map((a: any) => {
              const rawIp = String(a.source?.value || a.source?.ip || 'Unknown').replace(/^Ip:/i, '');
              const rawRule = String(a.scenario || 'crowdsecurity/http-probing').replace(/^crowdsecurity\//, '');
              return {
                ip: rawIp,
                rule: rawRule,
                country: a.source?.cn || 'EXT',
                asn: a.source?.as_name || a.source?.as_number || 'External ASN',
                action: 'BANNED',
                time: a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active',
              };
            });
          }
        }
      } catch {
        // Keep fallback alerts if JSON parse fails
      }
    }

    const payloadStr = JSON.stringify({
      online: true,
      simulated: topIps.length === 0,
      wazuhVmStatus: fallback.wazuhVmStatus,
      edgeCollector: fallback.edgeCollector,
      totalRequests,
      uniqueIps,
      activeBans: securityAlerts.length,
      topIps: topIps.length > 0 ? topIps : fallback.topIps,
      securityAlerts,
    });

    cachedPayload = payloadStr;
    cachedAt = Date.now();

    return new Response(payloadStr, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.warn('[Wazuh/Edge Logs] Falling back to baseline snapshot:', err);
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
};
