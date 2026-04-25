import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { CalendarIcon, X, ChevronUp, ChevronDown, Sparkles, ScanLine } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { pushNotificationService } from "@/services/pushNotifications";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { getCurrencySymbol } from "@/lib/currencies";
import { cn } from "@/lib/utils";
import { Utensils, ShoppingBag, Car, Home, Film, Heart, Zap, MoreHorizontal, Banknote, Tag as TagIcon, Briefcase } from "lucide-react";

const EXPENSE_QUICK = [
  { value: "Dining", label: "Food", Icon: Utensils },
  { value: "Shopping", label: "Shop", Icon: ShoppingBag },
  { value: "Transport", label: "Travel", Icon: Car },
  { value: "Rent", label: "Rent", Icon: Home },
  { value: "Entertainment", label: "Fun", Icon: Film },
  { value: "Health", label: "Health", Icon: Heart },
  { value: "Utilities", label: "Bills", Icon: Zap },
  { value: "Other", label: "Other", Icon: MoreHorizontal },
];

const INCOME_QUICK = [
  { value: "Salary", label: "Salary", Icon: Banknote },
  { value: "Selling", label: "Selling", Icon: TagIcon },
  { value: "Business", label: "Business", Icon: Briefcase },
  { value: "Other", label: "Other", Icon: MoreHorizontal },
];

const AddExpense = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [showScanner, setShowScanner] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    category: "Dining",
    description: "",
    date: new Date(),
    paymentMethod: "",
    vendor: "",
    notes: "",
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("default_currency")
          .eq("user_id", user.id)
          .single();
        if (profile?.default_currency) setDefaultCurrency(profile.default_currency);
      }
    })();
  }, []);

  const symbol = getCurrencySymbol(defaultCurrency);

  const adjustAmount = (delta: number) => {
    const v = parseFloat(formData.amount || "0");
    const next = Math.max(0, v + delta);
    setFormData({ ...formData, amount: next.toFixed(2) });
  };

  const handleAICategorize = async () => {
    if (!formData.notes && !formData.vendor) {
      toast.error("Add a note or vendor first");
      return;
    }
    setAiLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-categorize-expense`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: formData.notes,
            amount: formData.amount,
            vendor: formData.vendor,
          }),
        }
      );
      if (!response.ok) throw new Error("AI failed");
      const { category } = await response.json();
      setFormData({ ...formData, category });
      toast.success(`AI suggested: ${category}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const amount = parseFloat(formData.amount);
      const { error } = await supabase.from("expenses").insert([
        {
          user_id: user.id,
          amount: type === "income" ? -Math.abs(amount) : Math.abs(amount),
          category: formData.category,
          description: formData.notes,
          date: format(formData.date, "yyyy-MM-dd"),
          payment_method: formData.paymentMethod || null,
          vendor: formData.vendor || null,
          notes: formData.notes || null,
          currency: defaultCurrency,
          original_amount: amount,
          exchange_rate: 1.0,
        },
      ]);
      if (error) throw error;
      toast.success(type === "income" ? "Income added!" : "Expense added!");
      pushNotificationService.checkBudgetAlerts(formData.category);
      navigate("/expenses");
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptScan = (data: any) => {
    setFormData({
      ...formData,
      amount: data.amount || formData.amount,
      category: data.category || formData.category,
      vendor: data.vendor || formData.vendor,
      notes: data.description || formData.notes,
    });
    setShowScanner(false);
  };

  return (
    <div className="animate-fade-in -mx-4 -mt-4 md:mx-0 md:mt-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
          <X className="h-5 w-5 text-primary" />
        </Button>
        <h1 className="text-base font-bold text-primary">
          Add {type === "expense" ? "Transaction" : "Income"}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowScanner(true)}
          className="h-9 w-9 text-primary"
        >
          <ScanLine className="h-5 w-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        {/* Amount */}
        <div className="text-center pt-2">
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-3">
            Enter Amount
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-bold text-primary">{symbol}</span>
            <Input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="h-14 text-4xl font-bold text-center border-0 shadow-none bg-transparent w-44 px-0 placeholder:text-muted-foreground/40 focus-visible:ring-0"
            />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => adjustAmount(1)}
                className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center"
              >
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(-1)}
                className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center"
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Type tabs */}
        <div className="bg-muted/60 rounded-full p-1 grid grid-cols-2">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={cn(
              "h-10 rounded-full font-bold text-xs uppercase tracking-wider transition-all",
              type === "expense"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground"
            )}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setType("income");
              if (!INCOME_QUICK.some((c) => c.value === formData.category)) {
                setFormData((f) => ({ ...f, category: "Salary" }));
              }
            }}
            className={cn(
              "h-10 rounded-full font-bold text-xs uppercase tracking-wider transition-all",
              type === "income"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground"
            )}
          >
            Income
          </button>
        </div>

        {/* Category grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base">Category</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAICategorize}
              disabled={aiLoading}
              className="h-7 text-xs gap-1 text-primary hover:bg-primary/10 px-2"
            >
              <Sparkles className="h-3 w-3" />
              {aiLoading ? "..." : "AI Suggest"}
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {QUICK_CATEGORIES.map((c) => {
              const active = formData.category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: c.value })}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                      active
                        ? "bg-success text-success-foreground shadow-md shadow-success/30"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <c.Icon className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  <span className="text-xs font-medium">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Date
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full h-12 rounded-2xl border border-border bg-card px-4 flex items-center justify-between text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {format(formData.date, "MM/dd/yyyy")}
                </span>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(d) => d && setFormData({ ...formData, date: d })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Notes
          </p>
          <Textarea
            placeholder="What was this for?"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="min-h-[88px] rounded-2xl border-border bg-card resize-none"
          />
        </div>

        {/* Vendor (optional) */}
        <Input
          placeholder="Vendor / store (optional)"
          value={formData.vendor}
          onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
          className="h-12 rounded-2xl border-border bg-card"
        />

        {/* Submit */}
        <div className="space-y-2 pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/30"
          >
            {loading ? "Saving..." : "Save Transaction"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(-1)}
            className="w-full h-11 text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Scanner modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowScanner(false)}>
          <div className="bg-card rounded-3xl p-4 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <ReceiptScanner onScanComplete={handleReceiptScan} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AddExpense;
