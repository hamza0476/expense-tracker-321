import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Camera, Loader2, Check, Bell, Moon, Download, LogOut, ChevronRight,
  Settings, Wallet, User, Image as ImageIcon, X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { CURRENCIES, getCurrencySymbol, formatCurrency } from "@/lib/currencies";
import { formatNumber } from "@/lib/utils";

interface ProfileData {
  full_name: string;
  avatar_url?: string;
  theme?: string;
  default_currency?: string;
  monthly_income?: number;
  budget_alerts_enabled?: boolean;
}

const Profile = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingIncome, setSavingIncome] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [email, setEmail] = useState("");
  const [memberSince, setMemberSince] = useState<string>("");
  const [expensesCount, setExpensesCount] = useState(0);
  const [spentThisMonth, setSpentThisMonth] = useState(0);
  const [budgetTotal, setBudgetTotal] = useState(0);
  const [goals, setGoals] = useState<Array<{ id: string; title: string; current_amount: number; target_amount: number }>>([]);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [editingIncome, setEditingIncome] = useState(false);
  const [tempIncome, setTempIncome] = useState("");
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    avatar_url: "",
    theme: "dark",
    default_currency: "USD",
    monthly_income: 0,
    budget_alerts_enabled: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      setMemberSince(user.created_at || "");

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [profileRes, expensesCountRes, monthExpensesRes, budgetsRes, goalsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("expenses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("expenses").select("amount").eq("user_id", user.id).gte("date", startOfMonth.split("T")[0]),
        supabase.from("budgets").select("amount").eq("user_id", user.id).eq("year", now.getFullYear()),
        supabase.from("savings_goals").select("id, title, current_amount, target_amount").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
      ]);

      if (profileRes.data) {
        const p = profileRes.data;
        setProfile({
          full_name: p.full_name || "",
          avatar_url: p.avatar_url || "",
          theme: p.theme || "dark",
          default_currency: p.default_currency || "USD",
          monthly_income: Number(p.monthly_income) || 0,
          budget_alerts_enabled: p.budget_alerts_enabled !== false,
        });
        setTempName(p.full_name || "");
        setTempIncome(String(Number(p.monthly_income) || 0));
        if (p.theme) setTheme(p.theme);
      }
      setExpensesCount(expensesCountRes.count || 0);
      setSpentThisMonth((monthExpensesRes.data || []).reduce((sum, e: any) => sum + Number(e.amount), 0));
      setBudgetTotal((budgetsRes.data || []).reduce((sum, b: any) => sum + Number(b.amount), 0));
      setGoals(goalsRes.data || []);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (patch: Partial<ProfileData>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase.from("profiles").update(patch).eq("user_id", user.id);
    if (error) throw error;
  };

  const processFile = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in again"); return; }

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      // RLS requires path to start with the user's id as the first folder.
      const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, cacheControl: "3600", contentType: file.type });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      // Cache-bust so the new image displays immediately
      const bustedUrl = `${publicUrl}?v=${Date.now()}`;

      await updateProfile({ avatar_url: bustedUrl });
      setProfile(p => ({ ...p, avatar_url: bustedUrl }));

      // Notify Layout (top bar avatar) to refresh
      window.dispatchEvent(new CustomEvent("profile:updated", { detail: { avatar_url: bustedUrl } }));

      toast.success("Profile picture updated");
    } catch (e: any) {
      console.error("Avatar upload failed:", e);
      toast.error(e?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleSaveName = async () => {
    const trimmed = tempName.trim();
    if (!trimmed) { toast.error("Name cannot be empty"); return; }
    if (trimmed.length > 100) { toast.error("Name too long"); return; }
    try {
      setSavingName(true);
      await updateProfile({ full_name: trimmed });
      setProfile(p => ({ ...p, full_name: trimmed }));
      window.dispatchEvent(new CustomEvent("profile:updated", { detail: { full_name: trimmed } }));
      setEditingName(false);
      toast.success("Name updated");
    } catch { toast.error("Failed to save"); }
    finally { setSavingName(false); }
  };

  const handleSaveIncome = async () => {
    const value = Number(tempIncome);
    if (isNaN(value) || value < 0) { toast.error("Enter a valid amount"); return; }
    try {
      setSavingIncome(true);
      await updateProfile({ monthly_income: value });
      setProfile(p => ({ ...p, monthly_income: value }));
      setEditingIncome(false);
      toast.success("Monthly income updated");
    } catch { toast.error("Failed to save"); }
    finally { setSavingIncome(false); }
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    try {
      await updateProfile({ default_currency: newCurrency });
      setProfile(p => ({ ...p, default_currency: newCurrency }));
      toast.success("Currency updated");
      setTimeout(() => window.location.reload(), 600);
    } catch { toast.error("Failed to update currency"); }
  };

  const handleAlertsToggle = async (enabled: boolean) => {
    setProfile(p => ({ ...p, budget_alerts_enabled: enabled }));
    try { await updateProfile({ budget_alerts_enabled: enabled }); }
    catch { setProfile(p => ({ ...p, budget_alerts_enabled: !enabled })); toast.error("Failed to update"); }
  };

  const handleDarkModeToggle = async (enabled: boolean) => {
    const newTheme = enabled ? "dark" : "light";
    setTheme(newTheme);
    setProfile(p => ({ ...p, theme: newTheme }));
    try { await updateProfile({ theme: newTheme }); }
    catch { /* silent */ }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/splash");
  };

  const currency = profile.default_currency || "USD";
  const symbol = getCurrencySymbol(currency);
  const income = profile.monthly_income || 0;
  const saved = Math.max(0, income - spentThisMonth);
  const savingsRate = income > 0 ? Math.round((saved / income) * 100) : 0;
  const onBudgetPct = budgetTotal > 0 ? Math.max(0, Math.min(100, Math.round(((budgetTotal - spentThisMonth) / budgetTotal) * 100))) : 0;
  const memberLabel = memberSince
    ? `Since ${new Date(memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
    : "—";

  if (loading) {
    return (
      <div className="max-w-md mx-auto space-y-3 px-1 animate-fade-in">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-4 space-y-4 animate-fade-in">
      {/* Header row */}
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl font-bold tracking-tight">Profile</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/settings")}
          aria-label="Open settings"
          className="h-9 w-9 rounded-full bg-muted/60 hover:bg-muted"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Avatar + Name row */}
      <div className="flex items-center gap-3 px-1">
        <div className="relative shrink-0">
          <div className="p-[2px] rounded-full bg-gradient-to-br from-primary to-accent">
            <Avatar className="h-20 w-20 border-2 border-background">
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} className="object-cover" />
              <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                {(profile.full_name || email).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile picture"
            className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-success text-success-foreground border-2 border-background flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="flex-1 min-w-0">
          <button
            onClick={() => { setTempName(profile.full_name); setEditingName(true); }}
            className="text-left w-full"
          >
            <h2 className="text-lg font-bold truncate hover:text-primary transition-colors">
              {profile.full_name || "Add your name"}
            </h2>
          </button>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-success/15 text-success border border-success/30">
              Pro member
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/50">
              {memberLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Hidden file input for upload from gallery (desktop) */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="avatar-gallery-input"
      />

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-2 px-1">
        <Card className="border-border/40 bg-card/60 backdrop-blur shadow-sm">
          <CardContent className="p-3 flex flex-col items-center text-center">
            <span className="text-lg font-bold tabular-nums">{formatNumber(expensesCount)}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">Expenses</span>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur shadow-sm">
          <CardContent className="p-3 flex flex-col items-center text-center">
            <span className="text-lg font-bold tabular-nums text-success">{onBudgetPct}%</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">On budget</span>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur shadow-sm">
          <CardContent className="p-3 flex flex-col items-center text-center">
            <span className="text-lg font-bold">{currency}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">Currency</span>
          </CardContent>
        </Card>
      </div>

      {/* FINANCIAL OVERVIEW */}
      <div className="px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Financial Overview
        </h3>
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Monthly income</span>
              <button
                onClick={() => { setTempIncome(String(income)); setEditingIncome(true); }}
                className="text-sm font-bold tabular-nums hover:text-primary transition-colors text-right"
              >
                {formatCurrency(income, currency)}
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Spent this month</span>
              <span className="text-sm font-bold tabular-nums text-destructive">
                {formatCurrency(spentThisMonth, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Saved this month</span>
              <span className="text-sm font-bold tabular-nums text-success">
                {formatCurrency(saved, currency)}
              </span>
            </div>
            <div className="pt-1 space-y-1.5">
              <Progress value={savingsRate} className="h-1.5" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Savings rate</span>
                <span className="text-xs font-bold tabular-nums text-success">{savingsRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GOALS */}
      <div className="px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Goals
        </h3>
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-4">
            {goals.length === 0 ? (
              <button
                onClick={() => navigate("/savings-goals")}
                className="w-full py-3 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                + Add your first savings goal
              </button>
            ) : (
              <div className="space-y-3">
                {goals.map((g) => {
                  const pct = g.target_amount > 0
                    ? Math.min(100, Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100))
                    : 0;
                  const barColor = pct >= 75 ? "bg-success" : pct >= 40 ? "bg-primary" : "bg-warning";
                  return (
                    <button
                      key={g.id}
                      onClick={() => navigate("/savings-goals")}
                      className="w-full text-left group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                          {g.title}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                          {symbol}{formatNumber(Number(g.current_amount) / 1000, { decimals: 0 })}k / {formatNumber(Number(g.target_amount) / 1000, { decimals: 0 })}k
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PREFERENCES */}
      <div className="px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Preferences
        </h3>
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <CardContent className="p-0 divide-y divide-border/40">
            {/* Default currency */}
            <div className="flex items-center justify-between gap-3 p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
                  <Wallet className="h-4 w-4 text-success" />
                </div>
                <span className="text-sm font-medium truncate">Default currency</span>
              </div>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-auto h-8 border-0 bg-transparent px-2 gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span><span>{c.code}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Budget alerts */}
            <div className="flex items-center justify-between gap-3 p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium truncate">Budget alerts</span>
              </div>
              <Switch
                checked={!!profile.budget_alerts_enabled}
                onCheckedChange={handleAlertsToggle}
              />
            </div>

            {/* Dark mode */}
            <div className="flex items-center justify-between gap-3 p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
                  <Moon className="h-4 w-4 text-destructive" />
                </div>
                <span className="text-sm font-medium truncate">Dark mode</span>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>

            {/* Export data */}
            <button
              onClick={() => navigate("/data-export")}
              className="w-full flex items-center justify-between gap-3 p-3.5 hover:bg-muted/40 transition-colors active:bg-muted/60"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Download className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">Export data</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Sign out */}
      <div className="px-1">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-destructive/10 hover:bg-destructive/15 active:bg-destructive/20 border border-destructive/30 transition-colors disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-destructive/20 flex items-center justify-center">
              {signingOut ? (
                <Loader2 className="h-4 w-4 text-destructive animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 text-destructive" />
              )}
            </div>
            <span className="text-sm font-semibold text-destructive">Sign out</span>
          </div>
          <ChevronRight className="h-4 w-4 text-destructive" />
        </button>
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={editingName} onOpenChange={setEditingName}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit name</DialogTitle>
          </DialogHeader>
          <Input
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="Your full name"
            maxLength={100}
            autoFocus
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingName(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveName} disabled={savingName} className="rounded-xl">
              {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" />Save</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Income Dialog */}
      <Dialog open={editingIncome} onOpenChange={setEditingIncome}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Monthly income</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              {symbol}
            </span>
            <Input
              type="number"
              inputMode="decimal"
              value={tempIncome}
              onChange={(e) => setTempIncome(e.target.value)}
              placeholder="0"
              className="pl-8"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingIncome(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveIncome} disabled={savingIncome} className="rounded-xl">
              {savingIncome ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" />Save</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
