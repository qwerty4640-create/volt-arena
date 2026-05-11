import React from 'react';
import { cn } from '../lib/utils';
import { getSuggestedActivities } from '../logic/recoveryEngine';
import { RecoveryActivity } from '../data/recoveryActivities';
import { useWorkout } from '../contexts/WorkoutContext';

interface ActiveRecoveryMenuProps {
  onExecute: (activity: RecoveryActivity) => void;
  standalone?: boolean;
}

export const ActiveRecoveryMenu: React.FC<ActiveRecoveryMenuProps> = ({ onExecute, standalone = false }) => {
  const { readinessScore, completedSessions, recordRecoverySession } = useWorkout();
  const suggestions = getSuggestedActivities(readinessScore);

  const handleExecute = (act: RecoveryActivity) => {
    onExecute(act);
    recordRecoverySession(act.id);
  };

  const getAcceleratorLabel = (id: string) => {
    const actId = id.toLowerCase();
    if (actId.includes('cycle')) return 'Metabolic Accelerator';
    if (actId.includes('flow')) return 'Neuromuscular Reset';
    if (actId.includes('thermal')) return 'Vasodilation Flush';
    return 'Clearing Protocol';
  };

  return (
    <div className={cn(
      standalone ? "" : "mt-8 border-t border-zinc-800 pt-6"
    )}>
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-white text-2xl md:text-3xl text-volt font-black tracking-tight uppercase">
            Recovery Protocol
          </h3>
          <p className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">
            Accelerate Fatigue Clearance & CNS Reset
          </p>
        </div>
        <div className="text-[10px] md:text-xs font-mono text-zinc-400 uppercase tracking-widest">
          SESSIONS: {completedSessions}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {suggestions.map((act) => (
          <button
            key={act.id}
            onClick={() => handleExecute(act)}
            className="group relative flex flex-col items-start p-4 bg-zinc-900 border border-zinc-800 hover:border-volt/50 transition-all duration-300 overflow-hidden text-left"
          >
            <span className="text-[8px] md:text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em] mb-1">
              {getAcceleratorLabel(act.id)}
            </span>
            <h4 className="text-white text-base md:text-lg font-black uppercase tracking-tight group-hover:text-volt transition-colors">
              {act.label}
            </h4>
            <p className="text-[10px] md:text-xs text-zinc-500 mt-2 line-clamp-2 uppercase font-medium leading-relaxed">
              {act.description}
            </p>
          </button>
        ))}
      </div>

      {completedSessions >= 2 && (
        <div className="mt-4 p-2 bg-zinc-900/40 border border-zinc-800 text-[9px] text-zinc-500 font-bold uppercase text-center">
          Adaptive limits approached. prioritize structural rest and total caloric replenishment.
        </div>
      )}
    </div>
  );
};
