import { ActiveRecovery, RecoveryType } from '../contexts/WorkoutContext';

const getFactor = (type: RecoveryType): number => {
  const recovery = ['Walking', 'Yoga', 'Pilates'];
  const aerobic = ['Running', 'Swimming', 'Cycling', 'Rucking'];
  const anaerobic = ['Boxing', 'Muay Thai', 'Jiu Jitsu', 'Wrestling', 'MMA', 'Tactical Drills', 'Parkour'];

  if (recovery.includes(type)) return 0.5;
  if (aerobic.includes(type)) return 1.2;
  if (anaerobic.includes(type)) return 2.0;
  return 1.0; // Fallback for 'Other'
};

export interface TacticalChartDataPoint {
  date: string;
  dateMs: number;
  totalDuration: number; // in minutes
  weightedAvgRpe: number;
  cumulativeImpact: number;
  types: string;
}

export interface TacticalImpactOutput {
  weeklyCumulativeScore: number;
  chartData: TacticalChartDataPoint[];
}

export const getTacticalImpact = (activeRecoveryLogs: ActiveRecovery[]): TacticalImpactOutput => {
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  let weeklyCumulativeScore = 0;
  const sortedLogs = [...activeRecoveryLogs].sort((a, b) => a.timestamp - b.timestamp);
  
  const dailyMap = new Map<string, { dateMs: number; totalDuration: number; rpeProduct: number; cumulativeImpact: number; typeSet: Set<string> }>();

  sortedLogs.forEach(log => {
    const factor = getFactor(log.type);
    const impactScore = (log.durationMinutes / 60) * log.rpe * factor;

    if (log.timestamp > now - oneWeek) {
      weeklyCumulativeScore += impactScore;
    }
    
    const date = new Date(log.timestamp);
    const shortDate = `${date.getMonth() + 1}/${date.getDate()}`; // M/D

    if (!dailyMap.has(shortDate)) {
      dailyMap.set(shortDate, {
        dateMs: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(),
        totalDuration: 0,
        rpeProduct: 0,
        cumulativeImpact: 0,
        typeSet: new Set<string>()
      });
    }

    const dayData = dailyMap.get(shortDate)!;
    dayData.totalDuration += log.durationMinutes;
    dayData.rpeProduct += (log.rpe * log.durationMinutes);
    dayData.cumulativeImpact += impactScore;
    dayData.typeSet.add(log.type);
  });

  const chartData: TacticalChartDataPoint[] = Array.from(dailyMap.entries()).map(([dateStr, data]) => ({
    date: dateStr,
    dateMs: data.dateMs,
    totalDuration: data.totalDuration,
    weightedAvgRpe: data.totalDuration > 0 ? (data.rpeProduct / data.totalDuration) : 0,
    cumulativeImpact: data.cumulativeImpact,
    types: Array.from(data.typeSet).join(', ')
  })).sort((a, b) => a.dateMs - b.dateMs);

  return {
    weeklyCumulativeScore,
    chartData
  };
};
