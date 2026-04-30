import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Search, Trash2, Edit, Calendar as CalIcon, Tag, SlidersHorizontal, ChevronDown } from "lucide-react";
import { format, isToday, isYesterday, startOfMonth, endOfMonth } from "date-fns";
import { EXPENSE_CATEGORIES, getCategoryColor } from "@/lib/categories";
import { getCurrencySymbol } from "@/lib/currencies";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditExpenseDialog } from "@/components/EditExpenseDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/CategoryIcon";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  payment_method: string;
  vendor: string;
  notes: string;
  created_at: string;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useEffect(() => {
    // Run in parallel for faster load
    Promise.all([fetchExpenses(), fetchCurrency()]);
  }, []);

  const filtered = useMemo(() => {
    let f = [...expenses];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      f = f.filter(
        (e) =>
          e.category?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.vendor?.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") f = f.filter((e) => e.category === categoryFilter);
    if (dateFilter !== "all") {
      const now = new Date();
      if (dateFilter === "this-month") {
        const s = startOfMonth(now), en = endOfMonth(now);
        f = f.filter((e) => {
          const d = new Date(e.date);
          return d >= s && d <= en;
        });
      } else if (dateFilter === "last-30-days") {
        const ago = new Date(now.getTime() - 30 * 86400000);
        f = f.filter((e) => new Date(e.date) >= ago);
      }
    }
    return f;
  }, [searchTerm, categoryFilter, dateFilter, expenses]);

  // Group by day
  const grouped = useMemo(() => {
    const groups: { label: string; date: string; items: Expense[] }[] = [];
    const map = new Map<string, Expense[]>();
    filtered.forEach((e) => {
      const key = e.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .forEach(([date, items]) => {
        const d = new Date(date);
        let label = format(d, "EEEE");
        if (isToday(d)) label = "Today";
        else if (isYesterday(d)) label = "Yesterday";
        groups.push({ label, date: format(d, "MMM dd, yyyy").toUpperCase(), items });
      });
    return groups;
  }, [filtered]);

  const fetchExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrency = async () => {
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
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    // Optimistic update — instant UI response
    const prev = expenses;
    setExpenses((curr) => curr.filter((e) => e.id !== id));
    setDeleteId(null);
    toast.success("Deleted");
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      // Rollback on failure
      setExpenses(prev);
      toast.error("Failed to delete");
    }
  };

  const getCategoryEmoji = (cat: string) => {
    const c = EXPENSE_CATEGORIES.find((x) => x.value === cat);
    return c?.label.split(" ")[0] || "📦";
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-fade-in">
        <Skeleton className="h-12 rounded-2xl" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-full" />
          <Skeleton className="h-9 flex-1 rounded-full" />
          <Skeleton className="h-9 flex-1 rounded-full" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-11 h-12 rounded-2xl bg-card border-border/40 shadow-sm"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 h-9 rounded-full border border-border bg-card text-sm font-medium shrink-0">
              <CalIcon className="w-3.5 h-3.5" />
              {dateFilter === "all" ? "Date" : dateFilter === "this-month" ? "This month" : "Last 30 days"}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setDateFilter("all")}>All time</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("this-month")}>This month</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("last-30-days")}>Last 30 days</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 h-9 rounded-full border border-border bg-card text-sm font-medium shrink-0">
              <Tag className="w-3.5 h-3.5" />
              {categoryFilter === "all" ? "Category" : categoryFilter}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-72 overflow-auto">
            <DropdownMenuItem onClick={() => setCategoryFilter("all")}>All</DropdownMenuItem>
            {EXPENSE_CATEGORIES.map((c) => (
              <DropdownMenuItem key={c.value} onClick={() => setCategoryFilter(c.value)}>
                {c.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => {
            setSearchTerm("");
            setCategoryFilter("all");
            setDateFilter("all");
          }}
          className="flex items-center gap-1.5 px-3 h-9 rounded-full border border-border bg-card text-sm font-medium shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Grouped Transactions */}
      <div className="space-y-5">
        {grouped.map((group) => (
          <div key={group.date} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-base">{group.label}</h3>
              <span className="text-xs font-semibold text-muted-foreground tracking-wider">
                {group.date}
              </span>
            </div>
            {group.items.map((expense) => {
              const t = new Date(expense.created_at);
              return (
                <Card
                  key={expense.id}
                  className="rounded-2xl p-3 border-border/40 shadow-sm flex items-center gap-3 group"
                >
                  <CategoryIcon category={expense.category} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {expense.vendor || expense.description || expense.category}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {expense.category} · {format(t, "hh:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="font-bold text-destructive tabular-nums text-sm">
                      -{currencySymbol}
                      {Number(expense.amount).toFixed(2)}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 ml-1">
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setEditExpense(expense)}>
                          <Edit className="h-3.5 w-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(expense.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              );
            })}
          </div>
        ))}

        {grouped.length === 0 && (
          <Card className="rounded-2xl p-10 text-center border-border/40">
            <p className="text-sm text-muted-foreground">No transactions found</p>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
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

      <EditExpenseDialog
        expense={editExpense}
        open={!!editExpense}
        onOpenChange={(open) => !open && setEditExpense(null)}
        onSuccess={fetchExpenses}
      />
    </div>
  );
};

export default Expenses;
