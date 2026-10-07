import React from 'react';
import { Volume2, VolumeX, ShieldAlert, Sparkles, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { transitAudio } from '../utils/audioAnnouncer';

interface WorkstationHeaderProps {
  activeView: 'workstation' | 'schematic' | 'planner' | 'advisories';
  setActiveView: (view: 'workstation' | 'schematic' | 'planner' | 'advisories') => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  onResetView: () => void;
  currentTimeStr: string;
}

export const WorkstationHeader: React.FC<WorkstationHeaderProps> = ({
  activeView,
  setActiveView,
  isMuted,
  setIsMuted,
  highContrast,
  setHighContrast,
  onResetView,
  currentTimeStr,
}) => {
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    transitAudio.setMuted(next);
    if (!next) {
      transitAudio.playChime('station');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#ffffff] border-b border-[#e2e8f0] px-4 md:px-6 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-4 max-w-full">
        {/* Zone 1: Single text element wordmark with live status */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('workstation');
            }}
            className="flex items-center gap-2.5 group text-decoration-none"
          >
            <div className="w-8 h-8 rounded bg-[#1e40af] flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:bg-[#00288e] transition-colors">
              MP
            </div>
            <div className="flex flex-col">
              <span className="text-base md:text-lg font-bold tracking-tight text-[#0f172a] leading-tight">
                MetroPulse Transit Engine
              </span>
              <div className="flex items-center gap-2 text-xs text-[#64748b]">
                <span className="flex items-center gap-1 font-mono text-[11px] text-[#059669]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  LIVE TELEMETRY
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[11px] text-[#475569] tabular-nums">
                  {currentTimeStr}
                </span>
              </div>
            </div>
          </a>
        </div>

        {/* Zone 2: 4-6 clean text navigation links (Top Bar Contract) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          <button
            onClick={() => setActiveView('workstation')}
            className={`px-3 py-1.5 text-xs xl:text-sm font-semibold rounded transition-colors whitespace-nowrap ${
              activeView === 'workstation'
                ? 'bg-[#1e40af] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
            }`}
          >
            Live Workstation
          </button>

          <button
            onClick={() => setActiveView('schematic')}
            className={`px-3 py-1.5 text-xs xl:text-sm font-semibold rounded transition-colors whitespace-nowrap ${
              activeView === 'schematic'
                ? 'bg-[#1e40af] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
            }`}
          >
            Diagrammatic Schematic
          </button>

          <button
            onClick={() => setActiveView('planner')}
            className={`px-3 py-1.5 text-xs xl:text-sm font-semibold rounded transition-colors whitespace-nowrap ${
              activeView === 'planner'
                ? 'bg-[#1e40af] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
            }`}
          >
            Trip Planner
          </button>

          <button
            onClick={() => setActiveView('advisories')}
            className={`px-3 py-1.5 text-xs xl:text-sm font-semibold rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeView === 'advisories'
                ? 'bg-[#1e40af] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
            }`}
          >
            <span>Service Advisories</span>
            <span className="px-1.5 py-0.2 bg-[#fef3c7] text-[#92400e] text-[10px] font-bold rounded">
              1 Alert
            </span>
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute Station PA Chimes' : 'Mute Station PA Chimes'}
            className={`p-2 rounded border text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isMuted
                ? 'bg-[#f8fafc] border-[#cbd5e1] text-[#64748b] hover:bg-[#f1f5f9]'
                : 'bg-[#ecfdf5] border-[#a7f3d0] text-[#059669] hover:bg-[#d1fae5]'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline text-xs font-mono">
              {isMuted ? 'Muted' : 'Audio Live'}
            </span>
          </button>

          <button
            onClick={() => setHighContrast(!highContrast)}
            title="Toggle High-Contrast Dispatch Mode"
            className={`p-2 rounded border text-xs font-medium transition-colors hidden sm:flex items-center gap-1.5 ${
              highContrast
                ? 'bg-[#0f172a] border-[#0f172a] text-white'
                : 'bg-[#ffffff] border-[#cbd5e1] text-[#334155] hover:bg-[#f8fafc]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-xs">Contrast</span>
          </button>

          <button
            onClick={onResetView}
            title="Reset Map & Telemetry View"
            className="p-2 rounded border border-[#cbd5e1] text-[#334155] hover:bg-[#f1f5f9] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer Row */}
      <div className="flex lg:hidden items-center gap-1 pt-2 mt-2 border-t border-[#f1f5f9] overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveView('workstation')}
          className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeView === 'workstation'
              ? 'bg-[#1e40af] text-white'
              : 'text-[#475569] bg-[#f8fafc]'
          }`}
        >
          Live Workstation
        </button>
        <button
          onClick={() => setActiveView('schematic')}
          className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeView === 'schematic'
              ? 'bg-[#1e40af] text-white'
              : 'text-[#475569] bg-[#f8fafc]'
          }`}
        >
          Schematic
        </button>
        <button
          onClick={() => setActiveView('planner')}
          className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeView === 'planner'
              ? 'bg-[#1e40af] text-white'
              : 'text-[#475569] bg-[#f8fafc]'
          }`}
        >
          Trip Planner
        </button>
        <button
          onClick={() => setActiveView('advisories')}
          className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeView === 'advisories'
              ? 'bg-[#1e40af] text-white'
              : 'text-[#475569] bg-[#f8fafc]'
          }`}
        >
          Advisories (1)
        </button>
      </div>
    </header>
  );
};
