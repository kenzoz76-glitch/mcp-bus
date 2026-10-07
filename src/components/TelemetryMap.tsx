import React, { useState, useRef, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Radio, Navigation2, Train, Info, Layers, Compass, Volume2, Clock, Users, Gauge } from 'lucide-react';
import { Station, TransitLine, VehicleTelemetry } from '../types/transit';
import { transitAudio } from '../utils/audioAnnouncer';

interface TelemetryMapProps {
  stations: Station[];
  lines: TransitLine[];
  vehicles: VehicleTelemetry[];
  selectedStationId: string | null;
  onSelectStation: (stationId: string) => void;
  selectedLineId: string | null;
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string | null) => void;
  onOpenStationDetail: (station: Station) => void;
  onOpenVehicleDetail: (vehicle: VehicleTelemetry) => void;
  highContrast: boolean;
}

export const TelemetryMap: React.FC<TelemetryMapProps> = ({
  stations,
  lines,
  vehicles,
  selectedStationId,
  onSelectStation,
  selectedLineId,
  selectedVehicleId,
  onSelectVehicle,
  onOpenStationDetail,
  onOpenVehicleDetail,
  highContrast,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showLabels, setShowLabels] = useState(true);
  const [showTrafficOverlay, setShowTrafficOverlay] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Map station lookup by ID
  const stationMap = useMemo(() => {
    const map = new Map<string, Station>();
    stations.forEach((s) => map.set(s.id, s));
    return map;
  }, [stations]);

  // Compute live vehicle coordinates interpolated between current and next station
  const vehiclesWithCoords = useMemo(() => {
    return vehicles.map((v) => {
      const current = stationMap.get(v.currentStationId);
      const next = stationMap.get(v.nextStationId);
      if (!current || !next) {
        return { ...v, x: 500, y: 350 };
      }

      const t = v.progressPercent / 100;
      // Linear interpolation with slight offset so dual tracks don't overlap
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const offsetDist = v.direction === 'northbound' ? -6 : 6;

      const x = current.x + dx * t + nx * offsetDist;
      const y = current.y + dy * t + ny * offsetDist;

      return { ...v, x, y };
    });
  }, [vehicles, stationMap]);

  // Selected vehicle object
  const activeVehicle = useMemo(() => {
    return vehiclesWithCoords.find((v) => v.id === selectedVehicleId) || null;
  }, [vehiclesWithCoords, selectedVehicleId]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(2.5, Math.max(0.6, prev + delta)));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    onSelectVehicle(null);
  };

  // Center map on specific station
  const centerOnStation = (station: Station) => {
    onSelectStation(station.id);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing ${
        highContrast ? 'bg-[#0f172a]' : 'bg-[#faf8ff]'
      }`}
    >
      {/* HUD Map Control Bar (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-[#cbd5e1] rounded p-1 shadow-sm">
        <button
          onClick={() => handleZoom(0.2)}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155] transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.2)}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155] transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-[#e2e8f0]" />
        <button
          onClick={handleReset}
          title="Reset Frame"
          className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155] transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-[#e2e8f0]" />
        <button
          onClick={() => setShowLabels(!showLabels)}
          title="Toggle Station Labels"
          className={`p-1.5 rounded transition-colors text-xs font-semibold flex items-center gap-1 ${
            showLabels ? 'bg-[#eff6ff] text-[#1e40af]' : 'text-[#64748b] hover:bg-[#f1f5f9]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="hidden sm:inline">Labels</span>
        </button>
        <button
          onClick={() => setShowTrafficOverlay(!showTrafficOverlay)}
          title="Toggle Speed & Signal Overlays"
          className={`p-1.5 rounded transition-colors text-xs font-semibold flex items-center gap-1 ${
            showTrafficOverlay ? 'bg-[#ecfdf5] text-[#059669]' : 'text-[#64748b] hover:bg-[#f1f5f9]'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span className="hidden sm:inline">Pings</span>
        </button>
      </div>

      {/* Network Legend (Top Right) */}
      <div className="absolute top-4 right-4 z-20 hidden md:flex flex-col gap-1 bg-white/95 backdrop-blur-xs border border-[#cbd5e1] rounded p-2.5 shadow-sm text-xs max-w-xs">
        <div className="text-[11px] font-bold text-[#0f172a] uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Active Lines</span>
          <span className="font-mono text-[#059669] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            9 TRAINS
          </span>
        </div>
        {lines.map((line) => {
          const isFaded = selectedLineId && selectedLineId !== line.id;
          return (
            <div
              key={line.id}
              className={`flex items-center justify-between gap-3 transition-opacity ${
                isFaded ? 'opacity-30' : 'opacity-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  style={{ backgroundColor: line.color }}
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                />
                <span className="font-semibold text-[#0f172a]">{line.name}</span>
              </div>
              <span className="font-mono text-[11px] text-[#64748b]">{line.code}</span>
            </div>
          );
        })}
      </div>

      {/* SVG Canvas */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <svg
          viewBox="0 0 1000 720"
          className="w-full h-full max-w-[1400px] pointer-events-auto"
          style={{ minWidth: '950px', minHeight: '680px' }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke={highContrast ? '#1e293b' : '#e2e8f0'}
                strokeWidth="0.8"
              />
            </pattern>

            {/* Glowing filter for vehicles */}
            <filter id="vehicle-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="1000" height="720" fill="url(#grid)" />

          {/* Geographic River & Bay Elements */}
          <path
            d="M 0 620 C 240 600, 360 670, 520 630 C 660 590, 780 660, 1000 640 L 1000 720 L 0 720 Z"
            fill={highContrast ? '#162238' : '#e2edfc'}
            stroke={highContrast ? '#1e293b' : '#cbd5e1'}
            strokeWidth="1.5"
          />
          <path
            d="M 680 0 C 690 180, 610 240, 600 350 C 590 460, 510 500, 480 620"
            fill="none"
            stroke={highContrast ? '#162238' : '#e2edfc'}
            strokeWidth="32"
            strokeLinecap="round"
          />

          {/* Transit Lines Paths */}
          {lines.map((line) => {
            const lineStations = line.stationIds
              .map((id) => stationMap.get(id))
              .filter((s): s is Station => !!s);

            if (lineStations.length < 2) return null;

            const isLineActive = !selectedLineId || selectedLineId === line.id;
            const pathData = lineStations.reduce((acc, st, idx) => {
              return idx === 0 ? `M ${st.x} ${st.y}` : `${acc} L ${st.x} ${st.y}`;
            }, '');

            return (
              <g key={line.id} opacity={isLineActive ? 1 : 0.2}>
                {/* Outer shadow / casing */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={highContrast ? '#020617' : '#ffffff'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Main colored transit track */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={line.color}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Dashed track center line for technical aesthetic */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  strokeDasharray="4 6"
                  opacity="0.6"
                />
              </g>
            );
          })}

          {/* Station Markers */}
          {stations.map((station) => {
            const isSelected = selectedStationId === station.id;
            const servingLines = lines.filter((l) => station.lines.includes(l.id));
            const primaryLine = servingLines[0];

            return (
              <g
                key={station.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectStation(station.id);
                }}
                className="cursor-pointer group"
              >
                {/* Highlight Pulse Ring when Selected */}
                {isSelected && (
                  <circle
                    cx={station.x}
                    cy={station.y}
                    r="20"
                    fill="none"
                    stroke="#1e40af"
                    strokeWidth="2.5"
                    className="animate-ping"
                    opacity="0.4"
                  />
                )}

                {/* Station Node Outer Disk */}
                {station.isInterchange ? (
                  // Multi-line interchange station
                  <g>
                    <circle
                      cx={station.x}
                      cy={station.y}
                      r="12"
                      fill={highContrast ? '#0f172a' : '#ffffff'}
                      stroke="#0f172a"
                      strokeWidth="3"
                    />
                    <circle
                      cx={station.x}
                      cy={station.y}
                      r="6"
                      fill={primaryLine ? primaryLine.color : '#1e40af'}
                    />
                  </g>
                ) : (
                  // Standard station node
                  <circle
                    cx={station.x}
                    cy={station.y}
                    r="6.5"
                    fill={highContrast ? '#0f172a' : '#ffffff'}
                    stroke={primaryLine ? primaryLine.color : '#0f172a'}
                    strokeWidth="3"
                    className="group-hover:scale-125 transition-transform origin-center"
                  />
                )}

                {/* Station Label */}
                {showLabels && (
                  <g>
                    {/* Text background pill for legibility */}
                    <rect
                      x={station.x + 10}
                      y={station.y - 10}
                      width={station.name.length * 6.5 + 24}
                      height="20"
                      rx="3"
                      fill={highContrast ? '#0f172a' : '#ffffff'}
                      stroke={isSelected ? '#1e40af' : highContrast ? '#334155' : '#cbd5e1'}
                      strokeWidth={isSelected ? '1.5' : '0.8'}
                      opacity="0.95"
                    />
                    <text
                      x={station.x + 14}
                      y={station.y + 4}
                      fill={highContrast ? '#f8fafc' : '#0f172a'}
                      fontSize="11"
                      fontWeight={isSelected ? '700' : '600'}
                      fontFamily="Hanken Grotesk, sans-serif"
                    >
                      {station.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Live Moving Vehicles */}
          {vehiclesWithCoords.map((vehicle) => {
            const line = lines.find((l) => l.id === vehicle.lineId);
            const isSelected = selectedVehicleId === vehicle.id;
            const lineColor = line ? line.color : '#1e40af';

            return (
              <g
                key={vehicle.id}
                transform={`translate(${vehicle.x}, ${vehicle.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVehicle(vehicle.id);
                }}
                className="cursor-pointer group"
              >
                {/* Live GPS ping ripple */}
                {showTrafficOverlay && vehicle.gpsLocked && (
                  <circle
                    r="16"
                    fill={lineColor}
                    opacity="0.25"
                    className="animate-ping"
                  />
                )}

                {/* Vehicle Marker Disk (Vector disk with high-contrast 2px solid white ring) */}
                <circle
                  r="9"
                  fill={lineColor}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  filter="url(#vehicle-glow)"
                  className="transition-transform group-hover:scale-125"
                />

                {/* Heading Arrow Icon */}
                <polygon
                  points="0,-4 3,3 -3,3"
                  fill="#ffffff"
                  transform={`rotate(${vehicle.headingDeg})`}
                />

                {/* Vehicle ID & Speed Floating Tag */}
                <g transform="translate(12, -8)">
                  <rect
                    width="70"
                    height="18"
                    rx="2"
                    fill={isSelected ? '#1e40af' : '#0f172a'}
                    stroke="#ffffff"
                    strokeWidth="1"
                    opacity="0.95"
                  />
                  <text
                    x="4"
                    y="12"
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {vehicle.id} · {vehicle.speedKmH}k
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating HUD Telemetry Drawer (Level 3 Elevation) */}
      {activeVehicle && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-30 bg-white border border-[#cbd5e1] rounded-lg shadow-[0_10px_25px_-5px_rgba(15,23,42,0.12)] p-4 transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-2">
              <span
                style={{
                  backgroundColor:
                    lines.find((l) => l.id === activeVehicle.lineId)?.color || '#1e40af',
                }}
                className="px-2 py-0.5 text-xs font-mono font-bold text-white rounded"
              >
                {activeVehicle.lineId}
              </span>
              <span className="font-mono text-sm font-bold text-[#0f172a]">
                {activeVehicle.id}
              </span>
              <span className="text-xs text-[#64748b]">
                ({activeVehicle.vehicleType})
              </span>
            </div>

            <button
              onClick={() => onSelectVehicle(null)}
              className="text-[#94a3b8] hover:text-[#0f172a] text-sm p-1"
            >
              ✕
            </button>
          </div>

          {/* Real-time Telemetry Grid */}
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="p-2 bg-[#f8fafc] rounded border border-[#e2e8f0]">
              <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                <Gauge className="w-3.5 h-3.5 text-[#1e40af]" />
                <span>Track Speed</span>
              </div>
              <div className="font-mono text-lg font-bold text-[#0f172a] mt-0.5">
                {activeVehicle.speedKmH}{' '}
                <span className="text-xs font-normal text-[#64748b]">km/h</span>
              </div>
            </div>

            <div className="p-2 bg-[#f8fafc] rounded border border-[#e2e8f0]">
              <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                <Clock className="w-3.5 h-3.5 text-[#059669]" />
                <span>Next Stop ETA</span>
              </div>
              <div className="font-mono text-lg font-bold text-[#059669] mt-0.5">
                {Math.floor(activeVehicle.etaNextStationSeconds / 60)}m{' '}
                {activeVehicle.etaNextStationSeconds % 60}s
              </div>
            </div>
          </div>

          {/* Next Station Indicator */}
          <div className="mt-3 p-2 bg-[#f1f5f9] rounded text-xs space-y-1">
            <div className="flex items-center justify-between text-[#475569]">
              <span>Next Station:</span>
              <span className="font-semibold text-[#0f172a]">
                {stationMap.get(activeVehicle.nextStationId)?.name || 'Next Terminal'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#475569]">
              <span>Train Consist:</span>
              <span className="font-mono text-[11px] text-[#0f172a]">
                {activeVehicle.consist}
              </span>
            </div>
          </div>

          {/* Occupancy Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-[#64748b] mb-1">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>Passenger Load</span>
              </span>
              <span className="font-mono font-bold text-[#0f172a]">
                {activeVehicle.occupancyPercent}% (Seated)
              </span>
            </div>
            <div className="w-full h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div
                style={{
                  width: `${activeVehicle.occupancyPercent}%`,
                  backgroundColor:
                    activeVehicle.occupancyPercent > 80
                      ? '#dc2626'
                      : activeVehicle.occupancyPercent > 50
                      ? '#d97706'
                      : '#059669',
                }}
                className="h-full transition-all duration-300"
              />
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-3 pt-2 border-t border-[#e2e8f0] flex items-center justify-between gap-2">
            <button
              onClick={() => {
                const st = stationMap.get(activeVehicle.nextStationId);
                const line = lines.find((l) => l.id === activeVehicle.lineId);
                if (st && line) {
                  transitAudio.announceArrival(line.name, line.headsignSouth, st.platforms[0] || 'Track 1');
                }
              }}
              className="flex-1 py-1.5 px-2 bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] hover:bg-[#d1fae5] rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Announce Arrival</span>
            </button>

            <button
              onClick={() => onOpenVehicleDetail(activeVehicle)}
              className="py-1.5 px-3 bg-[#1e40af] hover:bg-[#00288e] text-white rounded text-xs font-semibold transition-colors"
            >
              Telemetry Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
