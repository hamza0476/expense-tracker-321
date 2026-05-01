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
import {
  CategoryPicker,
  EXPENSE_CATEGORY_OPTIONS,
  INCOME_CATEGORY_OPTIONS,
} from "@/components/CategoryPicker";

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
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      toast.error("Not authenticated");
      setLoading(false);
      return;
    }
    const amount = parseFloat(formData.amount);
    const isIncome = type === "income";

    // Optimistic UX: show feedback and navigate immediately
    toast.success(isIncome ? "Income added!" : "Expense added!");
    navigate(isIncome ? "/" : "/expenses");

    // Fire-and-forget the insert in the background
    supabase
      .from("expenses")
      .insert([
        {
          user_id: user.id,
          amount: isIncome ? -Math.abs(amount) : Math.abs(amount),
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
      ])
      .then(({ error }) => {
        if (error) {
          toast.error("Failed to save — please try again");
        } else if (!isIncome) {
          pushNotificationService.checkBudgetAlerts(formData.category);
        }
      });
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

      <form onSubmit={handleSubmit} className="p-3 md:p-4 space-y-2.5 md:space-y-4">
        {/* Amount */}
        <div className="text-center pt-0.5 md:pt-1">
          <p className="text-[9px] md:text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-1 md:mb-2">
            Enter Amount
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl md:text-2xl font-bold text-primary">{symbol}</span>
            <Input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="h-10 md:h-12 text-2xl md:text-3xl font-bold text-center border-0 shadow-none bg-transparent w-36 md:w-40 px-0 placeholder:text-muted-foreground/40 focus-visible:ring-0"
            />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => adjustAmount(1)}
                className="w-6 h-6 rounded-md bg-muted hover:bg-primary/15 flex items-center justify-center"
              >
                <ChevronUp className="w-3.5 h-3.5 text-primary" />
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(-1)}
                className="w-6 h-6 rounded-md bg-muted hover:bg-primary/15 flex items-center justify-center"
              >
                <ChevronDown className="w-3.5 h-3.5 text-primary" />
              </button>
            </div>
          </div>
        </div>

        {/* Type tabs */}
        <div className="bg-muted/60 rounded-full p-1 grid grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setType("expense");
              if (!EXPENSE_CATEGORY_OPTIONS.some((c) => c.value === formData.category)) {
                setFormData((f) => ({ ...f, category: "Dining" }));
              }
            }}
            className={cn(
              "h-8 md:h-9 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all",
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
              if (!INCOME_CATEGORY_OPTIONS.some((c) => c.value === formData.category)) {
                setFormData((f) => ({ ...f, category: "Salary" }));
              }
            }}
            className={cn(
              "h-8 md:h-9 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all",
              type === "income"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground"
            )}
          >
            Income
          </button>
        </div>

        {/* Category dropdown */}
        <div className="space-y-1.5 md:space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs md:text-sm">Category</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAICategorize}
              disabled={aiLoading}
              className="h-7 text-[11px] gap-1 text-primary hover:bg-primary/10 px-2"
            >
              <Sparkles className="h-3 w-3" />
              {aiLoading ? "..." : "AI Suggest"}
            </Button>
          </div>
          <CategoryPicker
            value={formData.category}
            onChange={(v) => setFormData({ ...formData, category: v })}
            {...(type === "income" ? { options: INCOME_CATEGORY_OPTIONS } : {})}
          />
        </div>

        {/* Date */}
        <div className="space-y-1 md:space-y-1.5">
          <p className="text-[9px] md:text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            Date
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full h-10 md:h-11 rounded-xl md:rounded-2xl border border-border bg-card px-3 flex items-center justify-between text-xs md:text-sm font-medium"
              >
                <span className="flex items-center gap-2 md:gap-2.5">
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-muted flex items-center justify-center">
                    <CalendarIcon className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" />
                  </div>
                  {format(formData.date, "MM/dd/yyyy")}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
        <div className="space-y-1 md:space-y-1.5">
          <p className="text-[9px] md:text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            Notes
          </p>
          <Textarea
            placeholder="What was this for?"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="min-h-[52px] md:min-h-[72px] rounded-xl md:rounded-2xl border-border bg-card resize-none text-xs md:text-sm py-2"
          />
        </div>

        {/* Vendor (optional) */}
        <Input
          placeholder="Vendor / store (optional)"
          value={formData.vendor}
          onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
          className="h-10 md:h-11 rounded-xl md:rounded-2xl border-border bg-card text-xs md:text-sm"
        />

        {/* Submit */}
        <div className="space-y-1.5 md:space-y-2 pt-0.5 md:pt-1">
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 md:h-12 text-xs md:text-sm font-bold rounded-xl md:rounded-2xl shadow-lg shadow-primary/30"
          >
            {loading ? "Saving..." : "Save Transaction"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(-1)}
            className="w-full h-8 md:h-9 text-muted-foreground text-xs md:text-sm"
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
