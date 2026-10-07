import React, { useState } from 'react';
import { ArrowLeftRight, Clock, Navigation, MapPin, ArrowRight, CornerDownRight, CheckCircle2, Sparkles, Volume2 } from 'lucide-react';
import { Station, TransitLine, TripPlanResult } from '../types/transit';
import { calculateTrip } from '../utils/tripPlanner';
import { transitAudio } from '../utils/audioAnnouncer';

interface TripPlannerViewProps {
  stations: Station[];
  lines: TransitLine[];
  onOpenStationDetail: (station: Station) => void;
}

export const TripPlannerView: React.FC<TripPlannerViewProps> = ({
  stations,
  lines,
  onOpenStationDetail,
}) => {
  const [originId, setOriginId] = useState<string>('ST-AIRPORT');
  const [destinationId, setDestinationId] = useState<string>('ST-MARITIME');
  const [planResult, setPlanResult] = useState<TripPlanResult | null>(() =>
    calculateTrip('ST-AIRPORT', 'ST-MARITIME')
  );

  const handleCompute = (orig = originId, dest = destinationId) => {
    const result = calculateTrip(orig, dest);
    setPlanResult(result);
  };

  const handleSwap = () => {
    const temp = originId;
    setOriginId(destinationId);
    setDestinationId(temp);
    handleCompute(destinationId, temp);
  };

  const setPreset = (orig: string, dest: string) => {
    setOriginId(orig);
    setDestinationId(dest);
    handleCompute(orig, dest);
  };

  const handleAnnounceFirstLeg = () => {
    if (!planResult || !planResult.steps[0]) return;
    const origin = stations.find((s) => s.id === originId);
    const line = lines.find((l) => l.id === planResult.linesUsed[0]);
    if (origin && line) {
      transitAudio.announceArrival(line.name, line.headsignSouth, 'Platform 1');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-5 shadow-xs">
          <h2 className="text-xl font-bold text-[#0f172a] tracking-tight">
            Intermodal Trip Navigator
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Calculate the quickest route, transfer gates, and real-time departure windows across the network.
          </p>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[#64748b] font-medium shrink-0">Popular Routes:</span>
            <button
              onClick={() => setPreset('ST-AIRPORT', 'ST-CENTRAL')}
              className="px-2.5 py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] rounded font-medium transition-colors shrink-0"
            >
              Airport → Central Hub
            </button>
            <button
              onClick={() => setPreset('ST-NORTH', 'ST-TECH')}
              className="px-2.5 py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] rounded font-medium transition-colors shrink-0"
            >
              North Heights → Tech Park
            </button>
            <button
              onClick={() => setPreset('ST-OLDTOWN', 'ST-HARBOR')}
              className="px-2.5 py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] rounded font-medium transition-colors shrink-0"
            >
              Old Town → Harbor Gateway
            </button>
          </div>

          {/* Origin & Destination Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center mt-4 pt-4 border-t border-[#f1f5f9]">
            {/* Origin */}
            <div className="md:col-span-5 space-y-1">
              <label className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#059669]" />
                <span>Origin Station</span>
              </label>
              <select
                value={originId}
                onChange={(e) => {
                  setOriginId(e.target.value);
                  handleCompute(e.target.value, destinationId);
                }}
                className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-sm text-[#0f172a] focus:ring-2 focus:ring-[#1e40af] outline-none font-medium"
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.code}) - Zone {st.zone}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex justify-center pt-5">
              <button
                onClick={handleSwap}
                title="Swap origin and destination"
                className="p-2 rounded-full border border-[#cbd5e1] bg-[#f8fafc] hover:bg-[#e2e8f0] text-[#475569] transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Destination */}
            <div className="md:col-span-5 space-y-1">
              <label className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#1e40af]" />
                <span>Destination Station</span>
              </label>
              <select
                value={destinationId}
                onChange={(e) => {
                  setDestinationId(e.target.value);
                  handleCompute(originId, e.target.value);
                }}
                className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-sm text-[#0f172a] focus:ring-2 focus:ring-[#1e40af] outline-none font-medium"
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.code}) - Zone {st.zone}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Route Solution Card */}
        {planResult ? (
          <div className="bg-white border border-[#e2e8f0] rounded-lg p-5 shadow-xs space-y-5">
            {/* Summary Top Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#eff6ff] text-[#1e40af] flex items-center justify-center font-bold text-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#0f172a] font-mono tracking-tight tabular-nums">
                    {planResult.totalMinutes} min
                  </div>
                  <div className="text-xs text-[#64748b]">
                    Departs {planResult.departureTime} · Arrives ~{planResult.arrivalTime}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-semibold text-[#0f172a]">
                    {planResult.transfersCount === 0 ? 'Direct Route (No Transfers)' : `${planResult.transfersCount} Transfer`}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 justify-end">
                    {planResult.linesUsed.map((lineId) => {
                      const line = lines.find((l) => l.id === lineId);
                      return (
                        <span
                          key={lineId}
                          style={{ backgroundColor: line?.color || '#1e40af' }}
                          className="px-2 py-0.5 text-xs font-mono font-bold text-white rounded"
                        >
                          {line?.code || lineId}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleAnnounceFirstLeg}
                  className="px-3 py-2 bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] hover:bg-[#d1fae5] rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Audio Alert</span>
                </button>
              </div>
            </div>

            {/* Step-by-Step Itinerary */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                Step-by-Step Directions
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#cbd5e1]">
                {planResult.steps.map((step, idx) => {
                  const line = step.lineId ? lines.find((l) => l.id === step.lineId) : null;

                  return (
                    <div key={idx} className="relative group">
                      {/* Step Indicator Marker */}
                      <div
                        style={{
                          backgroundColor:
                            step.type === 'transfer'
                              ? '#d97706'
                              : step.type === 'alight'
                              ? '#059669'
                              : line?.color || '#1e40af',
                        }}
                        className="absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-[10px] text-white font-bold"
                      />

                      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-sm text-[#0f172a] flex items-center gap-2">
                            <span>{step.stationName}</span>
                            {line && (
                              <span
                                style={{ backgroundColor: line.color }}
                                className="px-1.5 py-0.2 text-[10px] font-mono font-bold text-white rounded"
                              >
                                {line.code}
                              </span>
                            )}
                          </div>
                          {step.durationMinutes > 0 && (
                            <span className="font-mono text-xs text-[#64748b]">
                              ~{step.durationMinutes} min
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#475569] mt-1">
                          {step.details}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#e2e8f0] rounded-lg p-8 text-center">
            <p className="text-sm text-[#64748b]">
              Please select different origin and destination stations to calculate an itinerary.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
