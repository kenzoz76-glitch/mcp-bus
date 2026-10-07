import React, { useState } from 'react';
import { Search, Star, Radio, Volume2, Navigation, ArrowRight, ShieldAlert, Sparkles, Filter, X } from 'lucide-react';
import { Station, TransitLine, TransitMode, VehicleTelemetry } from '../types/transit';
import { transitAudio } from '../utils/audioAnnouncer';

interface SchedulePanelProps {
  stations: Station[];
  lines: TransitLine[];
  vehicles: VehicleTelemetry[];
  selectedStationId: string | null;
  onSelectStation: (stationId: string) => void;
  selectedLineId: string | null;
  onSelectLine: (lineId: string | null) => void;
  onOpenStationDetail: (station: Station) => void;
  onOpenVehicleDetail: (vehicle: VehicleTelemetry) => void;
  favorites: string[];
  onToggleFavorite: (stationId: string) => void;
}

export const SchedulePanel: React.FC<SchedulePanelProps> = ({
  stations,
  lines,
  vehicles,
  selectedStationId,
  onSelectStation,
  selectedLineId,
  onSelectLine,
  onOpenStationDetail,
  onOpenVehicleDetail,
  favorites,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<TransitMode | 'all'>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Compute station arrival telemetry
  const stationRows = stations.map((station) => {
    // Find lines serving this station
    const servingLines = lines.filter((l) => station.lines.includes(l.id));

    // Find nearest approaching vehicles
    const approachingVehicles = vehicles
      .filter((v) => v.nextStationId === station.id || v.currentStationId === station.id)
      .sort((a, b) => a.etaNextStationSeconds - b.etaNextStationSeconds);

    const nextVehicle = approachingVehicles[0];
    const primaryLine = servingLines[0] || lines[0];

    // Compute synthetic countdown if no vehicle directly linked
    const lineIndex = primaryLine ? lines.indexOf(primaryLine) : 0;
    const fallbackSeconds = 120 + ((station.name.length * 37) % 360);
    const etaSeconds = nextVehicle ? nextVehicle.etaNextStationSeconds : fallbackSeconds;

    return {
      station,
      servingLines,
      primaryLine,
      nextVehicle,
      etaSeconds,
      isRealtime: !!nextVehicle?.gpsLocked,
      isApproaching: etaSeconds <= 90,
      isDelayed: (nextVehicle?.delaySeconds || 0) > 60 || primaryLine?.status === 'delayed',
    };
  });

  // Filter based on query, mode, line, and favorites
  const filteredRows = stationRows.filter(({ station, servingLines }) => {
    if (showOnlyFavorites && !favorites.includes(station.id)) {
      return false;
    }

    if (selectedMode !== 'all') {
      const hasMode = servingLines.some((l) => l.mode === selectedMode);
      if (!hasMode) return false;
    }

    if (selectedLineId) {
      if (!station.lines.includes(selectedLineId)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = station.name.toLowerCase().includes(q);
      const matchesCode = station.code.toLowerCase().includes(q);
      const matchesLine = servingLines.some((l) => l.code.toLowerCase().includes(q) || l.name.toLowerCase().includes(q));
      if (!matchesName && !matchesCode && !matchesLine) return false;
    }

    return true;
  });

  // Format seconds to mm:ss
  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnnounceStation = (e: React.MouseEvent, station: Station, line: TransitLine) => {
    e.stopPropagation();
    transitAudio.announceArrival(line.name, line.headsignSouth, station.platforms[0] || 'Platform 1');
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] border-r border-[#e2e8f0]">
      {/* Top Controls Header */}
      <div className="p-3.5 bg-white border-b border-[#e2e8f0] space-y-3">
        {/* Mode Segmented Controls */}
        <div className="flex items-center gap-1 p-1 bg-[#f1f5f9] rounded">
          <button
            onClick={() => setSelectedMode('all')}
            className={`flex-1 py-1 px-2 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              selectedMode === 'all'
                ? 'bg-white text-[#0f172a] shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            All Modes
          </button>
          <button
            onClick={() => setSelectedMode('metro')}
            className={`flex-1 py-1 px-2 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              selectedMode === 'metro'
                ? 'bg-white text-[#0f172a] shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Metro
          </button>
          <button
            onClick={() => setSelectedMode('express')}
            className={`flex-1 py-1 px-2 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              selectedMode === 'express'
                ? 'bg-white text-[#0f172a] shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Express
          </button>
          <button
            onClick={() => setSelectedMode('tram')}
            className={`flex-1 py-1 px-2 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              selectedMode === 'tram'
                ? 'bg-white text-[#0f172a] shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Tram
          </button>
          <button
            onClick={() => setSelectedMode('rail')}
            className={`flex-1 py-1 px-2 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              selectedMode === 'rail'
                ? 'bg-white text-[#0f172a] shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Regional
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94a3b8]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search station, line (M1, T1), or code..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-[#cbd5e1] rounded text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-[#1e40af] transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#94a3b8] hover:text-[#475569]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Transit Line Chips Bar & Favorites Toggle */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pt-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onSelectLine(null)}
              className={`px-2 py-1 text-xs font-mono font-medium rounded transition-colors ${
                selectedLineId === null
                  ? 'bg-[#1e40af] text-white'
                  : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
              }`}
            >
              ALL
            </button>
            {lines.map((line) => {
              const isSelected = selectedLineId === line.id;
              return (
                <button
                  key={line.id}
                  onClick={() => onSelectLine(isSelected ? null : line.id)}
                  style={{
                    backgroundColor: isSelected ? line.color : '#f8fafc',
                    color: isSelected ? '#ffffff' : line.color,
                    borderColor: line.color,
                  }}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded border transition-colors flex items-center gap-1 ${
                    isSelected ? 'shadow-xs' : 'hover:bg-slate-100'
                  }`}
                >
                  <span>{line.code}</span>
                  {line.status === 'delayed' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            title="Show saved favorite stations"
            className={`p-1.5 rounded border transition-colors shrink-0 flex items-center gap-1 text-xs ${
              showOnlyFavorites
                ? 'bg-[#fef9c3] border-[#fde047] text-[#a16207]'
                : 'bg-white border-[#cbd5e1] text-[#64748b] hover:bg-[#f8fafc]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-[#eab308] text-[#eab308]' : ''}`} />
            <span className="text-[11px] font-medium hidden sm:inline">Favorites</span>
          </button>
        </div>
      </div>

      {/* Live Operational Status Strip */}
      <div className="px-3.5 py-1.5 bg-[#f1f5f9] border-b border-[#e2e8f0] flex items-center justify-between text-xs text-[#475569]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-[#0f172a]">
            {filteredRows.length} STATIONS
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-[11px]">Next approaching trains</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#059669]">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
          <span>GPS SYNC</span>
        </div>
      </div>

      {/* High-Density Station Cards List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#e2e8f0] p-2 space-y-2">
        {filteredRows.length === 0 ? (
          <div className="p-8 text-center bg-white rounded border border-[#e2e8f0]">
            <Radio className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
            <div className="text-sm font-semibold text-[#0f172a]">No stations found</div>
            <p className="text-xs text-[#64748b] mt-1">
              Try adjusting your mode filter or search query.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedMode('all');
                onSelectLine(null);
                setShowOnlyFavorites(false);
              }}
              className="mt-3 px-3 py-1.5 text-xs font-semibold bg-[#1e40af] text-white rounded hover:bg-[#00288e]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredRows.map(({ station, servingLines, primaryLine, nextVehicle, etaSeconds, isRealtime, isApproaching, isDelayed }) => {
            const isSelected = selectedStationId === station.id;
            const isFavorite = favorites.includes(station.id);

            return (
              <div
                key={station.id}
                onClick={() => onSelectStation(station.id)}
                className={`group relative bg-white border rounded transition-all cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'border-[#1e40af] shadow-[0_2px_4px_rgba(15,23,42,0.08)] ring-1 ring-[#1e40af]'
                    : 'border-[#e2e8f0] hover:border-[#cbd5e1] hover:shadow-xs'
                }`}
              >
                {/* 4px Vertical Route Color Stripe on Left Border */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: primaryLine ? primaryLine.color : '#1e40af' }}
                />

                <div className="pl-3.5 pr-3 py-2.5 flex items-center justify-between gap-3">
                  {/* Left Metadata Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-bold text-[#0f172a] truncate tracking-tight">
                        {station.name}
                      </h3>
                      <span className="font-mono text-[11px] text-[#64748b] font-medium">
                        [{station.code}]
                      </span>
                      {station.isInterchange && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1e40af] bg-[#eff6ff] px-1.5 py-0.2 rounded border border-[#bfdbfe]">
                          HUB
                        </span>
                      )}
                    </div>

                    {/* Route badges line */}
                    <div className="flex items-center gap-1.5 mt-1">
                      {servingLines.map((l) => (
                        <span
                          key={l.id}
                          style={{ backgroundColor: l.color }}
                          className="px-1.5 py-0.2 text-[10px] font-mono font-bold text-white rounded-sm shrink-0"
                        >
                          {l.code}
                        </span>
                      ))}
                      <span className="text-xs text-[#64748b] truncate">
                        {primaryLine ? primaryLine.headsignSouth : 'Metro Central'}
                      </span>
                    </div>

                    {/* Status Pill Badge & Platform */}
                    <div className="flex items-center gap-2 mt-1.5 text-xs">
                      {isApproaching ? (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#059669] text-[10px] font-bold uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
                          <span>Approaching</span>
                        </div>
                      ) : isDelayed ? (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#fffbeb] border border-[#fde68a] text-[#b45309] text-[10px] font-bold">
                          <span>Delayed +4m</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] text-[10px] font-semibold">
                          <span>On Time</span>
                        </div>
                      )}

                      <span className="text-[#94a3b8]">·</span>
                      <span className="text-[11px] text-[#64748b] font-mono">
                        {station.platforms[0] || 'Platform 1'}
                      </span>

                      {nextVehicle && (
                        <>
                          <span className="text-[#94a3b8]">·</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenVehicleDetail(nextVehicle);
                            }}
                            className="text-[11px] font-mono text-[#1e40af] hover:underline"
                          >
                            {nextVehicle.id}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Section: Monospaced Real-Time Countdown Clock */}
                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(station.id);
                        }}
                        title={isFavorite ? 'Remove from favorites' : 'Save as favorite'}
                        className="text-[#94a3b8] hover:text-[#eab308] p-1 transition-colors"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            isFavorite ? 'fill-[#eab308] text-[#eab308]' : ''
                          }`}
                        />
                      </button>

                      <button
                        onClick={(e) => handleAnnounceStation(e, station, primaryLine)}
                        title="Play Station Audio Chime & Announcement"
                        className="text-[#94a3b8] hover:text-[#1e40af] p-1 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div
                      style={{ color: isRealtime ? '#059669' : '#64748b' }}
                      className="font-mono text-2xl font-bold tracking-tight leading-none tabular-nums mt-1"
                    >
                      {formatCountdown(etaSeconds)}
                    </div>

                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748b] mt-0.5">
                      {isRealtime ? 'GPS Live' : 'Timetable'}
                    </span>
                  </div>
                </div>

                {/* Expanded Action Bar on Selection */}
                {isSelected && (
                  <div className="px-3.5 py-2 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#475569]">
                      <span className="font-mono text-[11px]">
                        Zone {station.zone}
                      </span>
                      <span>·</span>
                      <span>{station.platforms.length} Platforms</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenStationDetail(station);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-[#1e40af] text-white rounded hover:bg-[#00288e] flex items-center gap-1"
                      >
                        <span>Full Board</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
