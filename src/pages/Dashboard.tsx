import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { DollarSign, TrendingUp, Calendar, Wallet } from "lucide-react";
import { CurrencySelector } from "@/components/CurrencySelector";
import { EXPENSE_CATEGORIES, getCategoryColor } from "@/lib/categories";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  vendor?: string;
}

interface Budget {
  category: string;
  amount: number;
}

const Dashboard = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [stats, setStats] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    totalBudget: 0,
    expenseCount: 0
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's preferred currency
      const { data: profile } = await supabase
        .from("profiles")
        .select("default_currency")
        .eq("user_id", user.id)
        .single();
      
      if (profile?.default_currency) {
        setCurrency(profile.default_currency);
        const { getCurrencySymbol } = await import("@/lib/currencies");
        setCurrencySymbol(getCurrencySymbol(profile.default_currency));
      }

      const currentDate = new Date();
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Fetch expenses
      const { data: expensesData } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      // Fetch budgets
      const { data: budgetsData } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("period", "monthly")
        .eq("year", currentDate.getFullYear())
        .eq("month", currentDate.getMonth() + 1);

      if (expensesData) {
        setExpenses(expensesData);
        
        const total = expensesData.reduce((sum, exp) => sum + Number(exp.amount), 0);
        const filteredTotal = expensesData
          .filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= dateRange.from && expDate <= dateRange.to;
          })
          .reduce((sum, exp) => sum + Number(exp.amount), 0);

        setStats({
          totalExpenses: total,
          monthlyExpenses: filteredTotal,
          totalBudget: budgetsData?.reduce((sum, b) => sum + Number(b.amount), 0) || 0,
          expenseCount: expensesData.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= dateRange.from && expDate <= dateRange.to;
          }).length
        });
      }

      if (budgetsData) {
        setBudgets(budgetsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryData = () => {
    const categoryTotals: Record<string, number> = {};
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
      })
      .forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + Number(exp.amount);
      });

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category,
      value: amount,
      color: getCategoryColor(category)
    }));
  };

  const getBudgetComparison = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return budgets.map(budget => {
      const spent = expenses
        .filter(exp => {
          const expDate = new Date(exp.date);
          return exp.category === budget.category && 
                 expDate.getMonth() === currentMonth && 
                 expDate.getFullYear() === currentYear;
        })
        .reduce((sum, exp) => sum + Number(exp.amount), 0);

      return {
        category: budget.category,
        budget: Number(budget.amount),
        spent: spent,
        percentage: (spent / Number(budget.amount)) * 100
      };
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  const categoryData = getCategoryData();
  const budgetComparison = getBudgetComparison();

  const recentExpenses = expenses.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              <span className="mr-2">🏠</span>
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Dashboard
              </span>
            </h2>
            <p className="text-muted-foreground">Overview of your expenses and budgets</p>
          </div>
          <div className="md:hidden">
            <CurrencySelector />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
          <div className="hidden md:block">
            <CurrencySelector />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full md:w-[200px] justify-start text-left font-normal",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? format(dateRange.from, "LLL dd, y") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => {
                  if (date) {
                    setDateRange({ ...dateRange, from: startOfDay(date) });
                  }
                }}
                initialFocus
                classNames={{
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_range_middle: "bg-accent/50"
                }}
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full md:w-[200px] justify-start text-left font-normal",
                  !dateRange.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.to ? format(dateRange.to, "LLL dd, y") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={dateRange.to}
                onSelect={(date) => {
                  if (date) {
                    setDateRange({ ...dateRange, to: endOfDay(date) });
                  }
                }}
                initialFocus
                classNames={{
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_range_middle: "bg-accent/50"
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="hover-scale border-border/40 bg-gradient-to-br from-card to-card/50 shadow-lg">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5">
              <span className="text-base">💸</span> <span>Total</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold text-primary tabular-nums">{currencySymbol}{stats.totalExpenses.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stats.expenseCount} transactions</p>
          </CardContent>
        </Card>

        <Card className="hover-scale border-border/40 bg-gradient-to-br from-card to-card/50 shadow-lg">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5">
              <span className="text-base">📆</span> <span>Period</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold text-accent tabular-nums">{currencySymbol}{stats.monthlyExpenses.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Selected range</p>
          </CardContent>
        </Card>

        <Card className="hover-scale border-border/40 bg-gradient-to-br from-card to-card/50 shadow-lg">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5">
              <span className="text-base">🎯</span> <span>Budget</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold text-warning tabular-nums">{currencySymbol}{stats.totalBudget.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Total allocated</p>
          </CardContent>
        </Card>

        <Card className="hover-scale border-border/40 bg-gradient-to-br from-card to-card/50 shadow-lg">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5">
              <span className="text-base">📊</span> <span>Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold text-success">
              {stats.totalBudget > 0 ? ((stats.monthlyExpenses / stats.totalBudget) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Of budget</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      {recentExpenses.length > 0 && (
        <Card className="border-border/40 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>🧾</span>
                <span className="text-primary">Recent Transactions</span>
              </span>
              <span className="text-sm font-normal text-muted-foreground">Last 5</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{expense.category}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {format(new Date(expense.date), "MMM dd, yyyy")}
                      {expense.vendor && ` • ${expense.vendor}`}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg tabular-nums">{currencySymbol}{Number(expense.amount).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {categoryData.length > 0 && (
          <Card className="border-border/40 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🏷️</span>
                <span className="text-accent">Spending by Category</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">This month's distribution</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                  outerRadius={100}
                    label={(entry) => {
                      const name = entry.name.length > 8 ? entry.name.substring(0, 8) + '...' : entry.name;
                      return `${name}: ${currencySymbol}${entry.value.toFixed(0)}`;
                    }}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${currencySymbol}${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {budgetComparison.length > 0 && (
          <Card className="border-border/40 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💰</span>
                <span className="text-primary">Budget vs Actual</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">Category comparison</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="category" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                    formatter={(value: number) => `${currencySymbol}${value.toFixed(2)}`}
                  />
                  <Legend />
                  <Bar dataKey="budget" fill="hsl(var(--primary))" name="Budget" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="spent" fill="hsl(var(--accent))" name="Spent" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Budget Progress */}
      {budgetComparison.length > 0 && (
        <Card className="border-border/40 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🎯</span>
              <span className="text-success">Budget Progress Details</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">Track your spending limits</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetComparison.map(item => (
              <div key={item.category} className="space-y-2 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{item.category}</span>
                  <span className="text-sm font-mono tabular-nums">
                    <span className={item.percentage > 100 ? "text-destructive" : item.percentage > 80 ? "text-warning" : "text-success"}>
                      {currencySymbol}{item.spent.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground"> / {currencySymbol}{item.budget.toFixed(2)}</span>
                  </span>
                </div>
                <Progress 
                  value={Math.min(item.percentage, 100)} 
                  className="h-2.5"
                />
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-medium ${
                    item.percentage > 100 ? "text-destructive" : 
                    item.percentage > 80 ? "text-warning" : 
                    "text-success"
                  }`}>
                    {item.percentage.toFixed(1)}% used
                    {item.percentage > 100 && " - Over budget!"}
                    {item.percentage > 80 && item.percentage <= 100 && " - Warning"}
                    {item.percentage <= 80 && " - Good"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${(item.budget - item.spent).toFixed(2)} remaining
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
