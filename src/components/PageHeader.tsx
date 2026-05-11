import React from 'react';
import { ViewType } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface PageHeaderProps {
  activeView: ViewType;
}

export function PageHeader({ activeView }: PageHeaderProps) {
  const { t } = useSettings();

  const getBreadcrumbs = (view: ViewType): string | null => {
    switch (view) {
      case 'workout-log':
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
      case 'workout-log': return t('workout.log');
      case 'post-workout': return t('workout.postWorkout');
      case 'workout-history': return t('analysis.workoutHistory');
      case 'upcoming-missions': return t('analysis.upcomingMissions');
      case 'berserker': return t('hud.berserkerState').replace('_', ' ');
      default: return view;
    }
  };

  const breadcrumb = getBreadcrumbs(activeView);
  const title = getPageTitle(activeView);

  return (
    <header className="w-full min-h-[50px] opacity-100 flex flex-col justify-end pb-4 pt-2 shrink-0 z-10">
      {breadcrumb && (
        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
          <span>{breadcrumb}</span>
          <ChevronRight size={10} className="text-volt" />
        </div>
      )}
      <h1 className="font-headline text-3xl sm:text-4xl font-black uppercase tracking-tight text-white m-0 leading-none">
        {title}
      </h1>
    </header>
  );
}
