import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return n.toLocaleString("ko-KR");
  return String(n);
}

export function progressPercent(count: number, goal: number): number {
  return Math.min(100, Math.round((count / goal) * 100));
}
