/**
 * Health check endpoint to monitor API status and environment configuration.
 * Compatible with Vercel Serverless Functions and Express route handlers.
 */
export default function handler(req, res) {
  const hasLtaKey = Boolean(process.env.LTA_ACCOUNT_KEY && process.env.LTA_ACCOUNT_KEY.trim() !== '');

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MetroPulse Transit Engine API',
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    lta: {
      configured: hasLtaKey,
      endpoint: 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival',
      note: hasLtaKey 
        ? 'LTA_ACCOUNT_KEY is configured' 
        : 'LTA_ACCOUNT_KEY is not configured yet. Fallback simulation active.',
    },
    availableRoutes: [
      { path: '/api/health', method: 'GET', description: 'API health monitoring' },
      { path: '/api/bus-arrival', method: 'GET', description: 'LTA BusArrival v3 by BusStopCode & ServiceNo' },
    ],
  });
}
