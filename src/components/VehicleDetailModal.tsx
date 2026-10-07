import React from 'react';
import { X, Train, Gauge, Users, Clock, ShieldCheck, Radio, Volume2, Navigation, Activity } from 'lucide-react';
import { Station, TransitLine, VehicleTelemetry } from '../types/transit';
import { transitAudio } from '../utils/audioAnnouncer';

interface VehicleDetailModalProps {
  vehicle: VehicleTelemetry | null;
  onClose: () => void;
  lines: TransitLine[];
  stations: Station[];
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  onClose,
  lines,
  stations,
}) => {
  if (!vehicle) return null;

  const line = lines.find((l) => l.id === vehicle.lineId);
  const currentStation = stations.find((s) => s.id === vehicle.currentStationId);
  const nextStation = stations.find((s) => s.id === vehicle.nextStationId);

  const handleAnnounce = () => {
    if (line && nextStation) {
      transitAudio.announceArrival(line.name, line.headsignSouth, nextStation.platforms[0] || 'Track 1');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-[#cbd5e1] rounded-xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#faf8ff]">
          <div className="flex items-center gap-3">
            <span
              style={{ backgroundColor: line?.color || '#1e40af' }}
              className="px-2.5 py-1 text-white font-mono font-bold text-sm rounded"
            >
              {line?.code || vehicle.lineId}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#0f172a] font-mono tracking-tight">
                  {vehicle.id}
                </h2>
                <span className="text-[11px] font-mono text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
                  GPS LOCKED
                </span>
              </div>
              <p className="text-xs text-[#64748b] mt-0.5">
                {vehicle.vehicleType} · {vehicle.consist}
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Telemetry Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
              <div className="text-xs text-[#64748b] flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#1e40af]" />
                <span>Track Speed</span>
              </div>
              <div className="text-2xl font-bold font-mono text-[#0f172a] mt-1 tabular-nums">
                {vehicle.speedKmH}{' '}
                <span className="text-xs font-normal text-[#64748b]">km/h</span>
              </div>
            </div>

            <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
              <div className="text-xs text-[#64748b] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#059669]" />
                <span>Next Station</span>
              </div>
              <div className="text-2xl font-bold font-mono text-[#059669] mt-1 tabular-nums">
                {Math.floor(vehicle.etaNextStationSeconds / 60)}m {vehicle.etaNextStationSeconds % 60}s
              </div>
            </div>

            <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
              <div className="text-xs text-[#64748b] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#d97706]" />
                <span>Occupancy</span>
              </div>
              <div className="text-2xl font-bold font-mono text-[#0f172a] mt-1 tabular-nums">
                {vehicle.occupancyPercent}%
              </div>
            </div>
          </div>

          {/* Route Progression Strip */}
          <div className="p-4 bg-[#faf8ff] border border-[#e2e8f0] rounded-lg space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
              Route Segment Telemetry
            </div>

            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-[#64748b]">Departed:</span>{' '}
                <span className="font-semibold text-[#0f172a]">
                  {currentStation?.name || 'Previous Station'}
                </span>
              </div>
              <div className="font-mono text-[#64748b]">
                {vehicle.direction.toUpperCase()}
              </div>
              <div>
                <span className="text-[#64748b]">Approaching:</span>{' '}
                <span className="font-semibold text-[#1e40af]">
                  {nextStation?.name || 'Next Stop'}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative w-full h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div
                style={{
                  width: `${vehicle.progressPercent}%`,
                  backgroundColor: line?.color || '#1e40af',
                }}
                className="h-full transition-all duration-500"
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-[#64748b]">
              <span>Progress: {vehicle.progressPercent}%</span>
              <span>Delay Delta: {vehicle.delaySeconds > 0 ? `+${vehicle.delaySeconds}s` : '0s (Nominal)'}</span>
            </div>
          </div>

          {/* Operational Details */}
          <div className="border border-[#e2e8f0] rounded-lg p-3.5 text-xs space-y-2">
            <div className="flex justify-between text-[#475569]">
              <span>Train Operator / Cab ID:</span>
              <span className="font-mono font-semibold text-[#0f172a]">{vehicle.driverId}</span>
            </div>
            <div className="flex justify-between text-[#475569]">
              <span>Signaling Protocol:</span>
              <span className="font-mono text-[#059669]">CBTC Automated (GoA 2)</span>
            </div>
            <div className="flex justify-between text-[#475569]">
              <span>Traction Power:</span>
              <span className="font-mono text-[#0f172a]">750V DC Overhead Catenary (Nominal)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#faf8ff] flex items-center justify-between">
          <button
            onClick={handleAnnounce}
            className="px-3.5 py-1.5 bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] hover:bg-[#d1fae5] rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
            <span>Play PA Announcement</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1e40af] hover:bg-[#00288e] text-white rounded text-xs font-semibold transition-colors"
          >
            Close Telemetry
          </button>
        </div>
      </div>
    </div>
  );
};
