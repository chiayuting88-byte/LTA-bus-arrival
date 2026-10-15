/**
 * Serverless / API Bus Arrival Endpoint
 * Route: GET /api/busarrival?BusStopCode=83139(&ServiceNo=...)
 * 
 * Proxies live data from LTA Datamall v3 BusArrival endpoint:
 * https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival
 */

const LTA_DATAMALL_URL = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

export interface LtaBusArrivalQuery {
  busStopCode?: string;
  serviceNo?: string;
}

export async function fetchLtaBusArrival(query: LtaBusArrivalQuery, accountKey?: string) {
  const { busStopCode, serviceNo } = query;

  if (!busStopCode) {
    return {
      status: 400,
      data: {
        error: 'Missing required parameter: BusStopCode',
        example: '/api/busarrival?BusStopCode=83139',
      },
    };
  }

  // Key is retrieved from environment or request headers - never hardcoded
  const resolvedKey =
    accountKey ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_API_KEY;

  if (!resolvedKey) {
    return {
      status: 401,
      data: {
        error: 'LTA_ACCOUNT_KEY is not configured',
        message: 'Please set the LTA_ACCOUNT_KEY environment variable to pull live data from LTA Datamall.',
        requestedStopCode: busStopCode,
      },
    };
  }

  // Construct target URL
  const targetUrl = new URL(LTA_DATAMALL_URL);
  targetUrl.searchParams.set('BusStopCode', busStopCode);
  if (serviceNo) {
    targetUrl.searchParams.set('ServiceNo', serviceNo);
  }

  try {
    const upstreamRes = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        AccountKey: resolvedKey,
        accept: 'application/json',
      },
    });

    const contentType = upstreamRes.headers.get('content-type') || '';
    let responseData;
    if (contentType.includes('application/json')) {
      responseData = await upstreamRes.json();
    } else {
      responseData = { raw: await upstreamRes.text() };
    }

    return {
      status: upstreamRes.status,
      data: responseData,
    };
  } catch (err: any) {
    return {
      status: 502,
      data: {
        error: 'Failed to connect to LTA Datamall',
        details: err.message,
      },
    };
  }
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

  // Parse parameters from Express/Vercel req or standard URL
  const busStopCode =
    req.query?.BusStopCode ||
    req.query?.busStopCode ||
    req.query?.busstopcode;

  const serviceNo =
    req.query?.ServiceNo ||
    req.query?.serviceNo;

  // Header override if passed from client
  const clientKey =
    req.headers?.['accountkey'] ||
    req.headers?.['x-account-key'];

  const result = await fetchLtaBusArrival({ busStopCode, serviceNo }, clientKey);

  if (res.status && typeof res.json === 'function') {
    return res.status(result.status).json(result.data);
  }

  // Fallback for Web API Request/Response
  return new Response(JSON.stringify(result.data), {
    status: result.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Web Standard GET export (Next.js App Router / Edge runtime / Cloudflare Workers)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const busStopCode = url.searchParams.get('BusStopCode') || url.searchParams.get('busStopCode') || undefined;
  const serviceNo = url.searchParams.get('ServiceNo') || url.searchParams.get('serviceNo') || undefined;
  const clientKey = request.headers.get('accountkey') || request.headers.get('x-account-key') || undefined;

  const result = await fetchLtaBusArrival({ busStopCode, serviceNo }, clientKey);

  return new Response(JSON.stringify(result.data), {
    status: result.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
