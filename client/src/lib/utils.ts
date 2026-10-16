import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatStr = 'MMM d, yyyy'): string {
  return format(new Date(date), formatStr);
}

export function formatRelativeDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatWeight(weight: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (unit === 'imperial') {
    return `${(weight * 2.20462).toFixed(1)} lbs`;
  }
  return `${weight} kg`;
}

export function formatHeight(cm: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (unit === 'imperial') {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }
  return `${cm} cm`;
}

export function formatCalories(calories: number): string {
  return calories.toLocaleString();
}

export function formatMacro(grams: number): string {
  return `${Math.round(grams)}g`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function calculateBMI(weight: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-info' };
  if (bmi < 25) return { label: 'Normal', color: 'text-success' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-warning' };
  return { label: 'Obese', color: 'text-error' };
}

export function calculateTDEE(
  weight: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female',
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
): number {
  // Mifflin-St Jeor formula
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * heightCm - 5 * age - 161;
  }

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  return Math.round(bmr * multipliers[activityLevel]);
}

export function getWorkoutTypeColor(type: string): string {
  const colors: Record<string, string> = {
    strength: 'text-accent bg-accent-muted',
    cardio: 'text-info bg-info/10',
    hiit: 'text-error bg-error/10',
    yoga: 'text-success bg-success/10',
    sports: 'text-warning bg-warning/10',
    other: 'text-text-secondary bg-surface',
  };
  return colors[type] || colors.other;
}

export function getMoodEmoji(mood: string): string {
  const moods: Record<string, string> = {
    terrible: '😞',
    bad: '😐',
    okay: '🙂',
    good: '😊',
    great: '🔥',
  };
  return moods[mood] || '🙂';
}

export function truncate(str: string, length = 50): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

export function generateAvatarUrl(name: string): string {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=B8FF3B&color=0B0D0F&bold=true&size=128`;
}
