import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Locale-stable number formatting (prevents narrow no-break spaces on some mobiles)
export function formatNumber(
  value: number,
  options?: { decimals?: number; grouping?: boolean }
) {
  const { decimals = 0, grouping = true } = options || {};
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    useGrouping: grouping,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safe);
}

export function formatCurrencyStrict(
  amount: number,
  symbol: string,
  decimals: number = 2
) {
  return `${symbol}${formatNumber(amount, { decimals, grouping: true })}`;
}

