import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Expense {
  amount: number;
  date: string;
  category: string;
}

const Analytics = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('expenses')
        .select('amount, date, category')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyTrend = () => {
    const monthlyData: { [key: string]: number } = {};
    
    expenses.forEach(exp => {
      const month = exp.date.substring(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + Number(exp.amount);
    });

    return Object.entries(monthlyData)
      .map(([month, amount]) => ({
        month,
        amount: Number(amount.toFixed(2))
      }))
      .slice(-12); // Last 12 months
  };

  const getCategoryTrend = () => {
    const categoryData: { [key: string]: number } = {};
    
    expenses.forEach(exp => {
      categoryData[exp.category] = (categoryData[exp.category] || 0) + Number(exp.amount);
    });

    return Object.entries(categoryData)
      .map(([category, amount]) => ({
        category,
        amount: Number(amount.toFixed(2))
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getStats = () => {
    if (expenses.length === 0) return { total: 0, avg: 0, trend: 0 };

    const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const avg = total / expenses.length;

    // Calculate trend (last month vs previous month)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 2);

    const lastMonthTotal = expenses
      .filter(e => new Date(e.date) >= lastMonth && new Date(e.date) < now)
      .reduce((sum, exp) => sum + Number(exp.amount), 0);

    const prevMonthTotal = expenses
      .filter(e => new Date(e.date) >= prevMonth && new Date(e.date) < lastMonth)
      .reduce((sum, exp) => sum + Number(exp.amount), 0);

    const trend = prevMonthTotal > 0 
      ? ((lastMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 
      : 0;

    return { total, avg, trend };
  };

  if (loading) return <div className="p-4 md:p-8">Loading...</div>;

  const monthlyTrend = getMonthlyTrend();
  const categoryTrend = getCategoryTrend();
  const stats = getStats();

  return (
    <div className="p-4 md:p-8 space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          <span className="mr-2">📊</span>
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Analytics Dashboard
          </span>
        </h1>
        <p className="text-muted-foreground mt-1">Visual insights and spending trends</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <p className="text-xl font-bold text-primary">${stats.total.toFixed(2)}</p>
          </div>
        </Card>

        <Card className="p-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">📈</span>
              <p className="text-xs text-muted-foreground">Average</p>
            </div>
            <p className="text-xl font-bold text-accent">${stats.avg.toFixed(2)}</p>
          </div>
        </Card>

        <Card className="p-3 col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{stats.trend >= 0 ? '📉' : '📊'}</span>
              <p className="text-xs text-muted-foreground">Trend</p>
            </div>
            <p className={`text-xl font-bold ${stats.trend >= 0 ? 'text-destructive' : 'text-success'}`}>
              {stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(1)}%
            </p>
          </div>
        </Card>
      </div>

        <Card className="p-4 md:p-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span>📅</span>
          <span className="text-primary">Monthly Spending Trend</span>
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span>🏷️</span>
          <span className="text-accent">Spending by Category</span>
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default Analytics;
