import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { X, ArrowRight, Bell, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { getCurrencySymbol } from "@/lib/currencies";
import { cn } from "@/lib/utils";
import { CategoryPicker, EXPENSE_CATEGORY_OPTIONS } from "@/components/CategoryPicker";

const PERIODS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const CreateBudget = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState("$");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Rent");
  const [period, setPeriod] = useState("monthly");
  const [alertsOn, setAlertsOn] = useState(true);
  const [alert50, setAlert50] = useState(true);
  const [alert80, setAlert80] = useState(true);
  const [alert100, setAlert100] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("default_currency")
        .eq("user_id", user.id)
        .single();
      if (data?.default_currency) setSymbol(getCurrencySymbol(data.default_currency));
    })();
  }, []);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const now = new Date();
      const { error } = await supabase.from("budgets").insert([
        {
          user_id: user.id,
          category,
          amount: parseFloat(amount),
          period,
          year: now.getFullYear(),
          month: period === "monthly" ? now.getMonth() + 1 : null,
        },
      ]);
      if (error) throw error;

      // Save alert thresholds
      if (alertsOn) {
        const thresholds = [
          alert50 && 50,
          alert80 && 80,
          alert100 && 100,
        ].filter(Boolean) as number[];
        // Use the highest threshold (single row per category)
        const threshold = thresholds.length > 0 ? Math.max(...thresholds) : 80;
        await supabase.from("budget_alerts").upsert(
          {
            user_id: user.id,
            category,
            threshold_percentage: threshold,
            is_enabled: true,
          },
          { onConflict: "user_id,category" } as any
        ).then((r) => r);
      }

      toast.success("Budget created!");
      navigate("/budgets");
    } catch (e: any) {
      toast.error(e.message || "Failed to create budget");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in -mx-4 -mt-4 md:mx-0 md:mt-0 pb-32">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
          <X className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-bold text-primary">Create New Budget</h1>
        <div className="w-9" />
      </div>

      <div className="p-4 space-y-4">
        {/* Amount */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Budget Amount
          </p>
          <div className="h-14 rounded-2xl border border-border bg-card px-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-base font-bold text-primary">{symbol}</span>
            </div>
            <Input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border-0 shadow-none bg-transparent text-2xl font-bold h-auto p-0 focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Select Category
          </p>
          <CategoryPicker
            value={category}
            onChange={setCategory}
            options={EXPENSE_CATEGORY_OPTIONS}
          />
        </div>

        {/* Period */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Budget Period
          </p>
          <div className="bg-muted/60 rounded-full p-1 grid grid-cols-3">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "h-9 rounded-full font-semibold text-xs transition-all",
                  period === p.value
                    ? "bg-card text-primary shadow"
                    : "text-muted-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts card */}
        <Card className="rounded-2xl p-3.5 border-border/40 shadow-sm space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-sm">Spending Alerts</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Get notified when you hit milestones
              </p>
            </div>
            <Switch checked={alertsOn} onCheckedChange={setAlertsOn} />
          </div>

          <div className={cn("space-y-1.5 pt-1", !alertsOn && "opacity-40 pointer-events-none")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs font-medium">At 50% reached</span>
              </div>
              <Checkbox checked={alert50} onCheckedChange={(v) => setAlert50(!!v)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                </div>
                <span className="text-xs font-medium">At 80% reached</span>
              </div>
              <Checkbox checked={alert80} onCheckedChange={(v) => setAlert80(!!v)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                </div>
                <span className="text-xs font-medium">At 100% (Limit)</span>
              </div>
              <Checkbox checked={alert100} onCheckedChange={(v) => setAlert100(!!v)} />
            </div>
          </div>
        </Card>

        {/* Info */}
        <Card className="rounded-2xl p-3 bg-primary/5 border-0">
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Info className="w-3 h-3 text-primary-foreground" />
            </div>
            <p className="text-[11px] text-foreground leading-relaxed">
              Setting a realistic budget is the first step toward financial freedom. We'll track
              your <span className="font-bold text-primary">{category}</span> spending automatically.
            </p>
          </div>
        </Card>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-20 left-0 right-0 p-3 bg-background/95 backdrop-blur border-t border-border/40 md:hidden z-20 safe-bottom">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-12 text-sm font-bold rounded-2xl shadow-lg shadow-primary/30 gap-2"
        >
          {loading ? "Creating..." : "Create Budget"}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </Button>
      </div>
      <div className="hidden md:block px-4">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-12 text-sm font-bold rounded-2xl shadow-lg shadow-primary/30 gap-2"
        >
          {loading ? "Creating..." : "Create Budget"}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

export default CreateBudget;
