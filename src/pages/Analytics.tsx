import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { getCurrencySymbol } from "@/lib/currencies";
import { ALL_DEFAULT_CATEGORIES } from "@/lib/categories";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { SpendingTrendChart } from "@/components/analytics/SpendingTrendChart";
import { CategoryBreakdown } from "@/components/analytics/CategoryBreakdown";
import { BudgetProgress } from "@/components/analytics/BudgetProgress";
import { InsightCard } from "@/components/analytics/InsightCard";
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  Lightbulb,
  AlertTriangle,
  Sparkles,
  ChevronRight,
} from "lucide-react";

type Period = "Today" | "This week" | "Month" | "Year";

const periodStart = (p: Period): Date => {
  const now = new Date();
  if (p === "Today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === "This week") {
    const d = new Date(now);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - (day - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (p === "Year") return new Date(now.getFullYear(), 0, 1);
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const previousRange = (p: Period): { start: Date; end: Date } => {
  const now = new Date();
  if (p === "Today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { start, end };
  }
  if (p === "This week") {
    const cur = periodStart(p);
    const start = new Date(cur);
    start.setDate(start.getDate() - 7);
    return { start, end: cur };
  }
  if (p === "Year") {
    return {
      start: new Date(now.getFullYear() - 1, 0, 1),
      end: new Date(now.getFullYear(), 0, 1),
    };
  }
  return {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    end: new Date(now.getFullYear(), now.getMonth(), 1),
  };
};

const Analytics = () => {
  const navigate = useNavigate();
  const { data: expenses = [], isLoading: loadingExp } = useTransactions();
  const { data: budgets = [], isLoading: loadingBud } = useBudgets();
  const [period, setPeriod] = useState<Period>("Month");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("default_currency, monthly_income")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.default_currency) setCurrencySymbol(getCurrencySymbol(profile.default_currency));
      if (profile?.monthly_income) setMonthlyIncome(Number(profile.monthly_income));
    })();
  }, []);

  // Filter expenses for selected period
  const { current, previous } = useMemo(() => {
    const start = periodStart(period);
    const prev = previousRange(period);
    const inRange = expenses.filter((e) => {
      const d = new Date(e.date);
      return d >= start;
    });
    const inPrev = expenses.filter((e) => {
      const d = new Date(e.date);
      return d >= prev.start && d < prev.end;
    });
    return { current: inRange, previous: inPrev };
  }, [expenses, period]);

  // Income heuristic: rows tagged as Income or Salary; otherwise fall back to monthly_income.
  const isIncomeRow = (cat: string) =>
    /income|salary|wages|bonus|refund/i.test(cat);

  const totals = useMemo(() => {
    const expense = current
      .filter((e) => !isIncomeRow(e.category))
      .reduce((s, e) => s + Number(e.amount), 0);
    const incomeRows = current
      .filter((e) => isIncomeRow(e.category))
      .reduce((s, e) => s + Number(e.amount), 0);
    // Fallback: prorate monthly income if no income rows
    let income = incomeRows;
    if (income === 0 && monthlyIncome > 0) {
      if (period === "Today") income = monthlyIncome / 30;
      else if (period === "This week") income = monthlyIncome / 4.33;
      else if (period === "Year") income = monthlyIncome * 12;
      else income = monthlyIncome;
    }
    const savings = income - expense;

    const prevExpense = previous
      .filter((e) => !isIncomeRow(e.category))
      .reduce((s, e) => s + Number(e.amount), 0);
    const prevIncomeRows = previous
      .filter((e) => isIncomeRow(e.category))
      .reduce((s, e) => s + Number(e.amount), 0);
    let prevIncome = prevIncomeRows;
    if (prevIncome === 0 && monthlyIncome > 0) {
      prevIncome = period === "Year" ? monthlyIncome * 12 : monthlyIncome;
    }
    const prevSavings = prevIncome - prevExpense;

    const pct = (a: number, b: number) =>
      b > 0 ? ((a - b) / b) * 100 : a > 0 ? 100 : 0;

    return {
      income,
      expense,
      savings,
      incomeTrend: pct(income, prevIncome),
      expenseTrend: pct(expense, prevExpense),
      savingsTrend: pct(savings, prevSavings),
    };
  }, [current, previous, monthlyIncome, period]);

  const expenseRows = useMemo(
    () => current.filter((e) => !isIncomeRow(e.category)),
    [current]
  );

  // Budget tracking — filter budgets matching current period (best-effort: any active budget)
  const budgetItems = useMemo(() => {
    const spentByCat = new Map<string, number>();
    expenseRows.forEach((e) => {
      spentByCat.set(e.category, (spentByCat.get(e.category) || 0) + Number(e.amount));
    });
    return budgets.slice(0, 4).map((b) => ({
      category: b.category,
      budget: Number(b.amount),
      spent: spentByCat.get(b.category) || 0,
    }));
  }, [budgets, expenseRows]);

  // Insights
  const insights = useMemo(() => {
    const arr: { Icon: any; title: string; description?: string; tone: "info" | "warning" | "success" }[] = [];
    // Top category
    const map = new Map<string, number>();
    expenseRows.forEach((e) => map.set(e.category, (map.get(e.category) || 0) + Number(e.amount)));
    const top = Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      arr.push({
        Icon: Lightbulb,
        title: `You spent most on ${top[0]} this period`,
        description: `Try to cap it next ${period.toLowerCase()} for more savings.`,
        tone: "info",
      });
    }
    if (totals.expenseTrend > 5) {
      arr.push({
        Icon: AlertTriangle,
        title: `Expenses increased by ${totals.expenseTrend.toFixed(0)}%`,
        description: "Compared to the previous period.",
        tone: "warning",
      });
    } else if (totals.expenseTrend < -5) {
      arr.push({
        Icon: Sparkles,
        title: `Expenses dropped ${Math.abs(totals.expenseTrend).toFixed(0)}%`,
        description: "Great job staying on track!",
        tone: "success",
      });
    }
    if (totals.savings > 0 && totals.savingsTrend > 5) {
      arr.push({
        Icon: Sparkles,
        title: `You saved more than last ${period.toLowerCase()}`,
        description: `That's a ${totals.savingsTrend.toFixed(0)}% boost.`,
        tone: "success",
      });
    }
    return arr;
  }, [expenseRows, totals, period]);

  const recent = useMemo(() => current.slice(0, 5), [current]);

  const fmt = (v: number) =>
    `${currencySymbol}${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  if (loadingExp || loadingBud) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-full rounded-full" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 md:pb-8 max-w-3xl mx-auto space-y-3">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-xs text-muted-foreground">Your financial insights</p>
      </div>

      {/* Period filter */}
      <div className="flex bg-muted rounded-full p-1 text-xs">
        {(["Today", "This week", "Month", "Year"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-1.5 rounded-full font-medium transition-colors ${
              period === p
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Overview cards */}
      <div className="space-y-2.5">
        <AnalyticsCard
          label="Total Income"
          amount={fmt(totals.income)}
          Icon={Wallet}
          tone="income"
          trend={totals.incomeTrend}
          trendDirection="good-up"
        />
        <AnalyticsCard
          label="Total Expenses"
          amount={fmt(totals.expense)}
          Icon={TrendingDown}
          tone="expense"
          trend={totals.expenseTrend}
          trendDirection="good-down"
        />
        <AnalyticsCard
          label="Savings"
          amount={fmt(totals.savings)}
          Icon={PiggyBank}
          tone="savings"
          trend={totals.savingsTrend}
          trendDirection="good-up"
        />
      </div>

      <SpendingTrendChart expenses={expenseRows} currencySymbol={currencySymbol} />

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((i, idx) => (
            <InsightCard key={idx} {...i} />
          ))}
        </div>
      )}

      <BudgetProgress items={budgetItems} currencySymbol={currencySymbol} />

      <CategoryBreakdown expenses={expenseRows} currencySymbol={currencySymbol} />

      {/* Recent transactions */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
          <button
            onClick={() => navigate("/expenses")}
            className="text-xs font-medium text-primary flex items-center gap-0.5"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No transactions yet</p>
        ) : (
          <div className="space-y-2.5">
            {recent.map((t) => {
              const def = ALL_DEFAULT_CATEGORIES.find((c) => c.value === t.category);
              const isIncome = isIncomeRow(t.category);
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 text-base">
                    {def?.emoji ?? "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate leading-tight">
                      {t.vendor || t.description || t.category}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(t.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · {t.category}
                    </p>
                  </div>
                  <p
                    className={`text-xs font-bold tabular-nums ${
                      isIncome ? "text-success" : "text-destructive"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {fmt(Number(t.amount))}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
