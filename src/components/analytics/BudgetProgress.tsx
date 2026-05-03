import { cn } from "@/lib/utils";

interface Item {
  category: string;
  budget: number;
  spent: number;
}

interface Props {
  items: Item[];
  currencySymbol: string;
}

const colorFor = (pct: number) => {
  if (pct >= 100) return { bar: "bg-destructive", text: "text-destructive" };
  if (pct >= 75) return { bar: "bg-warning", text: "text-warning" };
  return { bar: "bg-success", text: "text-success" };
};

export const BudgetProgress = ({ items, currencySymbol }: Props) => {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
      <h3 className="text-sm font-semibold text-foreground mb-3">Budget Tracking</h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No budgets set yet</p>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const pct = it.budget > 0 ? (it.spent / it.budget) * 100 : 0;
            const c = colorFor(pct);
            return (
              <div key={it.category}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{it.category}</span>
                  <span className="tabular-nums text-muted-foreground">
                    <span className={cn("font-semibold", c.text)}>
                      {currencySymbol}
                      {it.spent.toFixed(0)}
                    </span>
                    {" / "}
                    {currencySymbol}
                    {it.budget.toFixed(0)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", c.bar)}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
