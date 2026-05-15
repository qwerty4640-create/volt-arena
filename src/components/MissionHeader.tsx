import React from 'react';
import { ChevronLeft, ClipboardList, Clock, Flame } from 'lucide-react';
import { cn } from '../lib/utils';
import { InfoTooltip } from './InfoTooltip';
import { useSettings } from '../contexts/SettingsContext';

interface MissionHeaderProps {
  title: string;
  breadcrumb?: string;
  readiness: number;
  targetRpe: string | number;
  time: string;
  calories: number;
  onBack: () => void;
}

export const MissionHeader = ({
  title,
  breadcrumb,
  readiness,
  targetRpe,
  time,
  calories,
  onBack,
}: MissionHeaderProps) => {
  const { t } = useSettings();

  return (
    <div className="sticky top-0 z-40 bg-void border-b border-white/5 pb-6 -mx-4 md:-mx-8 px-4 md:px-8 pt-4 md:pt-8 transition-all duration-300">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Breadcrumb & Title Area */}
        <div className="flex items-center gap-4 md:gap-6">
          <button
            onClick={onBack}
            className="p-2.5 bg-surface-container-low hover:bg-surface-container-high text-zinc-400 hover:text-white transition-all flex items-center justify-center shrink-0 border border-white/5"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex flex-col min-w-0">
            {breadcrumb && (
              <div className="flex items-center gap-2 text-volt font-sans text-[10px] font-black uppercase tracking-widest mb-1.5 h-[14px]">
                <ClipboardList size={12} className="shrink-0" />
                <span className="truncate">{breadcrumb}</span>
              </div>
            )}
            <h1 className="font-headline text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none truncate">
              {title}
            </h1>
          </div>
        </div>

        {/* Mission Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-4 bg-surface-container-low/50 border border-white/5 font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500">
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2 whitespace-nowrap">
              {t('analysis.readiness')} <InfoTooltip term="Readiness" />
            </span>
            <span className={cn(
              "font-black tracking-tighter text-xl md:text-2xl transition-colors",
              readiness >= 85 ? "text-emerald-500" :
                readiness >= 60 ? "text-amber-500" : "text-crimson"
            )}>{readiness}%</span>
          </div>
          
          <div className="flex flex-col gap-1.5 border-l border-white/5 pl-4">
            <span className="flex items-center gap-2 whitespace-nowrap">
              {t('workout.targetRpe')} <InfoTooltip term="sRPE" />
            </span>
            <span className="font-black text-white text-xl md:text-2xl">{targetRpe || '–'}</span>
          </div>
          
          <div className="flex flex-col gap-1.5 md:border-l md:border-white/5 md:pl-4">
            <span className="flex items-center gap-2 whitespace-nowrap">
              {t('workout.time')} <Clock size={12} className="md:w-3.5 md:h-3.5 text-volt" />
            </span>
            <span className="font-black text-white text-xl md:text-2xl">{time}</span>
          </div>
          
          <div className="flex flex-col gap-1.5 border-l border-white/5 pl-4 md:pl-4">
            <span className="flex items-center gap-2 whitespace-nowrap">
              {t('workout.estBurn')} <Flame size={12} className="md:w-3.5 md:h-3.5 text-volt" />
            </span>
            <span className="font-black text-white text-xl md:text-2xl">{calories} <span className="text-[10px] opacity-70">{t('workout.kcal')}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};
