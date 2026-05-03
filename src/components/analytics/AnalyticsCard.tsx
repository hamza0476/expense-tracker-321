import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

interface Props {
  label: string;
  amount: string;
  Icon: LucideIcon;
  trend?: number; // percentage; positive = up
  tone: "income" | "expense" | "savings";
  trendDirection?: "good-up" | "good-down"; // semantic: for expense, up = bad
}

const toneMap = {
  income: {
    bg: "bg-success/10",
    fg: "text-success",
  },
  expense: {
    bg: "bg-destructive/10",
    fg: "text-destructive",
  },
  savings: {
    bg: "bg-primary/10",
    fg: "text-primary",
  },
} as const;

export const AnalyticsCard = ({
  label,
  amount,
  Icon,
  trend,
  tone,
  trendDirection = "good-up",
}: Props) => {
  const t = toneMap[tone];
  const hasTrend = typeof trend === "number" && isFinite(trend);
  const isUp = (trend ?? 0) >= 0;
  const semanticPositive =
    trendDirection === "good-up" ? isUp : !isUp;
  return (
    <div className="bg-card rounded-2xl p-3.5 shadow-sm border border-border/50 flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", t.bg)}>
        <Icon className={cn("w-5 h-5", t.fg)} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
        <p className="text-base font-bold text-foreground tabular-nums truncate leading-tight mt-0.5">
          {amount}
        </p>
      </div>
      {hasTrend && (
        <div
          className={cn(
            "flex items-center gap-0.5 text-xs font-semibold tabular-nums shrink-0",
            semanticPositive ? "text-success" : "text-destructive"
          )}
        >
          {isUp ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          {Math.abs(trend!).toFixed(0)}%
        </div>
      )}
    </div>
  );
};
