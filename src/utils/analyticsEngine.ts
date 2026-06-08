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

const getMonday = (timestamp: number): Date => {
  const d = new Date(timestamp);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.getFullYear(), d.getMonth(), diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const getTacticalImpact = (activeRecoveryLogs: ActiveRecovery[]): TacticalImpactOutput => {
  const sortedLogs = [...(activeRecoveryLogs || [])]
    .filter(log => {
      if (!log) return false;
      const ts = log.timestamp || (log.date ? new Date(log.date).getTime() : null);
      return ts !== null && !isNaN(ts) && typeof log.rpe === 'number' && typeof log.durationMinutes === 'number';
    })
    .map(log => ({
      ...log,
      timestamp: log.timestamp || (log.date ? new Date(log.date).getTime() : 0)
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
  
  const weeklyMap = new Map<string, { 
    dateMs: number; 
    dateLabel: string; 
    totalDuration: number; 
    rpeProduct: number; 
    cumulativeImpact: number; 
    typeSet: Set<string>;
    sessionCount: number;
  }>();

  sortedLogs.forEach(log => {
    const factor = getFactor(log.type);
    const impactScore = (log.durationMinutes / 60) * log.rpe * factor;
    
    const monday = getMonday(log.timestamp);
    const weekKey = `${monday.getFullYear()}-${(monday.getMonth() + 1).toString().padStart(2, '0')}-${monday.getDate().toString().padStart(2, '0')}`;
    const weekLabel = `Wk ${monday.getMonth() + 1}/${monday.getDate()}`;

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, {
        dateMs: monday.getTime(),
        dateLabel: weekLabel,
        totalDuration: 0,
        rpeProduct: 0,
        cumulativeImpact: 0,
        typeSet: new Set<string>(),
        sessionCount: 0
      });
    }

    const weekData = weeklyMap.get(weekKey)!;
    weekData.totalDuration += log.durationMinutes;
    weekData.rpeProduct += (log.rpe * log.durationMinutes);
    weekData.cumulativeImpact += impactScore;
    weekData.typeSet.add(log.type);
    weekData.sessionCount += 1;
  });

  const chartData: TacticalChartDataPoint[] = Array.from(weeklyMap.values()).map((data) => ({
    date: data.dateLabel,
    dateMs: data.dateMs,
    totalDuration: data.totalDuration,
    weightedAvgRpe: data.totalDuration > 0 ? (data.rpeProduct / data.totalDuration) : 0,
    cumulativeImpact: data.cumulativeImpact,
    types: Array.from(data.typeSet).join(', ')
  })).sort((a, b) => a.dateMs - b.dateMs);
 
  // Calculate the current active program impact score as the average weekly impact over the filtered dataset.
  const activeWeeks = chartData.length > 0 ? chartData.length : 1;
  const weeklyCumulativeScore = Array.from(weeklyMap.values()).reduce((acc, week) => acc + week.cumulativeImpact, 0) / activeWeeks;

  return {
    weeklyCumulativeScore,
    chartData
  };
};

export const filterDataByRange = (data: any[], range: string) => {
  if (!data) return [];
  
  const cleanData = data.filter(item => {
    if (!item) return false;
    const dateVal = item.completedAt || item.timestamp || item.date || item.performedAt || item.startTime;
    if (!dateVal) return false;
    const itemDate = new Date(dateVal);
    return !isNaN(itemDate.getTime());
  });

  if (range === 'ALL') return cleanData;

  const now = new Date();
  const rangeMap: Record<string, number> = {
    '1M': 30,
    '3M': 90,
    '6M': 180,
  };

  const daysToSubtract = rangeMap[range] || 180;
  const cutoffDate = new Date();
  cutoffDate.setDate(now.getDate() - daysToSubtract);

  return cleanData.filter(item => {
    const dateVal = item.completedAt || item.timestamp || item.date || item.performedAt || item.startTime;
    const itemDate = new Date(dateVal);
    return itemDate >= cutoffDate;
  });
};
