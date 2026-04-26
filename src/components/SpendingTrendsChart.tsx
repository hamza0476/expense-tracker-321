import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";

interface Expense {
  date: string;
  amount: number;
}

interface Props {
  expenses: Expense[];
  currencySymbol: string;
}

type Range = "week" | "month" | "6m";

export const SpendingTrendsChart = ({ expenses, currencySymbol }: Props) => {
  const [range, setRange] = useState<Range>("week");
  const now = new Date();

  const data = useMemo(() => {
    if (range === "week") {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end }).map((d) => {
        const key = format(d, "yyyy-MM-dd");
        const total = expenses
          .filter((e) => e.date === key && Number(e.amount) > 0)
          .reduce((s, e) => s + Number(e.amount), 0);
        return {
          label: format(d, "EEE").toUpperCase().slice(0, 1),
          total,
          highlight: format(d, "yyyy-MM-dd") === format(now, "yyyy-MM-dd"),
        };
      });
    }
    if (range === "month") {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      const days = eachDayOfInterval({ start, end });
      // group into 5 weeks
      const buckets: { label: string; total: number; highlight: boolean }[] = [];
      const chunkSize = Math.ceil(days.length / 5);
      for (let i = 0; i < days.length; i += chunkSize) {
        const chunk = days.slice(i, i + chunkSize);
        const total = chunk.reduce((s, d) => {
          const key = format(d, "yyyy-MM-dd");
          return (
            s +
            expenses
              .filter((e) => e.date === key && Number(e.amount) > 0)
              .reduce((a, e) => a + Number(e.amount), 0)
          );
        }, 0);
        const highlight = chunk.some(
          (d) => format(d, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
        );
        buckets.push({
          label: `W${buckets.length + 1}`,
          total,
          highlight,
        });
      }
      return buckets;
    }
    // 6m
    return Array.from({ length: 6 }).map((_, i) => {
      const m = subMonths(now, 5 - i);
      const start = startOfMonth(m);
      const end = endOfMonth(m);
      const total = expenses
        .filter((e) => {
          const d = new Date(e.date);
          return d >= start && d <= end && Number(e.amount) > 0;
        })
        .reduce((s, e) => s + Number(e.amount), 0);
      return {
        label: format(m, "MMM").toUpperCase(),
        total,
        highlight: i === 5,
      };
    });
  }, [range, expenses, now]);

  const max = Math.max(...data.map((d) => d.total), 1);
  const total = data.reduce((s, d) => s + d.total, 0);
  const avg = total / Math.max(data.length, 1);

  return (
    <Card className="rounded-2xl p-4 border-border/40 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-base leading-tight">Spending Trends</h3>
          <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
            Avg {currencySymbol}
            {avg.toLocaleString(undefined, { maximumFractionDigits: 0 })} ·
            Total {currencySymbol}
            {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="flex bg-muted/70 rounded-full p-0.5 text-[10px] font-bold uppercase tracking-wider">
          {(["week", "month", "6m"] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "px-2.5 h-7 rounded-full transition-all",
                range === r
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground"
              )}
            >
              {r === "week" ? "7D" : r === "month" ? "30D" : "6M"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end justify-between h-28 gap-1.5">
        {data.map((d, i) => {
          const height = (d.total / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <div className="w-full flex-1 flex items-end relative group">
                <div
                  className={cn(
                    "w-full rounded-t-xl transition-all",
                    d.highlight
                      ? "bg-gradient-to-t from-primary to-accent"
                      : "bg-muted"
                  )}
                  style={{ height: `${Math.max(height, 6)}%` }}
                />
                {d.total > 0 && d.highlight && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-primary tabular-nums whitespace-nowrap">
                    {currencySymbol}
                    {d.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tabular-nums",
                  d.highlight ? "text-primary" : "text-muted-foreground"
                )}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
