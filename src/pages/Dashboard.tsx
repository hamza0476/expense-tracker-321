import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { getCurrencySymbol } from "@/lib/currencies";
import { EXPENSE_CATEGORIES, getCategoryColor } from "@/lib/categories";
import { SpendingLineChart } from "@/components/SpendingLineChart";

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  vendor?: string;
  description?: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [income, setIncome] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      // Run profile + expenses queries in parallel
      const [profileRes, expensesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("default_currency, monthly_income")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("expenses")
          .select("id,amount,category,date,vendor,description,created_at")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

      const profile = profileRes.data;
      if (profile?.default_currency) {
        setCurrencySymbol(getCurrencySymbol(profile.default_currency));
      }
      if (profile?.monthly_income) setIncome(Number(profile.monthly_income));
      if (expensesRes.data) setExpenses(expensesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const inMonth = (e: Expense, start: Date, end: Date) => {
    const d = new Date(e.date);
    return d >= start && d <= end;
  };

  const monthlyExpense = expenses
    .filter((e) => inMonth(e, monthStart, monthEnd) && Number(e.amount) > 0)
    .reduce((s, e) => s + Number(e.amount), 0);

  const monthlyIncomeTxn = expenses
    .filter((e) => inMonth(e, monthStart, monthEnd) && Number(e.amount) < 0)
    .reduce((s, e) => s + Math.abs(Number(e.amount)), 0);

  const totalIncome = income + monthlyIncomeTxn;

  const lastMonthExpense = expenses
    .filter((e) => inMonth(e, lastMonthStart, lastMonthEnd) && Number(e.amount) > 0)
    .reduce((s, e) => s + Number(e.amount), 0);

  const totalBalance = totalIncome - monthlyExpense;
  const trendPct =
    lastMonthExpense > 0
      ? ((monthlyExpense - lastMonthExpense) / lastMonthExpense) * 100
      : 0;

  // Spending trends are rendered by <SpendingTrendsChart />

  const formatTransactionDate = (dateStr: string, createdAt: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const t = new Date(createdAt);
    const time = format(t, "HH:mm");
    if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
    return `${format(d, "MMM d")}, ${time}`;
  };

  const getCategoryEmoji = (cat: string) => {
    const c = EXPENSE_CATEGORIES.find((x) => x.value === cat);
    return c?.label.split(" ")[0] || "📦";
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {/* Total Balance Hero */}
      <Card className="border-0 bg-primary text-primary-foreground rounded-2xl p-5 shadow-lg shadow-primary/20">
        <p className="text-xs font-semibold tracking-wider opacity-80 uppercase">
          Total Balance
        </p>
        <p className="text-3xl font-bold tabular-nums mt-1">
          {currencySymbol}
          {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="flex items-center gap-1.5 mt-2 text-sm opacity-90">
          <TrendingUp className="w-4 h-4" />
          <span className="tabular-nums">
            {trendPct >= 0 ? "+" : ""}
            {trendPct.toFixed(1)}% from last month
          </span>
        </div>
      </Card>

      {/* Income / Expense */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-2xl p-3 border-border/40 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-success" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Income
            </span>
          </div>
          <p className="text-xl font-bold tabular-nums mt-2">
            {currencySymbol}
            {totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </Card>
        <Card className="rounded-2xl p-3 border-border/40 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-destructive" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Expense
            </span>
          </div>
          <p className="text-xl font-bold tabular-nums mt-2">
            {currencySymbol}
            {monthlyExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </Card>
      </div>

      {/* Spending Trends with toggle */}
      <SpendingLineChart expenses={expenses} currencySymbol={currencySymbol} />

      {/* Recent Transactions */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-lg">Recent Transactions</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary text-sm font-semibold h-auto p-0 hover:bg-transparent"
          onClick={() => navigate("/expenses")}
        >
          See all
        </Button>
      </div>
      <div className="space-y-2">
        {expenses.slice(0, 5).map((expense) => {
          const color = getCategoryColor(expense.category);
          const amt = Number(expense.amount);
          const isIncome = amt < 0;
          return (
            <Card
              key={expense.id}
              className="rounded-2xl p-3 border-border/40 shadow-sm flex items-center gap-3"
            >
              <CategoryIcon category={expense.category} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {expense.vendor || expense.description || expense.category}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTransactionDate(expense.date, expense.created_at)}
                </p>
              </div>
              <p className={cn("font-bold tabular-nums text-sm", isIncome ? "text-success" : "text-destructive")}>
                {isIncome ? "+" : "-"}{currencySymbol}
                {Math.abs(amt).toFixed(2)}
              </p>
            </Card>
          );
        })}
        {expenses.length === 0 && (
          <Card className="rounded-2xl p-8 text-center text-muted-foreground text-sm border-border/40">
            No transactions yet. Tap + to add one.
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
