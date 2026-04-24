import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { EXPENSE_CATEGORIES, getCategoryColor } from "@/lib/categories";
import { Pencil, Plus, Trash2, Bell } from "lucide-react";
import { format, getDaysInMonth, getDate } from "date-fns";
import { getCurrencySymbol } from "@/lib/currencies";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Budget {
  id: string;
  category: string;
  amount: number;
  period: string;
  year: number;
  month: number;
}

interface CategorySpending {
  category: string;
  spent: number;
  budget: number;
  percentage: number;
  budgetId: string;
}

const Budgets = () => {
  const navigate = useNavigate();
  const [spending, setSpending] = useState<CategorySpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("default_currency")
        .eq("user_id", user.id)
        .single();
      if (profile?.default_currency) {
        setCurrencySymbol(getCurrencySymbol(profile.default_currency));
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const { data: budgetsData } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("period", "monthly")
        .eq("year", year)
        .eq("month", month);

      const { data: expensesData } = await supabase
        .from("expenses")
        .select("category, amount")
        .eq("user_id", user.id)
        .gte("date", `${year}-${month.toString().padStart(2, "0")}-01`)
        .lt(
          "date",
          month === 12
            ? `${year + 1}-01-01`
            : `${year}-${(month + 1).toString().padStart(2, "0")}-01`
        );

      if (budgetsData) {
        const totals: Record<string, number> = {};
        expensesData?.forEach((e) => {
          totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
        });
        const data = budgetsData.map((b) => ({
          category: b.category,
          spent: totals[b.category] || 0,
          budget: Number(b.amount),
          percentage: ((totals[b.category] || 0) / Number(b.amount)) * 100,
          budgetId: b.id,
        }));
        setSpending(data);
        setTotalBudget(budgetsData.reduce((s, b) => s + Number(b.amount), 0));
        setTotalSpent(data.reduce((s, x) => s + x.spent, 0));
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("budgets").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Budget removed");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const usagePct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remaining = Math.max(0, totalBudget - totalSpent);
  const overBudget = totalSpent > totalBudget;
  const today = new Date();
  const dayOfMonth = getDate(today);
  const totalDays = getDaysInMonth(today);
  const dailyAvg = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
  const projected = dailyAvg * totalDays;

  // Donut data
  const distribution = spending
    .filter((s) => s.spent > 0)
    .sort((a, b) => b.spent - a.spent);
  const distTotal = distribution.reduce((s, x) => s + x.spent, 0) || 1;

  if (loading) {
    return (
      <div className="space-y-3 animate-fade-in">
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  // Build conic-gradient for donut
  let acc = 0;
  const conicSegments = distribution.map((d) => {
    const start = (acc / distTotal) * 100;
    acc += d.spent;
    const end = (acc / distTotal) * 100;
    return `${getCategoryColor(d.category)} ${start}% ${end}%`;
  });
  const conicGradient =
    distribution.length > 0
      ? `conic-gradient(${conicSegments.join(", ")})`
      : `conic-gradient(hsl(var(--muted)) 0% 100%)`;

  const getCategoryEmoji = (cat: string) => {
    const c = EXPENSE_CATEGORIES.find((x) => x.value === cat);
    return c?.label.split(" ")[0] || "📦";
  };

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {/* Health banner */}
      <Card
        className={cn(
          "rounded-2xl p-3 border-0 flex items-center justify-between",
          overBudget ? "bg-destructive/10" : "bg-success/10"
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              overBudget ? "bg-destructive" : "bg-success"
            )}
          />
          <span
            className={cn(
              "font-bold text-sm",
              overBudget ? "text-destructive" : "text-success"
            )}
          >
            {overBudget ? "Over Budget" : "Budget on Track"}
          </span>
        </div>
        <span
          className={cn(
            "text-xs font-bold px-3 py-1 rounded-full",
            overBudget ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"
          )}
        >
          {overBudget ? "Action needed" : "Good Health"}
        </span>
      </Card>

      {/* Monthly Budget card */}
      <Card className="rounded-2xl p-4 border-border/40 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Monthly Budget
            </p>
            <p className="text-2xl font-bold text-primary tabular-nums mt-0.5">
              {currencySymbol}
              {totalBudget.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => navigate("/add-expense")}
            className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Pencil className="w-4 h-4 text-primary" />
          </button>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Spent ({usagePct.toFixed(0)}%)</span>
            <span className="font-bold tabular-nums">
              {currencySymbol}
              {totalSpent.toFixed(2)}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                overBudget ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${Math.min(usagePct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5">
            <span className="tabular-nums">{currencySymbol}0.00</span>
            <span className="tabular-nums">
              {currencySymbol}
              {remaining.toFixed(2)} remaining
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground">Daily Average</p>
            <p className="font-bold text-base tabular-nums">
              {currencySymbol}
              {dailyAvg.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Projected</p>
            <p
              className={cn(
                "font-bold text-base tabular-nums",
                projected > totalBudget ? "text-destructive" : "text-success"
              )}
            >
              {currencySymbol}
              {projected.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      {/* By category */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-base">Budget by Category</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/budgets/new")}
          className="text-primary text-sm font-semibold h-auto p-0 hover:bg-transparent"
        >
          Manage
        </Button>
      </div>

      <div className="space-y-2">
        {spending.map((item) => {
          const over = item.percentage > 100;
          const color = getCategoryColor(item.category);
          return (
            <Card
              key={item.budgetId}
              className={cn(
                "rounded-2xl p-3 border-border/40 shadow-sm",
                over && "border-destructive/40 bg-destructive/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: `${color}22` }}
                >
                  {getCategoryEmoji(item.category)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{item.category}</span>
                    <span
                      className={cn(
                        "font-bold text-sm tabular-nums",
                        over && "text-destructive"
                      )}
                    >
                      {currencySymbol}
                      {item.spent.toFixed(0)} / {currencySymbol}
                      {item.budget.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        over
                          ? "bg-destructive"
                          : item.percentage > 80
                          ? "bg-warning"
                          : "bg-success"
                      )}
                      style={{
                        width: `${Math.min(item.percentage, 100)}%`,
                        backgroundColor: over ? undefined : color,
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setDeleteId(item.budgetId)}
                  className="w-7 h-7 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {over && (
                <p className="text-xs text-destructive font-semibold mt-2">
                  Over budget by {currencySymbol}
                  {(item.spent - item.budget).toFixed(2)}
                </p>
              )}
            </Card>
          );
        })}

        {spending.length === 0 && (
          <Card className="rounded-2xl p-8 text-center border-border/40">
            <p className="text-sm text-muted-foreground">
              No budgets yet. Tap "Create Budget" to start.
            </p>
          </Card>
        )}
      </div>

      {/* Category Distribution donut */}
      {distribution.length > 0 && (
        <>
          <h3 className="font-bold text-base px-1 pt-2">Category Distribution</h3>
          <Card className="rounded-2xl p-5 border-border/40 shadow-sm">
            <div className="flex items-center justify-center my-2">
              <div
                className="w-44 h-44 rounded-full relative flex items-center justify-center"
                style={{ background: conicGradient }}
              >
                <div className="w-28 h-28 bg-card rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-[10px] text-muted-foreground uppercase">
                    Total Spent
                  </span>
                  <span className="font-bold text-lg tabular-nums">
                    {currencySymbol}
                    {totalSpent.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {distribution.slice(0, 6).map((d) => {
                const pct = ((d.spent / distTotal) * 100).toFixed(0);
                return (
                  <div key={d.category} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: getCategoryColor(d.category) }}
                    />
                    <span className="text-xs">
                      {d.category} {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* Floating Create Budget */}
      <Button
        onClick={() => navigate("/budgets/new")}
        className="fixed bottom-24 right-4 h-12 px-4 rounded-full shadow-xl shadow-primary/30 z-30 gap-2"
      >
        <Plus className="w-4 h-4" />
        Create Budget
      </Button>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this budget?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Budgets;
