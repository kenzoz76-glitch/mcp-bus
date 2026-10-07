import React, { useState } from 'react';
import { ArrowLeftRight, Clock, Train, Volume2, Accessibility, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Station, TransitLine, VehicleTelemetry } from '../types/transit';
import { transitAudio } from '../utils/audioAnnouncer';

interface DiagrammaticSchematicViewProps {
  lines: TransitLine[];
  stations: Station[];
  vehicles: VehicleTelemetry[];
  onSelectStation: (stationId: string) => void;
  onOpenStationDetail: (station: Station) => void;
  onOpenVehicleDetail: (vehicle: VehicleTelemetry) => void;
}

export const DiagrammaticSchematicView: React.FC<DiagrammaticSchematicViewProps> = ({
  lines,
  stations,
  vehicles,
  onSelectStation,
  onOpenStationDetail,
  onOpenVehicleDetail,
}) => {
  const [activeLineId, setActiveLineId] = useState<string>('M1');

  const selectedLine = lines.find((l) => l.id === activeLineId) || lines[0];

  // Station list for selected line
  const lineStations = selectedLine.stationIds
    .map((id) => stations.find((s) => s.id === id))
    .filter((s): s is Station => !!s);

  // Vehicles on this line
  const lineVehicles = vehicles.filter((v) => v.lineId === selectedLine.id);

  const handleAnnounce = (station: Station) => {
    transitAudio.announceArrival(
      selectedLine.name,
      selectedLine.headsignSouth,
      station.platforms[0] || 'Platform 1'
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-y-auto p-4 md:p-6">
      {/* Top Controls & Line Selector */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] tracking-tight">
              Diagrammatic Track Schematic
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Swiss-style linear route representation with real-time train positioning and platform telemetry.
            </p>
          </div>

          {/* Line Selector Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {lines.map((line) => {
              const isSelected = line.id === activeLineId;
              return (
                <button
                  key={line.id}
                  onClick={() => setActiveLineId(line.id)}
                  style={{
                    backgroundColor: isSelected ? line.color : '#f8fafc',
                    color: isSelected ? '#ffffff' : line.color,
                    borderColor: line.color,
                  }}
                  className={`px-3 py-1.5 rounded font-mono font-bold text-xs border transition-all flex items-center gap-2 ${
                    isSelected ? 'shadow-xs scale-102' : 'hover:bg-slate-100'
                  }`}
                >
                  <span>{line.code}</span>
                  <span className="font-sans font-medium text-xs hidden sm:inline">
                    {line.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Line Metadata Banner */}
        <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span
              style={{ backgroundColor: selectedLine.color }}
              className="px-2 py-0.5 text-white font-mono font-bold rounded"
            >
              {selectedLine.code}
            </span>
            <div className="flex items-center gap-1 font-semibold text-[#0f172a]">
              <span>{selectedLine.headsignNorth}</span>
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#94a3b8]" />
              <span>{selectedLine.headsignSouth}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[#475569]">
            <span className="font-mono">
              Cadence: Every {selectedLine.frequencyMinutes} min
            </span>
            <span>·</span>
            <span className="font-mono text-[#059669] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              {lineVehicles.length} Active Trains
            </span>
            <span>·</span>
            <span
              className={`font-semibold ${
                selectedLine.status === 'delayed' ? 'text-[#d97706]' : 'text-[#059669]'
              }`}
            >
              {selectedLine.statusText}
            </span>
          </div>
        </div>
      </div>

      {/* Linear Track Diagram Canvas */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg p-6 shadow-xs relative">
        <div className="text-xs font-mono uppercase tracking-wider text-[#64748b] mb-6 flex items-center justify-between">
          <span>Direction 1: Toward {selectedLine.headsignSouth} (Inbound/Southbound)</span>
          <span className="text-[#1e40af] font-semibold">Live GPS Tracking</span>
        </div>

        {/* Timeline Track Strip */}
        <div className="relative pl-6 md:pl-10 space-y-8 before:absolute before:left-[19px] md:before:left-[35px] before:top-4 before:bottom-6 before:w-1.5 before:rounded-full before:bg-[#e2e8f0]">
          {lineStations.map((station, index) => {
            const isFirst = index === 0;
            const isLast = index === lineStations.length - 1;

            // Check if there is an approaching vehicle between previous station and this station
            const prevStation = index > 0 ? lineStations[index - 1] : null;
            const vehicleEnRoute = lineVehicles.find(
              (v) => v.nextStationId === station.id && v.currentStationId === prevStation?.id
            );

            // Other serving lines for transfer badges
            const transferLines = lines.filter(
              (l) => l.id !== selectedLine.id && station.lines.includes(l.id)
            );

            return (
              <div key={station.id} className="relative group">
                {/* Station Node Marker on the Track Line */}
                <div
                  style={{
                    backgroundColor: station.isInterchange ? '#ffffff' : selectedLine.color,
                    borderColor: selectedLine.color,
                  }}
                  className={`absolute -left-[23px] md:-left-[39px] top-1.5 w-6 h-6 rounded-full border-3 flex items-center justify-center transition-transform group-hover:scale-125 z-10 ${
                    station.isInterchange ? 'shadow-xs' : ''
                  }`}
                >
                  {station.isInterchange && (
                    <div
                      style={{ backgroundColor: selectedLine.color }}
                      className="w-2.5 h-2.5 rounded-full"
                    />
                  )}
                </div>

                {/* Train Moving on Track (Rendered above station node if between stops) */}
                {vehicleEnRoute && (
                  <div
                    onClick={() => onOpenVehicleDetail(vehicleEnRoute)}
                    className="absolute -left-[32px] md:-left-[48px] -top-6 z-20 flex items-center gap-1.5 bg-[#0f172a] text-white px-2 py-1 rounded shadow-md cursor-pointer hover:bg-[#1e40af] transition-colors"
                  >
                    <Train className="w-3.5 h-3.5 text-[#10b981] animate-pulse" />
                    <span className="font-mono text-[11px] font-bold">
                      {vehicleEnRoute.id}
                    </span>
                    <span className="text-[10px] text-[#94a3b8] font-mono">
                      ({vehicleEnRoute.speedKmH}km/h · {vehicleEnRoute.etaNextStationSeconds}s)
                    </span>
                  </div>
                )}

                {/* Station Row Card */}
                <div
                  onClick={() => onSelectStation(station.id)}
                  className="bg-[#faf8ff] border border-[#e2e8f0] hover:border-[#cbd5e1] rounded-lg p-3.5 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-[#0f172a] group-hover:text-[#1e40af] transition-colors">
                        {station.name}
                      </span>
                      <span className="font-mono text-xs text-[#64748b]">
                        [{station.code}]
                      </span>
                      <span className="text-[11px] font-mono bg-white px-1.5 py-0.5 rounded border border-[#cbd5e1] text-[#475569]">
                        Zone {station.zone}
                      </span>
                      {station.accessibility.wheelchair && (
                        <span title="Wheelchair Step-Free Access" className="text-[#059669]">
                          <Accessibility className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#64748b] mt-1 max-w-xl">
                      {station.description}
                    </p>

                    {/* Transfers available */}
                    {transferLines.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs">
                        <span className="text-[11px] font-semibold text-[#475569]">Transfers:</span>
                        {transferLines.map((tl) => (
                          <span
                            key={tl.id}
                            style={{ backgroundColor: tl.color }}
                            className="px-1.5 py-0.2 text-[10px] font-mono font-bold text-white rounded"
                          >
                            {tl.code} {tl.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions & Platform Info */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono text-[#059669] font-bold">
                        Next in ~{2 + ((index * 3) % 5)}m
                      </div>
                      <div className="text-[11px] font-mono text-[#64748b]">
                        {station.platforms[0] || 'Platform 1'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnnounce(station);
                        }}
                        title="Play Station Chime & Announcement"
                        className="p-1.5 rounded border border-[#cbd5e1] bg-white text-[#64748b] hover:text-[#1e40af] hover:border-[#1e40af] transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenStationDetail(station);
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-[#1e40af] text-white rounded hover:bg-[#00288e] transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
