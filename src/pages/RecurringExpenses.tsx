import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Bell, Home, Tv, Wifi, Music, ShoppingBag, Zap,
  Phone, BookOpen, Heart, Car, Calendar, TrendingUp, History, Trash2,
  Repeat, ArrowUpRight,
} from "lucide-react";
import { getCurrencySymbol } from "@/lib/currencies";
import { formatCurrencyStrict, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import RecurringCalendar from "@/components/RecurringCalendar";

interface RecurringExpense {
  id: string;
  category: string;
  amount: number;
  description: string;
  frequency: string;
  start_date: string;
  vendor?: string;
  payment_method?: string;
  is_active: boolean;
  last_processed_date?: string | null;
}

// Map keywords to icon + color tokens (semantic)
const getIcon = (name: string, category: string) => {
  const n = (name + " " + category).toLowerCase();
  if (n.includes("netflix") || n.includes("hulu") || n.includes("disney")) return { Icon: Tv, bg: "bg-[hsl(var(--chart-1)/0.15)]", color: "text-[hsl(var(--chart-1))]" };
  if (n.includes("spotify") || n.includes("music") || n.includes("apple music")) return { Icon: Music, bg: "bg-[hsl(var(--chart-3)/0.15)]", color: "text-[hsl(var(--chart-3))]" };
  if (n.includes("rent") || n.includes("mortgage") || n.includes("home")) return { Icon: Home, bg: "bg-primary/10", color: "text-primary" };
  if (n.includes("internet") || n.includes("wifi") || n.includes("broadband")) return { Icon: Wifi, bg: "bg-[hsl(var(--chart-4)/0.15)]", color: "text-[hsl(var(--chart-4))]" };
  if (n.includes("phone") || n.includes("mobile")) return { Icon: Phone, bg: "bg-[hsl(var(--chart-5)/0.15)]", color: "text-[hsl(var(--chart-5))]" };
  if (n.includes("electric") || n.includes("utilit") || n.includes("gas")) return { Icon: Zap, bg: "bg-[hsl(var(--chart-2)/0.15)]", color: "text-[hsl(var(--chart-2))]" };
  if (n.includes("gym") || n.includes("health") || n.includes("fitness")) return { Icon: Heart, bg: "bg-destructive/10", color: "text-destructive" };
  if (n.includes("car") || n.includes("auto") || n.includes("insurance")) return { Icon: Car, bg: "bg-[hsl(var(--chart-6)/0.15)]", color: "text-[hsl(var(--chart-6))]" };
  if (n.includes("course") || n.includes("education") || n.includes("book")) return { Icon: BookOpen, bg: "bg-[hsl(var(--chart-7)/0.15)]", color: "text-[hsl(var(--chart-7))]" };
  if (n.includes("shop")) return { Icon: ShoppingBag, bg: "bg-[hsl(var(--chart-8)/0.15)]", color: "text-[hsl(var(--chart-8))]" };
  return { Icon: Repeat, bg: "bg-muted", color: "text-muted-foreground" };
};

const getNextBillingDate = (startDate: string, frequency: string, lastProcessed?: string | null): Date => {
  const base = lastProcessed ? new Date(lastProcessed) : new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(base);
  while (next < today) {
    if (frequency === "weekly") next.setDate(next.getDate() + 7);
    else if (frequency === "yearly") next.setFullYear(next.getFullYear() + 1);
    else next.setMonth(next.getMonth() + 1);
  }
  return next;
};

const formatNextDate = (d: Date) => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const day = d.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${months[d.getMonth()]} ${day}${suffix}`;
};

const monthlyEquivalent = (amount: number, frequency: string) => {
  if (frequency === "weekly") return amount * 4.33;
  if (frequency === "yearly") return amount / 12;
  return amount;
};

const RecurringExpenses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("USD");
  const [sortByDate, setSortByDate] = useState(true);
  const [view, setView] = useState<"list" | "calendar">("list");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, recRes] = await Promise.all([
        supabase.from("profiles").select("default_currency").eq("user_id", user.id).maybeSingle(),
        supabase.from("recurring_expenses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (profileRes.data?.default_currency) setCurrency(profileRes.data.default_currency);
      if (recRes.error) throw recRes.error;
      setExpenses(recRes.data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from("recurring_expenses").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    toast({ title: "Deleted", description: "Subscription removed." });
  };

  const symbol = getCurrencySymbol(currency);

  const active = useMemo(() => expenses.filter((e) => e.is_active), [expenses]);

  const monthlyTotal = useMemo(
    () => active.reduce((sum, e) => sum + monthlyEquivalent(Number(e.amount), e.frequency), 0),
    [active]
  );

  const sortedActive = useMemo(() => {
    const copy = [...active];
    if (sortByDate) {
      copy.sort((a, b) =>
        getNextBillingDate(a.start_date, a.frequency, a.last_processed_date).getTime() -
        getNextBillingDate(b.start_date, b.frequency, b.last_processed_date).getTime()
      );
    }
    return copy;
  }, [active, sortByDate]);

  // Find soonest due item for alert
  const soonest = sortedActive[0];
  const soonestNext = soonest ? getNextBillingDate(soonest.start_date, soonest.frequency, soonest.last_processed_date) : null;
  const daysUntilSoonest = soonestNext
    ? Math.ceil((soonestNext.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  if (loading) {
    return (
      <div className="p-4 space-y-4 pb-24 max-w-md mx-auto">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">Recurring Payments</h1>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => navigate("/recurring-expenses/new")}
          className="text-primary hover:bg-primary/10"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Hero monthly total card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5 rounded-2xl border-0 shadow-lg shadow-primary/20">
        <p className="text-xs font-semibold tracking-wider uppercase opacity-80">Monthly Total</p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-3xl font-bold tabular-nums">
            {formatCurrencyStrict(monthlyTotal, symbol, 2)}
          </p>
        </div>
        <p className="text-sm opacity-90 mt-1">
          {active.length} active recurring {active.length === 1 ? "subscription" : "subscriptions"}
        </p>

        <div className="border-t border-primary-foreground/20 mt-4 pt-4 flex items-center justify-between">
          {/* Avatar stack */}
          <div className="flex -space-x-2">
            {sortedActive.slice(0, 3).map((e) => {
              const { Icon, bg, color } = getIcon(e.description, e.category);
              return (
                <div
                  key={e.id}
                  className={`w-8 h-8 rounded-full ${bg} ${color} border-2 border-primary flex items-center justify-center`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              );
            })}
            {active.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 border-2 border-primary flex items-center justify-center text-[10px] font-bold">
                +{active.length - 3}
              </div>
            )}
          </div>
          <button
            onClick={() => setView((v) => (v === "list" ? "calendar" : "list"))}
            className="text-[11px] font-semibold tracking-wider uppercase bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors px-3 py-1.5 rounded-md"
          >
            {view === "list" ? "View Calendar" : "View List"}
          </button>
        </div>
      </Card>

      {/* Alert banner */}
      {soonest && daysUntilSoonest !== null && daysUntilSoonest <= 7 && (
        <Card className="border-l-4 border-l-destructive bg-destructive/10 border-y-0 border-r-0 rounded-md p-3 flex items-start gap-3 shadow-none">
          <Bell className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive text-sm">
              {soonest.description} due in {daysUntilSoonest === 0 ? "today" : `${daysUntilSoonest} ${daysUntilSoonest === 1 ? "day" : "days"}`}
            </p>
            <p className="text-xs text-muted-foreground">
              Ensure your primary account has {formatCurrencyStrict(Number(soonest.amount), symbol, 2)}
            </p>
          </div>
        </Card>
      )}

      {view === "calendar" ? (
        <RecurringCalendar
          items={active}
          symbol={symbol}
          monthlyEquivalent={monthlyEquivalent}
          onSelectItem={(id) => navigate(`/recurring-expenses/edit/${id}`)}
        />
      ) : (
        <>
          {/* Active Subscriptions header */}
          <div className="flex items-center justify-between pt-1">
            <h2 className="text-lg font-bold text-foreground">Active Subscriptions</h2>
            <button
              onClick={() => setSortByDate((s) => !s)}
              className="text-[11px] font-semibold tracking-wider uppercase text-primary"
            >
              Sort by Date
            </button>
          </div>

          {/* Subscription list */}
          <div className="space-y-2.5">
            {sortedActive.length === 0 && (
              <Card className="p-8 text-center rounded-xl border-dashed">
                <Repeat className="h-10 w-10 mx-auto text-muted-foreground/60 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No recurring payments yet.</p>
                <Button onClick={() => navigate("/recurring-expenses/new")} size="sm">
                  <Plus className="h-4 w-4 mr-1.5" /> Add subscription
                </Button>
              </Card>
            )}

            {sortedActive.map((e) => {
              const { Icon, bg, color } = getIcon(e.description, e.category);
              const next = getNextBillingDate(e.start_date, e.frequency, e.last_processed_date);
              return (
                <Card
                  key={e.id}
                  className="p-3 rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/recurring-expenses/edit/${e.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{e.description}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>Next: {formatNextDate(next)}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground tabular-nums">
                        {formatCurrencyStrict(Number(e.amount), symbol, 2)}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold tracking-wider uppercase bg-[hsl(var(--chart-3)/0.15)] text-[hsl(var(--chart-3))] px-2 py-0.5 rounded">
                        {e.frequency}
                      </span>
                    </div>

                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        deleteExpense(e.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Insight cards */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <Card className="p-4 rounded-xl border border-border/60 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="font-bold text-foreground text-sm">Optimization Tips</p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
            Review subscriptions to save monthly
          </p>
        </Card>
        <Card className="p-4 rounded-xl border border-border/60 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[hsl(var(--chart-3)/0.15)] text-[hsl(var(--chart-3))] flex items-center justify-center mb-3">
            <History className="h-5 w-5" />
          </div>
          <p className="font-bold text-foreground text-sm">Past Payments</p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
            View history for the last 12 months
          </p>
        </Card>
      </div>
    </div>
  );
};

export default RecurringExpenses;
