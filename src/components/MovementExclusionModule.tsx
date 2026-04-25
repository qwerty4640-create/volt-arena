import React, { useState } from 'react';
import { Activity, ChevronDown } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { EXERCISE_DATABASE } from '../constants/exercises';
import { cn } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';

export const MovementExclusionModule = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { profile, updateProfile, t } = useSettings();
  const { showToast } = useToast();

  const handleToggleMovement = (movementName: string) => {
    const currentExclusions = profile?.excludedMovements || [];
    const updated = currentExclusions.includes(movementName)
      ? currentExclusions.filter(name => name !== movementName)
      : [...currentExclusions, movementName];
    
    updateProfile({ excludedMovements: updated });
    
    if (updated.includes(movementName)) {
      showToast(`${movementName} restricted for next Mission.`, 3000, 'info');
    } else {
      showToast(`Protocol Updated. ${movementName} re-authorized for next Mission.`, 3000, 'success');
    }
  };

  return (
    <div className="border border-zinc-800 bg-zinc-900/30 rounded-sm overflow-hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center p-4 hover:bg-zinc-800/50 transition-colors"
      >
        <span className="text-xs font-bold tracking-widest uppercase flex items-center gap-2">
          <Activity size={14} className="text-[var(--primary-color)]" />
          Movement Restrictions
        </span>
        <ChevronDown className={cn("transition-transform", isExpanded ? 'rotate-180' : '')} size={16} />
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 grid grid-cols-1 gap-2 animate-in slide-in-from-top-2 duration-300">
          {EXERCISE_DATABASE.map(mvmt => (
            <label key={mvmt.name} className="flex items-center justify-between p-2 rounded bg-black/20 border border-zinc-800/50 cursor-pointer">
              <span className="text-[11px] text-zinc-300 uppercase tracking-tighter">{mvmt.name}</span>
              <input 
                type="checkbox" 
                checked={profile?.excludedMovements?.includes(mvmt.name) || false}
                onChange={() => handleToggleMovement(mvmt.name)}
                className="accent-[var(--primary-color)] h-4 w-4"
              />
            </label>
          ))}
          <p className="text-[9px] text-zinc-500 italic mt-2">
            * Deselect a movement to re-enable it for future Mission Calibration.
          </p>
        </div>
      )}
    </div>
  );
};
