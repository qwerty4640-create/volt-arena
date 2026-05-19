import React from 'react';
import { ViewType } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { ChevronRight, ChevronLeft, Settings2, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface PageHeaderProps {
  activeView: ViewType;
  onBack?: () => void;
  subtitle?: string;
}

export function PageHeader({ activeView, onBack, subtitle }: PageHeaderProps) {
  const { t, isCustomizeModalOpen, setIsCustomizeModalOpen, isDeploymentModalOpen, setIsDeploymentModalOpen } = useSettings();

  const getBreadcrumbs = (view: ViewType): string | null => {
    switch (view) {
      case 'workout-log':
        return t('workout.missionLog');
      case 'post-workout':
      case 'workout-history':
      case 'upcoming-missions':
      case 'berserker':
        return t('nav.training');
      case 'profile':
        return t('nav.settings');
      default:
        return null;
    }
  };

  const getPageTitle = (view: ViewType): string => {
    switch (view) {
      case 'analysis': return t('nav.dashboard');
      case 'analytics': return t('nav.analytics');
      case 'training': return t('nav.training');
      case 'deployment': return t('nav.deployment');
      case 'settings': return t('nav.settings');
      case 'profile': return t('nav.profile');
      case 'workout-log': return subtitle || t('workout.log');
      case 'post-workout': return t('workout.postWorkout');
      case 'workout-history': return t('analysis.workoutHistory');
      case 'upcoming-missions': return t('analysis.upcomingMissions');
      case 'berserker': return t('hud.berserkerState').replace('_', ' ');
      case 'fitness-test': return t('nav.fitnessTest');
      default: return view;
    }
  };

  const breadcrumb = getBreadcrumbs(activeView);
  const title = getPageTitle(activeView);
  const isMissionLog = activeView === 'workout-log';

  return (
    <header className="w-full min-h-[100px] flex flex-row items-end shrink-0 z-10 px-4 md:px-0 py-4 md:py-6">
      <div className="flex items-end justify-between w-full">
        <div className="flex flex-col">
          {/* Breadcrumb Area - Reserved space on desktop */}
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest mb-2 transition-all h-[14px]",
            breadcrumb ? "text-zinc-500" : "md:opacity-0 md:flex hidden"
          )}>
            {breadcrumb && (
              <>
                <span>{breadcrumb}</span>
                <ChevronRight size={10} className="text-volt" />
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <h1 className="font-headline text-3xl sm:text-5xl font-black uppercase tracking-tight text-white m-0 leading-none">
              {title}
            </h1>
          </div>
        </div>

        {(activeView === 'analysis' || activeView === 'analytics') && (
          <button 
            onClick={() => setIsCustomizeModalOpen(true)}
            className="hidden md:flex items-center gap-2 px-6 py-3 btn-primary font-headline text-[10px] font-black uppercase tracking-widest transition-all group vanguard-tour-customize-dashboard"
          >
            <Settings2 size={14} />
            {t('analysis.customizeDashboard')}
          </button>
        )}

        {activeView === 'deployment' && (
          <button 
            onClick={() => setIsDeploymentModalOpen(true)}
            className="hidden md:flex items-center gap-2 px-6 py-3 btn-primary font-headline text-[10px] font-black uppercase tracking-widest transition-all group vanguard-tour-recalibrate-deployment"
          >
            <Zap size={14} />
            <span>Recalibrate Deployment</span>
          </button>
        )}
      </div>
    </header>
  );
}
