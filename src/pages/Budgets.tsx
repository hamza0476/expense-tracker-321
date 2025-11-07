import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { EXPENSE_CATEGORIES, getCategoryColor } from "@/lib/categories";
import { Plus, Trash2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
}

const Budgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spending, setSpending] = useState<CategorySpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    period: "monthly"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      // Fetch budgets
      const { data: budgetsData } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("period", "monthly")
        .eq("year", year)
        .eq("month", month);

      // Fetch expenses for current month
      const { data: expensesData } = await supabase
        .from("expenses")
        .select("category, amount")
        .eq("user_id", user.id)
        .gte("date", `${year}-${month.toString().padStart(2, "0")}-01`)
        .lt("date", month === 12 ? `${year + 1}-01-01` : `${year}-${(month + 1).toString().padStart(2, "0")}-01`);

      if (budgetsData) {
        setBudgets(budgetsData);

        // Calculate spending per category
        const categoryTotals: Record<string, number> = {};
        expensesData?.forEach(exp => {
          categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + Number(exp.amount);
        });

        const spendingData = budgetsData.map(budget => ({
          category: budget.category,
          spent: categoryTotals[budget.category] || 0,
          budget: Number(budget.amount),
          percentage: ((categoryTotals[budget.category] || 0) / Number(budget.amount)) * 100
        }));

        setSpending(spendingData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const currentDate = new Date();
      const { error } = await supabase.from("budgets").insert([
        {
          user_id: user.id,
          category: formData.category,
          amount: parseFloat(formData.amount),
          period: formData.period,
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1
        }
      ]);

      if (error) throw error;

      toast.success("Budget added successfully!");
      setShowForm(false);
      setFormData({ category: "", amount: "", period: "monthly" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add budget");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Budget deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast.error("Failed to delete budget");
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage > 100) return "text-destructive";
    if (percentage > 80) return "text-warning";
    return "text-success";
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Budgets
          </h2>
          <p className="text-muted-foreground">Set limits and track your spending</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 shadow-lg">
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Add Budget"}
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-xl border-border/40 bg-gradient-to-br from-card to-card/50">
          <CardHeader>
            <CardTitle className="text-xl">Create New Budget</CardTitle>
            <CardDescription>Set spending limits for specific categories</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Period</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(value) => setFormData({ ...formData, period: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit">Add Budget</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {spending.map((item) => (
          <Card key={item.category} className="hover-scale border-border/40 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  <Badge
                    style={{ backgroundColor: getCategoryColor(item.category) }}
                    className="text-white font-semibold shadow-md"
                  >
                    {item.category}
                  </Badge>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const budget = budgets.find(b => b.category === item.category);
                    if (budget) handleDelete(budget.id);
                  }}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Spent</span>
                <span className="font-bold text-lg">₹{item.spent.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-semibold">₹{item.budget.toFixed(2)}</span>
              </div>
              <Progress value={Math.min(item.percentage, 100)} className="h-2.5" />
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold ${getStatusColor(item.percentage)}`}>
                  {item.percentage.toFixed(1)}% used
                  {item.percentage > 100 && " - Over!"}
                  {item.percentage > 80 && item.percentage <= 100 && " - Warning"}
                  {item.percentage <= 80 && " - Good"}
                </p>
                <p className="text-xs text-muted-foreground">
                  ₹{Math.max(0, item.budget - item.spent).toFixed(0)} left
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {spending.length === 0 && (
          <Card className="col-span-full border-border/40 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <Wallet className="h-16 w-16 text-muted-foreground/30" />
              <div className="text-center">
                <p className="text-lg font-semibold text-muted-foreground">No budgets set yet</p>
                <p className="text-sm text-muted-foreground">Click "Add Budget" to create your first budget</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Budgets;
