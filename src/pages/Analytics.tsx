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
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Enhanced Analytics</h1>
        <p className="text-muted-foreground mt-1">Visual insights and spending trends</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl md:text-3xl font-bold">${stats.total.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Expense</p>
              <p className="text-2xl md:text-3xl font-bold">${stats.avg.toFixed(2)}</p>
            </div>
            <Calendar className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Trend</p>
              <p className={`text-2xl md:text-3xl font-bold ${stats.trend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(1)}%
              </p>
            </div>
            {stats.trend >= 0 ? (
              <TrendingUp className="h-8 w-8 text-red-500" />
            ) : (
              <TrendingDown className="h-8 w-8 text-green-500" />
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4 md:p-6">
        <h2 className="text-xl font-bold mb-4">Monthly Spending Trend</h2>
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
        <h2 className="text-xl font-bold mb-4">Spending by Category</h2>
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
