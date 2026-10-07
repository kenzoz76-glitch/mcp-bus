export type TransitMode = 'metro' | 'express' | 'tram' | 'rail';

export interface Station {
  id: string;
  name: string;
  code: string;
  x: number; // SVG map coordinate
  y: number; // SVG map coordinate
  lines: string[]; // line IDs
  platforms: string[];
  zone: number;
  accessibility: {
    wheelchair: boolean;
    elevators: boolean;
    tactilePaving: boolean;
    bikeRacks: boolean;
  };
  facilities: string[];
  isInterchange: boolean;
  description: string;
}

export interface TransitLine {
  id: string;
  code: string;
  name: string;
  mode: TransitMode;
  color: string;
  textColor: string;
  status: 'normal' | 'delayed' | 'maintenance';
  statusText: string;
  frequencyMinutes: number;
  stationIds: string[];
  headsignNorth: string;
  headsignSouth: string;
}

export interface VehicleTelemetry {
  id: string;
  lineId: string;
  vehicleType: string;
  consist: string; // e.g. "6-Car EMU Bombardier Movia"
  speedKmH: number;
  headingDeg: number;
  direction: 'northbound' | 'southbound';
  currentStationId: string;
  nextStationId: string;
  progressPercent: number; // 0 to 100 between current and next station
  etaNextStationSeconds: number;
  occupancyPercent: number; // 0 to 100
  status: 'on-time' | 'delayed' | 'approaching' | 'boarding';
  delaySeconds: number;
  driverId: string;
  gpsLocked: boolean;
  x?: number; // computed live coordinate
  y?: number;
}

export interface ArrivalSchedule {
  id: string;
  lineId: string;
  destination: string;
  platform: string;
  scheduledTime: string;
  estimatedSeconds: number; // live countdown
  status: 'approaching' | 'on-time' | 'delayed' | 'cancelled';
  delayMinutes: number;
  isRealtime: boolean;
  occupancy: 'light' | 'moderate' | 'crowded';
  vehicleId: string;
}

export interface ServiceAdvisory {
  id: string;
  lineId?: string;
  severity: 'minor' | 'moderate' | 'critical' | 'info';
  title: string;
  description: string;
  delayMinutes: number;
  updatedAt: string;
  active: boolean;
}

export interface RouteStep {
  type: 'board' | 'ride' | 'transfer' | 'alight';
  lineId?: string;
  stationName: string;
  details: string;
  stopsCount?: number;
  durationMinutes: number;
}

export interface TripPlanResult {
  originStationId: string;
  destinationStationId: string;
  totalMinutes: number;
  transfersCount: number;
  departureTime: string;
  arrivalTime: string;
  steps: RouteStep[];
  linesUsed: string[];
}
