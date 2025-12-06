import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Wallet, Target, Receipt, Calendar, TrendingUp, RefreshCw } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, startOfYear, endOfYear } from "date-fns";
import { CURRENCIES, getCurrencySymbol } from "@/lib/currencies";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [stats, setStats] = useState({
    totalExpenses: 0,
    yearlyExpenses: 0,
    totalBudget: 0,
    budgetUsage: 0
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate, currency]);

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
        setCurrencySymbol(getCurrencySymbol(profile.default_currency));
      }

      const currentDate = selectedDate;
      const yearStart = startOfYear(currentDate);
      const yearEnd = endOfYear(currentDate);
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Fetch expenses
      const { data: expensesData } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      // Fetch budgets for current month
      const { data: budgetsData } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("period", "monthly")
        .eq("year", currentDate.getFullYear())
        .eq("month", currentDate.getMonth() + 1);

      if (expensesData) {
        setExpenses(expensesData);
        
        // Calculate yearly total
        const yearlyTotal = expensesData
          .filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= yearStart && expDate <= yearEnd;
          })
          .reduce((sum, exp) => sum + Number(exp.amount), 0);

        // Calculate monthly total for budget usage
        const monthlyTotal = expensesData
          .filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= monthStart && expDate <= monthEnd;
          })
          .reduce((sum, exp) => sum + Number(exp.amount), 0);

        const totalBudget = budgetsData?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;

        setStats({
          totalExpenses: expensesData.reduce((sum, exp) => sum + Number(exp.amount), 0),
          yearlyExpenses: yearlyTotal,
          totalBudget: totalBudget,
          budgetUsage: totalBudget > 0 ? (monthlyTotal / totalBudget) * 100 : 0
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

  const handleCurrencyChange = async (newCurrency: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ default_currency: newCurrency })
        .eq("user_id", user.id);

      setCurrency(newCurrency);
      setCurrencySymbol(getCurrencySymbol(newCurrency));
    } catch (error) {
      console.error("Error updating currency:", error);
    }
  };

  const quickActions = [
    { 
      icon: Wallet, 
      label: "Budgets", 
      path: "/budgets",
      color: "from-blue-500 to-blue-600"
    },
    { 
      icon: Target, 
      label: "Goals", 
      path: "/savings-goals",
      color: "from-green-500 to-green-600"
    },
    { 
      icon: Receipt, 
      label: "Expenses", 
      path: "/expenses",
      color: "from-purple-500 to-purple-600"
    },
    { 
      icon: Calendar, 
      label: "Daily", 
      path: "/expenses?filter=daily",
      color: "from-orange-500 to-orange-600"
    },
    { 
      icon: TrendingUp, 
      label: "Weekly", 
      path: "/expenses?filter=weekly",
      color: "from-pink-500 to-pink-600"
    },
    { 
      icon: RefreshCw, 
      label: "Recurring", 
      path: "/recurring-expenses",
      color: "from-teal-500 to-teal-600"
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in p-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 flex-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-24">
      {/* Top Bar - Currency & Date Selection */}
      <div className="flex gap-2 items-center">
        <Select value={currency} onValueChange={handleCurrencyChange}>
          <SelectTrigger className="w-[100px] h-10 bg-card border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((curr) => (
              <SelectItem key={curr.code} value={curr.code}>
                <span className="flex items-center gap-1">
                  <span>{curr.flag}</span>
                  <span className="text-xs">{curr.code}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 h-10 justify-start text-left font-normal bg-card border-border/50"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "MMM yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/40 bg-gradient-to-br from-card to-card/80 shadow-md">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground font-medium">Total ({selectedDate.getFullYear()})</p>
            <p className="text-xl font-bold text-primary tabular-nums">
              {currencySymbol}{stats.yearlyExpenses.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-card to-card/80 shadow-md">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground font-medium">Budget</p>
            <p className="text-xl font-bold text-accent tabular-nums">
              {currencySymbol}{stats.totalBudget.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-card to-card/80 shadow-md">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground font-medium">Period</p>
            <p className="text-xl font-bold text-warning tabular-nums">
              {format(selectedDate, "MMM")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-card to-card/80 shadow-md">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground font-medium">Usage</p>
            <p className={cn(
              "text-xl font-bold tabular-nums",
              stats.budgetUsage > 100 ? "text-destructive" : 
              stats.budgetUsage > 80 ? "text-warning" : "text-success"
            )}>
              {stats.budgetUsage.toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <Card className="border-border/40 shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 active:scale-95"
              >
                <div className={cn(
                  "p-3 rounded-full bg-gradient-to-br shadow-lg",
                  action.color
                )}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="border-border/40 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Recent Transactions
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-primary"
              onClick={() => navigate("/expenses")}
            >
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {expenses.slice(0, 5).map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{expense.category}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(expense.date), "MMM dd")}
                    {expense.vendor && ` • ${expense.vendor}`}
                  </p>
                </div>
                <p className="font-bold text-sm tabular-nums ml-2">
                  {currencySymbol}{Number(expense.amount).toFixed(2)}
                </p>
              </div>
            ))}
            {expenses.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No transactions yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
