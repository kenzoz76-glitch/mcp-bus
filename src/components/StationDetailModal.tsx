import React from 'react';
import { X, Volume2, Accessibility, Bike, CheckCircle2, Clock, MapPin, Navigation, ArrowRight, ShieldCheck } from 'lucide-react';
import { Station, TransitLine, VehicleTelemetry } from '../types/transit';
import { transitAudio } from '../utils/audioAnnouncer';

interface StationDetailModalProps {
  station: Station | null;
  onClose: () => void;
  lines: TransitLine[];
  vehicles: VehicleTelemetry[];
  onOpenVehicleDetail: (vehicle: VehicleTelemetry) => void;
  onPlanTripFrom: (stationId: string) => void;
  onPlanTripTo: (stationId: string) => void;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  onClose,
  lines,
  vehicles,
  onOpenVehicleDetail,
  onPlanTripFrom,
  onPlanTripTo,
}) => {
  if (!station) return null;

  const servingLines = lines.filter((l) => station.lines.includes(l.id));

  // Synthesize upcoming arrivals for this station
  const upcomingDepartures = servingLines.flatMap((line) => {
    // Check if there are vehicles heading to this station
    const activeV = vehicles.find((v) => v.lineId === line.id);
    const eta1 = activeV ? activeV.etaNextStationSeconds : 140;
    const eta2 = eta1 + line.frequencyMinutes * 60;

    return [
      {
        line,
        destination: line.headsignSouth,
        platform: station.platforms[0] || 'Platform 1',
        etaSeconds: eta1,
        vehicleId: activeV ? activeV.id : `TRN-${Math.floor(100 + Math.random() * 899)}`,
        status: activeV?.status || 'on-time',
        isRealtime: !!activeV?.gpsLocked,
      },
      {
        line,
        destination: line.headsignNorth,
        platform: station.platforms[1] || 'Platform 2',
        etaSeconds: eta2,
        vehicleId: `TRN-${Math.floor(100 + Math.random() * 899)}`,
        status: 'on-time',
        isRealtime: true,
      },
    ];
  }).sort((a, b) => a.etaSeconds - b.etaSeconds);

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnnounceFirst = () => {
    const first = upcomingDepartures[0];
    if (first) {
      transitAudio.announceArrival(first.line.name, first.destination, first.platform);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-[#cbd5e1] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#faf8ff]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1e40af] text-white flex items-center justify-center font-mono font-bold text-sm">
              {station.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#0f172a] tracking-tight">
                  {station.name}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe] rounded font-semibold">
                  Zone {station.zone}
                </span>
              </div>
              <p className="text-xs text-[#64748b] mt-0.5">
                {station.description}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Route Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[#475569]">Lines:</span>
              {servingLines.map((l) => (
                <span
                  key={l.id}
                  style={{ backgroundColor: l.color }}
                  className="px-2 py-0.5 text-xs font-mono font-bold text-white rounded"
                >
                  {l.code} {l.name}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAnnounceFirst}
                className="px-3 py-1.5 bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] hover:bg-[#d1fae5] rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                <span>Station PA Chime</span>
              </button>
            </div>
          </div>

          {/* Live Departure Board Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                Live Departures & Arrivals
              </h3>
              <span className="text-[11px] font-mono text-[#059669] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                Tabular Real-Time Feed
              </span>
            </div>

            <div className="border border-[#e2e8f0] rounded-lg overflow-hidden divide-y divide-[#e2e8f0]">
              {upcomingDepartures.slice(0, 5).map((dep, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white hover:bg-[#faf8ff] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      style={{ backgroundColor: dep.line.color }}
                      className="px-2 py-0.5 text-xs font-mono font-bold text-white rounded shrink-0"
                    >
                      {dep.line.code}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-[#0f172a]">
                        Toward {dep.destination}
                      </div>
                      <div className="text-xs text-[#64748b] flex items-center gap-2">
                        <span className="font-mono">{dep.platform}</span>
                        <span>·</span>
                        <span className="font-mono text-[#1e40af]">{dep.vehicleId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      style={{ color: dep.isRealtime ? '#059669' : '#64748b' }}
                      className="font-mono text-xl font-bold tracking-tight leading-none tabular-nums"
                    >
                      {formatCountdown(dep.etaSeconds)}
                    </div>
                    <span className="text-[10px] font-mono uppercase text-[#64748b]">
                      {dep.isRealtime ? 'GPS Live' : 'Scheduled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Station Facilities & Accessibility */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-2">
              Station Amenities & Facilities
            </h3>
            <div className="flex flex-wrap gap-2">
              {station.facilities.map((fac, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-[#f1f5f9] text-[#334155] rounded text-xs font-medium border border-[#e2e8f0] flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                  <span>{fac}</span>
                </span>
              ))}
              {station.accessibility.wheelchair && (
                <span className="px-2.5 py-1 bg-[#ecfdf5] text-[#065f46] rounded text-xs font-medium border border-[#a7f3d0] flex items-center gap-1.5">
                  <Accessibility className="w-3.5 h-3.5" />
                  <span>Step-Free Accessible</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer CTAs */}
        <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#faf8ff] flex items-center justify-between">
          <div className="text-xs text-[#64748b]">
            Platform gates: {station.platforms.join(', ')}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onPlanTripFrom(station.id);
                onClose();
              }}
              className="px-3 py-1.5 bg-white border border-[#cbd5e1] hover:bg-[#f1f5f9] text-[#0f172a] rounded text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5 text-[#059669]" />
              <span>Depart From Here</span>
            </button>
            <button
              onClick={() => {
                onPlanTripTo(station.id);
                onClose();
              }}
              className="px-3 py-1.5 bg-[#1e40af] hover:bg-[#00288e] text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Arrive Here</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
