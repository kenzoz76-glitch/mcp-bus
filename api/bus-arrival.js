/**
 * LTA DataMall v3 BusArrival endpoint
 * GET /api/bus-arrival?BusStopCode=04121[&ServiceNo=7]
 *
 * Header sent to LTA: AccountKey: process.env.LTA_ACCOUNT_KEY
 * Upstream LTA API refreshes every 20 seconds.
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse query parameters
  const query = req.query || {};
  const busStopCode = query.BusStopCode || query.busStopCode;
  const serviceNo = query.ServiceNo || query.serviceNo;

  if (!busStopCode) {
    return res.status(400).json({
      error: 'BusStopCode is required',
      example: '/api/bus-arrival?BusStopCode=04121&ServiceNo=7',
    });
  }

  const accountKey = process.env.LTA_ACCOUNT_KEY ? process.env.LTA_ACCOUNT_KEY.trim() : '';

  // Set response caching according to LTA 20-second cadence
  res.setHeader('Cache-Control', 'public, s-maxage=20, max-age=20, stale-while-revalidate=10');

  // If real LTA_ACCOUNT_KEY is configured, fetch live DataMall v3
  if (accountKey) {
    try {
      const url = new URL('https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival');
      url.searchParams.set('BusStopCode', String(busStopCode));
      if (serviceNo) {
        url.searchParams.set('ServiceNo', String(serviceNo));
      }

      const ltaResponse = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          AccountKey: accountKey,
          accept: 'application/json',
        },
      });

      if (!ltaResponse.ok) {
        const errorText = await ltaResponse.text();
        return res.status(ltaResponse.status).json({
          error: `LTA DataMall API responded with status ${ltaResponse.status}`,
          details: errorText,
          busStopCode,
        });
      }

      const data = await ltaResponse.json();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(502).json({
        error: 'Failed to contact LTA DataMall gateway',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Fallback when LTA_ACCOUNT_KEY has not yet been configured in environment variables
  const now = new Date();
  const formatTime = (offsetMinutes) => {
    return new Date(now.getTime() + offsetMinutes * 60 * 1000).toISOString();
  };

  const sampleServices = [
    { service: '7', operator: 'SBST', dest: '16009', m1: 2, m2: 8, m3: 16 },
    { service: '14', operator: 'SBST', dest: '84009', m1: 4, m2: 12, m3: 22 },
    { service: '16', operator: 'SBST', dest: '84009', m1: 6, m2: 15, m3: 25 },
    { service: '36', operator: 'GAS', dest: '95009', m1: 3, m2: 11, m3: 19 },
    { service: '77', operator: 'SMRT', dest: '42009', m1: 7, m2: 18, m3: 28 },
    { service: '106', operator: 'TTS', dest: '28009', m1: 1, m2: 9, m3: 17 },
    { service: '111', operator: 'SBST', dest: '11009', m1: 5, m2: 14, m3: 24 },
  ];

  const matched = serviceNo
    ? sampleServices.filter((s) => s.service === String(serviceNo))
    : sampleServices;

  const mockServices = (matched.length > 0 ? matched : [{ service: String(serviceNo), operator: 'SBST', dest: '00000', m1: 5, m2: 15, m3: 25 }]).map((item) => ({
    ServiceNo: item.service,
    Operator: item.operator,
    NextBus: {
      OriginCode: '01012',
      DestinationCode: item.dest,
      EstimatedArrival: formatTime(item.m1),
      Latitude: '1.29342',
      Longitude: '103.85215',
      VisitNumber: '1',
      Load: item.m1 <= 2 ? 'SDA' : 'SEA', // SEA: Seats Available, SDA: Standing Available, LSD: Limited Standing
      Feature: 'WAB', // Wheelchair Accessible Bus
      Type: item.service === '7' || item.service === '106' ? 'DD' : 'SD', // DD: Double Deck, SD: Single Deck
    },
    NextBus2: {
      OriginCode: '01012',
      DestinationCode: item.dest,
      EstimatedArrival: formatTime(item.m2),
      Latitude: '1.29811',
      Longitude: '103.85623',
      VisitNumber: '1',
      Load: 'SEA',
      Feature: 'WAB',
      Type: 'SD',
    },
    NextBus3: {
      OriginCode: '01012',
      DestinationCode: item.dest,
      EstimatedArrival: formatTime(item.m3),
      Latitude: '1.30250',
      Longitude: '103.86110',
      VisitNumber: '1',
      Load: 'SEA',
      Feature: 'WAB',
      Type: 'SD',
    },
  }));

  return res.status(200).json({
    'odata.metadata': 'https://datamall2.mytransport.sg/ltaodataservice/v3/$metadata#BusArrivalv3/@Element',
    BusStopCode: String(busStopCode),
    Services: mockServices,
    _note: 'LTA_ACCOUNT_KEY is not set yet in environment variables. Returning simulated LTA DataMall v3 schema.',
    _configured: false,
  });
}
