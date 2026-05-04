import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmt = {
  money: (n: number) => new Intl.NumberFormat('th-TH').format(n),
  num: (n: number) => new Intl.NumberFormat('th-TH').format(n),
  date: (d: Date | string) => new Intl.DateTimeFormat('th-TH').format(new Date(d)),
};
