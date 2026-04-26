import React, { useState } from 'react';
import { Activity, ChevronDown } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { EXERCISE_DATABASE } from '../constants/exercises';
import { cn } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import { getExerciseName } from '../utils/workoutUtils';

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
      showToast(t('toast.movementRestricted', { name: movementName }), 3000, 'info');
    } else {
      showToast(t('toast.protocolUpdated', { name: movementName }), 3000, 'success');
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
          {t('settings.movementRestrictions')}
        </span>
        <ChevronDown className={cn("transition-transform", isExpanded ? 'rotate-180' : '')} size={16} />
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 grid grid-cols-1 gap-2 animate-in slide-in-from-top-2 duration-300">
          {EXERCISE_DATABASE.map(mvmt => (
            <label key={mvmt.name} className="flex items-center justify-between p-3 bg-void/40 border border-white/5 hover:border-volt/30 transition-all cursor-pointer group">
              <span className="text-[10px] text-zinc-300 uppercase font-black tracking-widest group-hover:text-white transition-colors">
                {getExerciseName(mvmt, t)}
              </span>
              <input 
                type="checkbox" 
                checked={profile?.excludedMovements?.includes(mvmt.name) || false}
                onChange={() => handleToggleMovement(mvmt.name)}
                className="accent-volt h-4 w-4 bg-transparent border-white/20"
              />
            </label>
          ))}
          <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest mt-4 leading-relaxed italic">
            {t('settings.deselectToEnable')}
          </p>
        </div>
      )}
    </div>
  );
};
