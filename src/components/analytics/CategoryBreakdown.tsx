import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ALL_DEFAULT_CATEGORIES } from "@/lib/categories";

interface Tx {
  amount: number;
  category: string;
}

interface Props {
  expenses: Tx[];
  currencySymbol: string;
}

const FALLBACK_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

export const CategoryBreakdown = ({ expenses, currencySymbol }: Props) => {
  const { items, total } = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) || 0) + Number(e.amount));
    });
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
    const items = Array.from(map.entries())
      .map(([category, amount], i) => {
        const def = ALL_DEFAULT_CATEGORIES.find((c) => c.value === category);
        return {
          category,
          amount,
          emoji: def?.emoji ?? "📦",
          color: def?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
          pct: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
    return { items, total };
  }, [expenses]);

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
      <h3 className="text-sm font-semibold text-foreground mb-3">Category Breakdown</h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No expenses yet</p>
      ) : (
        <>
          <div className="relative h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={items}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="none"
                >
                  {items.map((it, i) => (
                    <Cell key={i} fill={it.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => `${currencySymbol}${v.toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-base font-bold tabular-nums text-foreground">
                {currencySymbol}
                {total.toFixed(0)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {items.slice(0, 5).map((it) => (
              <div key={it.category} className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: it.color }}
                />
                <span className="text-base">{it.emoji}</span>
                <span className="text-xs font-medium flex-1 truncate">{it.category}</span>
                <span className="text-xs font-semibold tabular-nums">
                  {currencySymbol}
                  {it.amount.toFixed(0)}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums w-9 text-right">
                  {it.pct.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
