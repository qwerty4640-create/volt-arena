import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isDumbbell(name: string): boolean {
  const lowerName = name.toLowerCase();
  return lowerName.includes('dumbbell') || lowerName.includes('db ');
}
