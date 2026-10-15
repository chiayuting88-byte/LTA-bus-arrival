/**
 * Serverless / API Health Check Endpoint
 * Route: GET /api/health
 */

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  ltaKeyConfigured: boolean;
  version: string;
}

export async function checkHealth(): Promise<HealthResponse> {
  const hasKey = Boolean(process.env.LTA_ACCOUNT_KEY || process.env.LTA_API_KEY);
  return {
    status: 'ok',
    service: 'LTA Datamall Bus Arrival API',
    timestamp: new Date().toISOString(),
    ltaKeyConfigured: hasKey,
    version: 'v3',
  };
}

// Node.js / Express / Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  // CORS support
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, AccountKey, accept');

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : new Response(null, { status: 200 });
  }

  const result = await checkHealth();
  if (res.status && typeof res.json === 'function') {
    return res.status(200).json(result);
  }

  // Web API / Edge runtime fallback
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Web Standard GET export (Next.js / Edge / Cloudflare)
export async function GET() {
  const result = await checkHealth();
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
