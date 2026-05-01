import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  SelectGroup, SelectLabel,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Tag, CalendarClock, Shapes, CheckSquare, Trash2 } from "lucide-react";
import { useGroupedCategories } from "@/hooks/useCategories";
import { getCurrencySymbol } from "@/lib/currencies";
import { Skeleton } from "@/components/ui/skeleton";

const EditRecurringExpense = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const groupedCategories = useGroupedCategories();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currency, setCurrency] = useState("USD");

  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [category, setCategory] = useState("Entertainment");
  const [nextDate, setNextDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !id) return;

        const [profileRes, recRes] = await Promise.all([
          supabase.from("profiles").select("default_currency").eq("user_id", user.id).maybeSingle(),
          supabase.from("recurring_expenses").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
        ]);

        if (profileRes.data?.default_currency) setCurrency(profileRes.data.default_currency);

        if (recRes.error) throw recRes.error;
        if (!recRes.data) {
          toast({ title: "Not found", description: "This subscription doesn't exist.", variant: "destructive" });
          navigate("/recurring-expenses");
          return;
        }

        const r = recRes.data;
        setAmount(String(r.amount));
        setName(r.description || "");
        setFrequency(r.frequency);
        setCategory(r.category);
        setNextDate(r.start_date);
        setIsActive(r.is_active);
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const symbol = getCurrencySymbol(currency);

  const handleSave = async () => {
    if (!amount || !name || !nextDate) {
      toast({ title: "Missing info", description: "Add amount, name and next billing date.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("recurring_expenses")
        .update({
          category,
          amount: parseFloat(amount),
          description: name,
          frequency,
          start_date: nextDate,
          is_active: isActive,
        })
        .eq("id", id!);
      if (error) throw error;
      toast({ title: "Updated", description: `${name} saved.` });
      navigate("/recurring-expenses");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this recurring payment?")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("recurring_expenses").delete().eq("id", id!);
      if (error) throw error;
      toast({ title: "Deleted", description: "Subscription removed." });
      navigate("/recurring-expenses");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="pb-24 max-w-md mx-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 h-14 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-primary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-bold text-primary text-base">Edit Payment</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-primary font-semibold text-sm disabled:opacity-50"
        >
          {saving ? "..." : "Save"}
        </button>
      </div>

      <div className="px-4 pt-5 space-y-5">
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

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Subscription Name</Label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Netflix, Rent"
              className="h-11 pl-10 rounded-xl bg-background border-border/60"
            />
          </div>
        </div>

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

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 rounded-xl bg-background border-border/60">
              <div className="flex items-center gap-2">
                <Shapes className="h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-[60vh]">
              {groupedCategories.map(([group, items]) => (
                <SelectGroup key={group}>
                  <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {group}
                  </SelectLabel>
                  {items.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.emoji} {c.value}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Next Billing Date</Label>
          <Input
            type="date"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
            className="h-11 rounded-xl bg-background border-border/60"
          />
        </div>

        <Card className="p-3 rounded-xl border border-border/60 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Active</p>
            <p className="text-xs text-muted-foreground">Pause to stop tracking it</p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </Card>

        <div className="pt-2 space-y-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-xl text-base font-semibold gap-2"
          >
            <CheckSquare className="h-5 w-5" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            variant="ghost"
            className="w-full h-11 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete Payment"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditRecurringExpense;
