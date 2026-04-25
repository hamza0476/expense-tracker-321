import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Tag, CalendarClock, Shapes, CheckSquare, Bell, Sparkles } from "lucide-react";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { getCurrencySymbol } from "@/lib/currencies";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const REMINDER_OPTIONS = [
  { value: "0", label: "On the day" },
  { value: "1", label: "1 day before" },
  { value: "3", label: "3 days before" },
];

const AddRecurringExpense = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState("USD");

  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [category, setCategory] = useState("Entertainment");
  const [nextDate, setNextDate] = useState("");
  const [reminder, setReminder] = useState("0");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("default_currency").eq("user_id", user.id).maybeSingle();
      if (data?.default_currency) setCurrency(data.default_currency);
    })();
  }, []);

  const symbol = getCurrencySymbol(currency);

  const handleSave = async () => {
    if (!amount || !name || !nextDate) {
      toast({ title: "Missing info", description: "Add amount, name and next billing date.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("recurring_expenses").insert({
        user_id: user.id,
        category,
        amount: parseFloat(amount),
        description: name,
        frequency,
        start_date: nextDate,
        is_active: true,
      });
      if (error) throw error;

      toast({ title: "Subscription saved", description: `${name} • ${frequency}` });
      navigate("/recurring-expenses");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24 max-w-md mx-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 h-14 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-primary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-bold text-primary text-base">Recurring Payment</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-primary font-semibold text-sm disabled:opacity-50"
        >
          {saving ? "..." : "Save"}
        </button>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Add Recurring Payment</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule your regular expenses to stay ahead of your budget.
          </p>
        </div>

        {/* Amount card */}
        <Card className="p-5 rounded-2xl border border-border/60 shadow-sm">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground text-center">
            Payment Amount
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-3xl font-bold text-primary">{symbol}</span>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-3xl font-bold text-center bg-transparent outline-none w-40 tabular-nums placeholder:text-muted-foreground/50"
            />
          </div>
        </Card>

        {/* Subscription name */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Subscription Name</Label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Netflix, Rent, Gym"
              className="h-11 pl-10 rounded-xl bg-background border-border/60"
            />
          </div>
        </div>

        {/* Billing Frequency */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Billing Frequency</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger className="h-11 rounded-xl bg-background border-border/60">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 rounded-xl bg-background border-border/60">
              <div className="flex items-center gap-2">
                <Shapes className="h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Next Billing Date */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Next Billing Date</Label>
          <Input
            type="date"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
            className="h-11 rounded-xl bg-background border-border/60"
          />
        </div>

        {/* Reminder chips */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Remind me</Label>
          <div className="flex flex-wrap gap-2">
            {REMINDER_OPTIONS.map((opt) => {
              const active = reminder === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReminder(opt.value)}
                  className={cn(
                    "h-9 px-4 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : "bg-muted text-foreground/80 hover:bg-muted/80"
                  )}
                >
                  {active && <Bell className="h-3.5 w-3.5" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-xl text-base font-semibold gap-2 shadow-md shadow-primary/20"
          >
            <CheckSquare className="h-5 w-5" />
            {saving ? "Saving..." : "Save Subscription"}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            This amount will be automatically added to your expenses on each billing cycle.
          </p>
        </div>

        {/* Smart Analysis card */}
        <Card className="p-4 rounded-xl bg-muted/40 border border-border/40 flex gap-3 shadow-none">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-primary text-sm">Smart Analysis</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              Based on your history, users usually spend 15% less on {category} when tracking recurring costs.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AddRecurringExpense;
