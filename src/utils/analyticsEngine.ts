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
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  let weeklyCumulativeScore = 0;
  const sortedLogs = [...activeRecoveryLogs].sort((a, b) => a.timestamp - b.timestamp);
  
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

    if (log.timestamp > now - oneWeek) {
      weeklyCumulativeScore += impactScore;
    }
    
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
    totalDuration: data.sessionCount > 0 ? Math.round(data.totalDuration / data.sessionCount) : 0,
    weightedAvgRpe: data.totalDuration > 0 ? (data.rpeProduct / data.totalDuration) : 0,
    cumulativeImpact: data.sessionCount > 0 ? (data.cumulativeImpact / data.sessionCount) : 0,
    types: Array.from(data.typeSet).join(', ')
  })).sort((a, b) => a.dateMs - b.dateMs);
 
   return {
     weeklyCumulativeScore,
     chartData
   };
 };
 
 export const filterDataByRange = (data: any[], range: string) => {
   if (!data || range === 'ALL') return data;
 
   const now = new Date();
   const rangeMap: Record<string, number> = {
     '1M': 30,
     '3M': 90,
     '6M': 180,
   };
 
   const daysToSubtract = rangeMap[range] || 180;
   const cutoffDate = new Date();
   cutoffDate.setDate(now.getDate() - daysToSubtract);
 
   return data.filter(item => {
     const itemDate = new Date(item.date);
     return itemDate >= cutoffDate;
   });
 };
