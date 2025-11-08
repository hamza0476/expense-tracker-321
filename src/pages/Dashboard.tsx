import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { DollarSign, TrendingUp, Calendar, Wallet } from "lucide-react";
import { EXPENSE_CATEGORIES, getCategoryColor } from "@/lib/categories";
import { format, startOfMonth, endOfMonth } from "date-fns";

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
  const [stats, setStats] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    totalBudget: 0,
    expenseCount: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        const monthlyTotal = expensesData
          .filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= monthStart && expDate <= monthEnd;
          })
          .reduce((sum, exp) => sum + Number(exp.amount), 0);

        setStats({
          totalExpenses: total,
          monthlyExpenses: monthlyTotal,
          totalBudget: budgetsData?.reduce((sum, b) => sum + Number(b.amount), 0) || 0,
          expenseCount: expensesData.length
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="text-muted-foreground">Overview of your expenses and budgets</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-scale border-border/40 bg-gradient-to-br from-card to-card/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">${stats.totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.expenseCount} transactions</p>
          </CardContent>
        </Card>

        <Card className="hover-scale border-border/40 bg-gradient-to-br from-card to-card/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">${stats.monthlyExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Current month spending</p>
          </CardContent>
        </Card>

        <Card className="hover-scale border-border/40 bg-gradient-to-br from-card to-card/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">${stats.totalBudget.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total allocated</p>
          </CardContent>
        </Card>

        <Card className="hover-scale border-border/40 bg-gradient-to-br from-card to-card/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">
              {stats.totalBudget > 0 ? ((stats.monthlyExpenses / stats.totalBudget) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Of total budget</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      {recentExpenses.length > 0 && (
        <Card className="border-border/40 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Transactions
              <span className="text-sm font-normal text-muted-foreground">Last 5 expenses</span>
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
                    <p className="font-bold text-lg">${Number(expense.amount).toFixed(2)}</p>
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
              <CardTitle>Spending by Category</CardTitle>
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
                    label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {budgetComparison.length > 0 && (
          <Card className="border-border/40 shadow-lg">
            <CardHeader>
              <CardTitle>Budget vs Actual</CardTitle>
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
                    formatter={(value: number) => `$${value.toFixed(2)}`}
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
            <CardTitle>Budget Progress Details</CardTitle>
            <p className="text-sm text-muted-foreground">Track your spending limits</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetComparison.map(item => (
              <div key={item.category} className="space-y-2 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{item.category}</span>
                  <span className="text-sm font-mono">
                    <span className={item.percentage > 100 ? "text-destructive" : item.percentage > 80 ? "text-warning" : "text-success"}>
                      ${item.spent.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground"> / ${item.budget.toFixed(2)}</span>
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
