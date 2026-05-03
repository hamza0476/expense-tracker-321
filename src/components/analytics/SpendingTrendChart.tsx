import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

type Range = "Daily" | "Weekly" | "Monthly";

interface Tx {
  amount: number;
  date: string;
  category: string;
}

interface Props {
  expenses: Tx[];
  currencySymbol: string;
}

function bucket(expenses: Tx[], range: Range) {
  const now = new Date();
  if (range === "Daily") {
    // last 7 days
    const days: { key: string; label: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        key,
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        amount: 0,
      });
    }
    const map = new Map(days.map((d) => [d.key, d]));
    expenses.forEach((e) => {
      const k = e.date.slice(0, 10);
      const slot = map.get(k);
      if (slot) slot.amount += Number(e.amount) || 0;
    });
    return days;
  }
  if (range === "Weekly") {
    // last 6 weeks
    const weeks: { key: string; label: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - i * 7);
      const key = `W${start.getDate()}/${start.getMonth() + 1}`;
      weeks.push({ key, label: key, amount: 0 });
    }
    expenses.forEach((e) => {
      const d = new Date(e.date);
      const diffDays = Math.floor(
        (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
      );
      const weekIdx = Math.floor(diffDays / 7);
      if (weekIdx >= 0 && weekIdx < 6) {
        weeks[5 - weekIdx].amount += Number(e.amount) || 0;
      }
    });
    return weeks;
  }
  // Monthly — last 6 months
  const months: { key: string; label: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      amount: 0,
    });
  }
  const idx = new Map(months.map((m, i) => [m.key, i]));
  expenses.forEach((e) => {
    const d = new Date(e.date);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    const i = idx.get(k);
    if (i !== undefined) months[i].amount += Number(e.amount) || 0;
  });
  return months;
}

export const SpendingTrendChart = ({ expenses, currencySymbol }: Props) => {
  const [range, setRange] = useState<Range>("Daily");
  const data = useMemo(() => bucket(expenses, range), [expenses, range]);

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Spending Trend</h3>
        <div className="flex bg-muted rounded-full p-0.5 text-[11px]">
          {(["Daily", "Weekly", "Monthly"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-2.5 py-1 rounded-full font-medium transition-colors",
                range === r
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[170px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={36}
              tickFormatter={(v) => `${currencySymbol}${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => [`${currencySymbol}${v.toFixed(2)}`, "Spent"]}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              fill="url(#trendFill)"
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
