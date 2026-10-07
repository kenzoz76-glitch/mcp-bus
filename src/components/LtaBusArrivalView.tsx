import React, { useState, useEffect } from 'react';
import { Bus, RefreshCw, Clock, CheckCircle2, AlertCircle, Search, Users, Accessibility, Layers, ArrowRight } from 'lucide-react';

interface NextBusInfo {
  OriginCode?: string;
  DestinationCode?: string;
  EstimatedArrival?: string;
  Latitude?: string;
  Longitude?: string;
  VisitNumber?: string;
  Load?: 'SEA' | 'SDA' | 'LSD' | string;
  Feature?: string;
  Type?: 'SD' | 'DD' | 'BD' | string;
}

interface LtaService {
  ServiceNo: string;
  Operator: string;
  NextBus?: NextBusInfo;
  NextBus2?: NextBusInfo;
  NextBus3?: NextBusInfo;
}

interface LtaResponse {
  BusStopCode?: string;
  Services?: LtaService[];
  _note?: string;
  _configured?: boolean;
  error?: string;
}

export const LtaBusArrivalView: React.FC = () => {
  const [busStopCode, setBusStopCode] = useState('04121');
  const [serviceNo, setServiceNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LtaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [apiHealth, setApiHealth] = useState<{ status: string; ltaConfigured: boolean } | null>(null);

  // Check health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((h) => {
        setApiHealth({
          status: h.status,
          ltaConfigured: Boolean(h.lta?.configured),
        });
      })
      .catch(() => {});
  }, []);

  const fetchArrivals = async (stopCode = busStopCode, svc = serviceNo) => {
    if (!stopCode.trim()) return;
    setLoading(true);
    setError(null);

    try {
      let url = `/api/bus-arrival?BusStopCode=${encodeURIComponent(stopCode.trim())}`;
      if (svc.trim()) {
        url += `&ServiceNo=${encodeURIComponent(svc.trim())}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      setData(json);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArrivals();
  }, []);

  // 20-second cadence auto-refresh (as per LTA specification)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchArrivals();
    }, 20000);
    return () => clearInterval(interval);
  }, [autoRefresh, busStopCode, serviceNo]);

  // Compute minutes difference from ISO timestamp
  const getMinutesUntil = (isoTimestamp?: string) => {
    if (!isoTimestamp) return null;
    const arrivalTime = new Date(isoTimestamp).getTime();
    const now = Date.now();
    const diffMs = arrivalTime - now;
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins <= 0) return 'Arr';
    return `${diffMins}m`;
  };

  const getLoadBadge = (load?: string) => {
    switch (load) {
      case 'SEA':
        return { label: 'Seats Available', bg: 'bg-[#ecfdf5]', text: 'text-[#059669]', border: 'border-[#a7f3d0]' };
      case 'SDA':
        return { label: 'Standing Available', bg: 'bg-[#fffbeb]', text: 'text-[#b45309]', border: 'border-[#fde68a]' };
      case 'LSD':
        return { label: 'Limited Standing', bg: 'bg-[#fef2f2]', text: 'text-[#dc2626]', border: 'border-[#fecaca]' };
      default:
        return { label: 'Nominal', bg: 'bg-[#f1f5f9]', text: 'text-[#475569]', border: 'border-[#e2e8f0]' };
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'DD':
        return 'Double Deck';
      case 'BD':
        return 'Bendy';
      case 'SD':
      default:
        return 'Single Deck';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-y-auto p-4 md:p-6">
      <div className="max-w-5xl mx-auto w-full space-y-5">
        {/* Header Banner */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#1e40af] text-white flex items-center justify-center font-bold">
                  <Bus className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-bold text-[#0f172a] tracking-tight">
                  Singapore LTA DataMall v3 Bus Arrivals
                </h2>
              </div>
              <p className="text-xs text-[#64748b] mt-1">
                Direct integration with LTA DataMall v3 endpoint (20-second cadence). Queries live bus arrivals, vehicle capacity, wheelchair accessibility, and double-decker fleet allocations.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              {apiHealth?.ltaConfigured ? (
                <div className="px-2.5 py-1 bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] text-xs font-semibold rounded flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Live LTA Key Active</span>
                </div>
              ) : (
                <div className="px-2.5 py-1 bg-[#eff6ff] border border-[#bfdbfe] text-[#1e40af] text-xs font-semibold rounded flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Ready for LTA_ACCOUNT_KEY</span>
                </div>
              )}
            </div>
          </div>

          {/* Search Controls Form */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4 pt-4 border-t border-[#f1f5f9] items-end">
            <div className="sm:col-span-5">
              <label className="text-xs font-bold text-[#0f172a] mb-1 block">
                BusStopCode (Required)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={busStopCode}
                  onChange={(e) => setBusStopCode(e.target.value)}
                  placeholder="e.g. 04121, 08057, 10018"
                  className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-sm font-mono font-semibold text-[#0f172a] focus:ring-2 focus:ring-[#1e40af] outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label className="text-xs font-bold text-[#0f172a] mb-1 block">
                ServiceNo (Optional Filter)
              </label>
              <input
                type="text"
                value={serviceNo}
                onChange={(e) => setServiceNo(e.target.value)}
                placeholder="e.g. 7, 14, 106, 111"
                className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-sm font-mono font-semibold text-[#0f172a] focus:ring-2 focus:ring-[#1e40af] outline-none"
              />
            </div>

            <div className="sm:col-span-3 flex items-center gap-2">
              <button
                onClick={() => fetchArrivals(busStopCode, serviceNo)}
                disabled={loading}
                className="flex-1 py-2 px-3 bg-[#1e40af] hover:bg-[#00288e] text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Refreshing...' : 'Query Arrival'}</span>
              </button>

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                title="Toggle 20s auto-refresh interval"
                className={`p-2 rounded border text-xs font-mono font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#059669]'
                    : 'bg-white border-[#cbd5e1] text-[#64748b]'
                }`}
              >
                20s
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-2 mt-3 text-xs text-[#64748b] overflow-x-auto pb-1 scrollbar-none">
            <span className="font-semibold text-[#0f172a] shrink-0">Preset Bus Stops:</span>
            {[
              { code: '04121', name: 'Victoria St (Bugis)' },
              { code: '08057', name: 'Orchard Blvd' },
              { code: '10018', name: 'HarbourFront Stn' },
              { code: '01012', name: 'Victoria St (Hotel Grand Pacific)' },
            ].map((p) => (
              <button
                key={p.code}
                onClick={() => {
                  setBusStopCode(p.code);
                  setServiceNo('');
                  fetchArrivals(p.code, '');
                }}
                className={`px-2 py-0.5 rounded text-xs border font-mono transition-colors shrink-0 ${
                  busStopCode === p.code
                    ? 'bg-[#eff6ff] border-[#bfdbfe] text-[#1e40af] font-bold'
                    : 'bg-[#f8fafc] border-[#e2e8f0] text-[#475569] hover:bg-[#f1f5f9]'
                }`}
              >
                {p.code} ({p.name})
              </button>
            ))}
          </div>
        </div>

        {/* Status Strip */}
        <div className="flex items-center justify-between text-xs text-[#64748b] px-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[#0f172a]">
              STOP #{busStopCode || '04121'}
            </span>
            <span>·</span>
            <span>{data?.Services?.length || 0} Bus Services operating</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            {lastRefreshed && <span>Updated at {lastRefreshed}</span>}
            <span className="text-[#059669] flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              20s CADENCE
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-xs text-[#b91c1c] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Error fetching LTA arrivals: {error}</span>
          </div>
        )}

        {/* Services Arrival Table Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data?.Services?.map((svc) => {
            const next1 = svc.NextBus;
            const next2 = svc.NextBus2;
            const next3 = svc.NextBus3;

            const min1 = getMinutesUntil(next1?.EstimatedArrival);
            const min2 = getMinutesUntil(next2?.EstimatedArrival);
            const min3 = getMinutesUntil(next3?.EstimatedArrival);

            const load1 = getLoadBadge(next1?.Load);

            return (
              <div
                key={svc.ServiceNo}
                className="bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] rounded-lg p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Top Service Bar */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 bg-[#1e40af] text-white font-mono font-bold text-base rounded shadow-xs">
                        {svc.ServiceNo}
                      </div>
                      <span className="text-xs font-semibold text-[#64748b]">
                        Operator: {svc.Operator}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {next1?.Type && (
                        <span className="px-2 py-0.5 bg-[#f1f5f9] text-[#334155] text-[11px] font-mono font-medium rounded border border-[#e2e8f0]">
                          {getTypeLabel(next1.Type)}
                        </span>
                      )}
                      {next1?.Feature === 'WAB' && (
                        <span title="Wheelchair Accessible Bus" className="p-1 bg-[#ecfdf5] text-[#059669] rounded border border-[#a7f3d0]">
                          <Accessibility className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3 Arrival Slots Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    {/* Next Bus 1 */}
                    <div className="p-2.5 rounded border border-[#e2e8f0] bg-[#faf8ff]">
                      <div className="text-[10px] uppercase font-bold text-[#64748b]">
                        Next Bus
                      </div>
                      <div className="font-mono text-2xl font-bold text-[#059669] my-0.5 tabular-nums">
                        {min1 || '--'}
                      </div>
                      <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-medium ${load1.bg} ${load1.text} ${load1.border}`}>
                        {load1.label}
                      </span>
                    </div>

                    {/* Next Bus 2 */}
                    <div className="p-2.5 rounded border border-[#e2e8f0] bg-white">
                      <div className="text-[10px] uppercase font-bold text-[#64748b]">
                        2nd Bus
                      </div>
                      <div className="font-mono text-2xl font-bold text-[#0f172a] my-0.5 tabular-nums">
                        {min2 || '--'}
                      </div>
                      <span className="text-[10px] text-[#64748b] font-mono">
                        {next2?.Type ? getTypeLabel(next2.Type) : 'En route'}
                      </span>
                    </div>

                    {/* Next Bus 3 */}
                    <div className="p-2.5 rounded border border-[#e2e8f0] bg-white">
                      <div className="text-[10px] uppercase font-bold text-[#64748b]">
                        3rd Bus
                      </div>
                      <div className="font-mono text-2xl font-bold text-[#475569] my-0.5 tabular-nums">
                        {min3 || '--'}
                      </div>
                      <span className="text-[10px] text-[#64748b] font-mono">
                        {next3?.Type ? getTypeLabel(next3.Type) : 'Scheduled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="mt-3 pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-[11px] text-[#64748b]">
                  <span>Origin: {next1?.OriginCode || 'N/A'}</span>
                  <span>Destination: {next1?.DestinationCode || 'N/A'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
