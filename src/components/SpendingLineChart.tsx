import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  startOfMonth,
  endOfMonth,
} from "date-fns";

interface Expense {
  date: string;
  amount: number;
}

interface Props {
  expenses: Expense[];
  currencySymbol: string;
}

type Range = "week" | "month";

export const SpendingLineChart = ({ expenses, currencySymbol }: Props) => {
  const [range, setRange] = useState<Range>("week");
  const now = new Date();

  const data = useMemo(() => {
    const start =
      range === "week"
        ? startOfWeek(now, { weekStartsOn: 1 })
        : startOfMonth(now);
    const end =
      range === "week" ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now);
    return eachDayOfInterval({ start, end }).map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const total = expenses
        .filter((e) => e.date === key && Number(e.amount) > 0)
        .reduce((s, e) => s + Number(e.amount), 0);
      return {
        label: range === "week" ? format(d, "EEE") : format(d, "d"),
        total: Math.round(total),
      };
    });
  }, [range, expenses, now]);

  const total = data.reduce((s, d) => s + d.total, 0);
  const avg = total / Math.max(data.length, 1);

  return (
    <Card className="rounded-2xl p-4 border-border/40 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-base leading-tight">Spending Trend</h3>
          <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
            Avg {currencySymbol}
            {avg.toLocaleString(undefined, { maximumFractionDigits: 0 })} ·
            Total {currencySymbol}
            {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="flex bg-muted/70 rounded-full p-0.5 text-[10px] font-bold uppercase tracking-wider">
          {(["week", "month"] as Range[]).map((r) => (
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
              {r === "week" ? "7D" : "30D"}
            </button>
          ))}
        </div>
      </div>

      <div className="h-40 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} opacity={0.4} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={32}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
              }
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.3 }}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
                padding: "6px 10px",
              }}
              formatter={(v: number) => [`${currencySymbol}${v.toLocaleString()}`, "Spent"]}
              labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              fill="url(#spendFill)"
              animationDuration={600}
              dot={{ r: 0 }}
              activeDot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
