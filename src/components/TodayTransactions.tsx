import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Receipt, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  vendor: string | null;
  created_at: string;
  currency: string;
}

export const TodayTransactions = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalToday, setTotalToday] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useEffect(() => {
    fetchTodayExpenses();
  }, []);

  const fetchTodayExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = format(new Date(), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      setExpenses(data || []);
      const total = (data || []).reduce((sum, exp) => sum + exp.amount, 0);
      setTotalToday(total);

      // Get currency symbol
      if (data && data.length > 0) {
        const currencies: Record<string, string> = {
          USD: "$", EUR: "€", GBP: "£", JPY: "¥", INR: "₹", PKR: "₨"
        };
        setCurrencySymbol(currencies[data[0].currency] || "$");
      }
    } catch (error) {
      console.error("Error fetching today's expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-border/50 bg-gradient-to-br from-card via-card to-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Today's Transactions
          </CardTitle>
          <Badge variant="secondary" className="font-semibold">
            {expenses.length} {expenses.length === 1 ? "item" : "items"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Today */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            <span className="font-medium">Total Today</span>
          </div>
          <span className="text-2xl font-bold text-primary">
            {currencySymbol}{totalToday.toFixed(2)}
          </span>
        </div>

        {/* Transactions List */}
        {expenses.length > 0 ? (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {expense.vendor || expense.description || "No description"}
                  </p>
                  <p className="text-xs text-muted-foreground">{expense.category}</p>
                </div>
                <span className="font-semibold text-destructive ml-2">
                  -{currencySymbol}{expense.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No transactions yet today</p>
            <p className="text-sm">Add your first expense to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
