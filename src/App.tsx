/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { WorkstationHeader } from './components/WorkstationHeader';
import { SchedulePanel } from './components/SchedulePanel';
import { TelemetryMap } from './components/TelemetryMap';
import { DiagrammaticSchematicView } from './components/DiagrammaticSchematicView';
import { TripPlannerView } from './components/TripPlannerView';
import { AdvisoriesView } from './components/AdvisoriesView';
import { LtaBusArrivalView } from './components/LtaBusArrivalView';
import { StationDetailModal } from './components/StationDetailModal';
import { VehicleDetailModal } from './components/VehicleDetailModal';
import { STATIONS, TRANSIT_LINES, INITIAL_VEHICLES, SERVICE_ADVISORIES } from './data/transitData';
import { Station, TransitLine, VehicleTelemetry, ServiceAdvisory } from './types/transit';

export default function App() {
  const [activeView, setActiveView] = useState<'workstation' | 'schematic' | 'planner' | 'advisories' | 'lta-bus'>('workstation');
  const [stations] = useState<Station[]>(STATIONS);
  const [lines, setLines] = useState<TransitLine[]>(TRANSIT_LINES);
  const [vehicles, setVehicles] = useState<VehicleTelemetry[]>(INITIAL_VEHICLES);
  const [advisories, setAdvisories] = useState<ServiceAdvisory[]>(SERVICE_ADVISORIES);

  // User selections
  const [selectedStationId, setSelectedStationId] = useState<string | null>('ST-CENTRAL');
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Modals
  const [modalStation, setModalStation] = useState<Station | null>(null);
  const [modalVehicle, setModalVehicle] = useState<VehicleTelemetry | null>(null);

  // Settings
  const [isMuted, setIsMuted] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  // Favorites in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('metropulse_favorites');
      return saved ? JSON.parse(saved) : ['ST-CENTRAL', 'ST-FINANCIAL', 'ST-AIRPORT'];
    } catch {
      return ['ST-CENTRAL', 'ST-FINANCIAL', 'ST-AIRPORT'];
    }
  });

  const toggleFavorite = useCallback((stationId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(stationId)
        ? prev.filter((id) => id !== stationId)
        : [...prev, stationId];
      try {
        localStorage.setItem('metropulse_favorites', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time Vehicle Movement & Seconds Countdown Simulation
  useEffect(() => {
    const simInterval = setInterval(() => {
      setVehicles((prevVehicles) => {
        return prevVehicles.map((vehicle) => {
          const line = lines.find((l) => l.id === vehicle.lineId);
          if (!line) return vehicle;

          let newEta = vehicle.etaNextStationSeconds - 1;
          let newProgress = vehicle.progressPercent + 0.6; // advance ~0.6% each second

          // Check if train has arrived at next station
          if (newProgress >= 100 || newEta <= 0) {
            const currentStationIdx = line.stationIds.indexOf(vehicle.nextStationId);
            let nextStationIdx: number;
            let nextDirection = vehicle.direction;

            if (vehicle.direction === 'southbound') {
              if (currentStationIdx >= line.stationIds.length - 1) {
                // Reverse direction at terminus
                nextDirection = 'northbound';
                nextStationIdx = currentStationIdx - 1;
              } else {
                nextStationIdx = currentStationIdx + 1;
              }
            } else {
              if (currentStationIdx <= 0) {
                // Reverse direction at terminus
                nextDirection = 'southbound';
                nextStationIdx = 1;
              } else {
                nextStationIdx = currentStationIdx - 1;
              }
            }

            const nextStationId = line.stationIds[nextStationIdx] || line.stationIds[0];
            const newSpeed = Math.floor(40 + Math.random() * 35);

            return {
              ...vehicle,
              currentStationId: vehicle.nextStationId,
              nextStationId,
              direction: nextDirection,
              progressPercent: 0,
              etaNextStationSeconds: 120 + Math.floor(Math.random() * 40),
              speedKmH: newSpeed,
              headingDeg: nextDirection === 'southbound' ? 140 : 320,
              occupancyPercent: Math.min(95, Math.max(25, vehicle.occupancyPercent + Math.floor((Math.random() - 0.5) * 8))),
            };
          }

          // Fluctuate speed slightly for realistic motion
          const speedFluctuation = (Math.random() - 0.5) * 2;
          const updatedSpeed = Math.min(85, Math.max(30, Math.round(vehicle.speedKmH + speedFluctuation)));

          return {
            ...vehicle,
            progressPercent: Number(newProgress.toFixed(2)),
            etaNextStationSeconds: Math.max(1, newEta),
            speedKmH: updatedSpeed,
          };
        });
      });
    }, 1000);

    return () => clearInterval(simInterval);
  }, [lines]);

  const handleResetView = () => {
    setSelectedStationId('ST-CENTRAL');
    setSelectedLineId(null);
    setSelectedVehicleId(null);
  };

  const handlePlanTripFrom = (stationId: string) => {
    setActiveView('planner');
  };

  const handlePlanTripTo = (stationId: string) => {
    setActiveView('planner');
  };

  const handleAddAdvisory = (newAdv: ServiceAdvisory) => {
    setAdvisories((prev) => [newAdv, ...prev]);
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${highContrast ? 'bg-[#0f172a] text-[#f8fafc]' : 'bg-[#faf8ff] text-[#131b2e]'}`}>
      {/* Workstation Top Navigation Bar */}
      <WorkstationHeader
        activeView={activeView}
        setActiveView={setActiveView}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        onResetView={handleResetView}
        currentTimeStr={currentTimeStr}
      />

      {/* Main Workstation Body */}
      <main className="flex-1 min-h-0 overflow-hidden relative">
        {activeView === 'workstation' && (
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Left High-Density Schedule Panel (4 to 5 columns) */}
            <div className="lg:col-span-5 xl:col-span-4 h-full overflow-hidden">
              <SchedulePanel
                stations={stations}
                lines={lines}
                vehicles={vehicles}
                selectedStationId={selectedStationId}
                onSelectStation={(id) => {
                  setSelectedStationId(id);
                }}
                selectedLineId={selectedLineId}
                onSelectLine={setSelectedLineId}
                onOpenStationDetail={(st) => setModalStation(st)}
                onOpenVehicleDetail={(v) => setModalVehicle(v)}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            </div>

            {/* Right Live Telemetry Map (7 to 8 columns) */}
            <div className="lg:col-span-7 xl:col-span-8 h-full overflow-hidden relative">
              <TelemetryMap
                stations={stations}
                lines={lines}
                vehicles={vehicles}
                selectedStationId={selectedStationId}
                onSelectStation={(id) => {
                  setSelectedStationId(id);
                }}
                selectedLineId={selectedLineId}
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={setSelectedVehicleId}
                onOpenStationDetail={(st) => setModalStation(st)}
                onOpenVehicleDetail={(v) => setModalVehicle(v)}
                highContrast={highContrast}
              />
            </div>
          </div>
        )}

        {activeView === 'schematic' && (
          <DiagrammaticSchematicView
            lines={lines}
            stations={stations}
            vehicles={vehicles}
            onSelectStation={(id) => {
              setSelectedStationId(id);
            }}
            onOpenStationDetail={(st) => setModalStation(st)}
            onOpenVehicleDetail={(v) => setModalVehicle(v)}
          />
        )}

        {activeView === 'planner' && (
          <TripPlannerView
            stations={stations}
            lines={lines}
            onOpenStationDetail={(st) => setModalStation(st)}
          />
        )}

        {activeView === 'advisories' && (
          <AdvisoriesView
            advisories={advisories}
            lines={lines}
            onAddAdvisory={handleAddAdvisory}
          />
        )}

        {activeView === 'lta-bus' && (
          <LtaBusArrivalView />
        )}
      </main>

      {/* Detail Modals */}
      <StationDetailModal
        station={modalStation}
        onClose={() => setModalStation(null)}
        lines={lines}
        vehicles={vehicles}
        onOpenVehicleDetail={(v) => {
          setModalStation(null);
          setModalVehicle(v);
        }}
        onPlanTripFrom={handlePlanTripFrom}
        onPlanTripTo={handlePlanTripTo}
      />

      <VehicleDetailModal
        vehicle={modalVehicle}
        onClose={() => setModalVehicle(null)}
        lines={lines}
        stations={stations}
      />
    </div>
  );
}
