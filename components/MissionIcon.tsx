import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export const MissionIcon = ({ size = 24, strokeWidth = 2, className, ...props }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={cn("lucide lucide-navigation-2", className)}
    {...props}
  >
    <polygon points="12 2 19 21 12 17 5 21 12 2"/>
  </svg>
);
