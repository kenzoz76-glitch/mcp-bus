import { STATIONS, TRANSIT_LINES } from '../data/transitData';
import { RouteStep, TripPlanResult } from '../types/transit';

export function calculateTrip(originId: string, destinationId: string): TripPlanResult | null {
  if (originId === destinationId) return null;

  const origin = STATIONS.find(s => s.id === originId);
  const destination = STATIONS.find(s => s.id === destinationId);
  if (!origin || !destination) return null;

  const now = new Date();
  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  // 1. Check for direct line
  const commonLines = origin.lines.filter(l => destination.lines.includes(l));
  if (commonLines.length > 0) {
    const lineId = commonLines[0];
    const line = TRANSIT_LINES.find(l => l.id === lineId)!;
    const originIdx = line.stationIds.indexOf(originId);
    const destIdx = line.stationIds.indexOf(destinationId);
    const stopsCount = Math.abs(destIdx - originIdx);
    const rideMinutes = Math.max(3, stopsCount * 3);
    const totalMinutes = rideMinutes + 2; // 2 min boarding cushion

    const departure = new Date(now.getTime() + 2 * 60 * 1000);
    const arrival = new Date(departure.getTime() + rideMinutes * 60 * 1000);

    const headsign = destIdx > originIdx ? line.headsignSouth : line.headsignNorth;

    const steps: RouteStep[] = [
      {
        type: 'board',
        lineId: line.id,
        stationName: origin.name,
        details: `Board ${line.name} (${line.code}) toward ${headsign} from Platform 1`,
        durationMinutes: 2,
      },
      {
        type: 'ride',
        lineId: line.id,
        stationName: `${stopsCount} stops via ${line.code}`,
        details: `Ride ${stopsCount} stations (${rideMinutes} mins)`,
        stopsCount,
        durationMinutes: rideMinutes,
      },
      {
        type: 'alight',
        lineId: line.id,
        stationName: destination.name,
        details: `Arrive at ${destination.name}. Exit to concourse or transfer gates.`,
        durationMinutes: 0,
      },
    ];

    return {
      originStationId: originId,
      destinationStationId: destinationId,
      totalMinutes,
      transfersCount: 0,
      departureTime: formatTime(departure),
      arrivalTime: formatTime(arrival),
      steps,
      linesUsed: [lineId],
    };
  }

  // 2. Check for 1-transfer connection through interchange stations
  // Interchanges in our network: 'ST-CENTRAL' (M1, M2, M3, R1) and 'ST-FINANCIAL' (M1, T1)
  const transferCandidates = ['ST-CENTRAL', 'ST-FINANCIAL'];

  for (const transferId of transferCandidates) {
    const transferStation = STATIONS.find(s => s.id === transferId);
    if (!transferStation) continue;

    const leg1Lines = origin.lines.filter(l => transferStation.lines.includes(l));
    const leg2Lines = transferStation.lines.filter(l => destination.lines.includes(l));

    if (leg1Lines.length > 0 && leg2Lines.length > 0) {
      const line1 = TRANSIT_LINES.find(l => l.id === leg1Lines[0])!;
      const line2 = TRANSIT_LINES.find(l => l.id === leg2Lines[0])!;

      const oIdx = line1.stationIds.indexOf(originId);
      const t1Idx = line1.stationIds.indexOf(transferId);
      const stopsLeg1 = Math.abs(t1Idx - oIdx);
      const minLeg1 = Math.max(3, stopsLeg1 * 3);

      const t2Idx = line2.stationIds.indexOf(transferId);
      const dIdx = line2.stationIds.indexOf(destinationId);
      const stopsLeg2 = Math.abs(dIdx - t2Idx);
      const minLeg2 = Math.max(3, stopsLeg2 * 3);

      const transferWaitMin = 4;
      const totalMinutes = minLeg1 + transferWaitMin + minLeg2 + 2;

      const departure = new Date(now.getTime() + 2 * 60 * 1000);
      const arrival = new Date(departure.getTime() + (totalMinutes - 2) * 60 * 1000);

      const headsign1 = t1Idx > oIdx ? line1.headsignSouth : line1.headsignNorth;
      const headsign2 = dIdx > t2Idx ? line2.headsignSouth : line2.headsignNorth;

      const steps: RouteStep[] = [
        {
          type: 'board',
          lineId: line1.id,
          stationName: origin.name,
          details: `Board ${line1.name} (${line1.code}) toward ${headsign1}`,
          durationMinutes: 2,
        },
        {
          type: 'ride',
          lineId: line1.id,
          stationName: `${stopsLeg1} stops on ${line1.code}`,
          details: `Ride ${stopsLeg1} stops to ${transferStation.name}`,
          stopsCount: stopsLeg1,
          durationMinutes: minLeg1,
        },
        {
          type: 'transfer',
          stationName: transferStation.name,
          details: `Transfer at ${transferStation.name} from ${line1.code} to ${line2.code} (~${transferWaitMin}m walk & wait)`,
          durationMinutes: transferWaitMin,
        },
        {
          type: 'board',
          lineId: line2.id,
          stationName: transferStation.name,
          details: `Board ${line2.name} (${line2.code}) toward ${headsign2}`,
          durationMinutes: 1,
        },
        {
          type: 'ride',
          lineId: line2.id,
          stationName: `${stopsLeg2} stops on ${line2.code}`,
          details: `Ride ${stopsLeg2} stops to ${destination.name}`,
          stopsCount: stopsLeg2,
          durationMinutes: minLeg2,
        },
        {
          type: 'alight',
          lineId: line2.id,
          stationName: destination.name,
          details: `Arrive at destination: ${destination.name}`,
          durationMinutes: 0,
        },
      ];

      return {
        originStationId: originId,
        destinationStationId: destinationId,
        totalMinutes,
        transfersCount: 1,
        departureTime: formatTime(departure),
        arrivalTime: formatTime(arrival),
        steps,
        linesUsed: [line1.id, line2.id],
      };
    }
  }

  return null;
}
