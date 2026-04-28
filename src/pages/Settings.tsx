import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Lock, ShieldCheck, Bell, Globe, Wallet, FileText,
  Scale, HelpCircle, MessageSquare, BookOpen, Info, Trash2,
  ChevronRight, LogOut, Camera, Loader2, User as UserIcon, Check,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { CURRENCIES } from "@/lib/currencies";

const APP_VERSION = "2.4.1 (Build 1082)";

interface ProfileData {
  full_name: string;
  avatar_url?: string;
  default_currency?: string;
  budget_alerts_enabled?: boolean;
  theme?: string;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="px-1">
    <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5 px-1">
      {title}
    </h3>
    <Card className="border-border/40 shadow-sm overflow-hidden">
      <CardContent className="p-0 divide-y divide-border/40">
        {children}
      </CardContent>
    </Card>
  </div>
);

interface RowProps {
  icon: React.ReactNode;
  iconBg?: string;
  label: string;
  value?: React.ReactNode;
  onClick?: () => void;
  trailing?: React.ReactNode;
  destructive?: boolean;
}
const Row = ({ icon, iconBg = "bg-primary/10", label, value, onClick, trailing, destructive }: RowProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick && !trailing}
    className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-muted/40 active:bg-muted/60 transition-colors disabled:cursor-default disabled:hover:bg-transparent"
  >
    <div className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <span className={`flex-1 text-sm font-medium truncate ${destructive ? "text-destructive" : ""}`}>{label}</span>
    {value !== undefined && (
      <span className="text-xs text-muted-foreground tabular-nums truncate max-w-[40%] text-right">{value}</span>
    )}
    {trailing ? trailing : (onClick && <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />)}
  </button>
);

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    avatar_url: "",
    default_currency: "USD",
    budget_alerts_enabled: true,
    theme: "system",
  });

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [editingPwd, setEditingPwd] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [signOutOpen, setSignOutOpen] = useState(false);

  useEffect(() => { (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/splash"); return; }
      setEmail(user.email || "");
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          avatar_url: data.avatar_url || "",
          default_currency: data.default_currency || "USD",
          budget_alerts_enabled: data.budget_alerts_enabled !== false,
          theme: data.theme || "system",
        });
        setTempName(data.full_name || "");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  })(); }, [navigate]);

  const updateProfile = async (patch: Partial<ProfileData>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase.from("profiles").update(patch).eq("user_id", user.id);
    if (error) throw error;
  };

  const handleAvatar = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please pick an image"); return; }
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in again"); return; }
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(filePath, file, {
        upsert: true, cacheControl: "3600", contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const bustedUrl = `${publicUrl}?v=${Date.now()}`;
      await updateProfile({ avatar_url: bustedUrl });
      setProfile(p => ({ ...p, avatar_url: bustedUrl }));
      window.dispatchEvent(new CustomEvent("profile:updated", { detail: { avatar_url: bustedUrl } }));
      toast.success("Profile picture updated");
    } catch (e: any) {
      console.error("Avatar upload failed:", e);
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleAvatar(f);
    e.target.value = "";
  };

  const handleSaveName = async () => {
    const t = tempName.trim();
    if (!t) { toast.error("Name cannot be empty"); return; }
    try {
      setSavingName(true);
      await updateProfile({ full_name: t });
      setProfile(p => ({ ...p, full_name: t }));
      window.dispatchEvent(new CustomEvent("profile:updated", { detail: { full_name: t } }));
      setEditingName(false);
      toast.success("Name updated");
    } catch { toast.error("Failed to save name"); }
    finally { setSavingName(false); }
  };

  const handleChangePassword = async () => {
    if (newPwd.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPwd !== confirmPwd) { toast.error("Passwords do not match"); return; }
    try {
      setSavingPwd(true);
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      setEditingPwd(false);
      setNewPwd(""); setConfirmPwd("");
      toast.success("Password updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update password");
    } finally { setSavingPwd(false); }
  };

  const handleCurrency = async (code: string) => {
    try {
      await updateProfile({ default_currency: code });
      setProfile(p => ({ ...p, default_currency: code }));
      toast.success("Currency updated");
      setTimeout(() => window.location.reload(), 500);
    } catch { toast.error("Failed to update"); }
  };

  const handleAlerts = async (v: boolean) => {
    setProfile(p => ({ ...p, budget_alerts_enabled: v }));
    try { await updateProfile({ budget_alerts_enabled: v }); }
    catch { setProfile(p => ({ ...p, budget_alerts_enabled: !v })); toast.error("Failed to update"); }
  };

  const handleDark = async (enabled: boolean) => {
    const newTheme = enabled ? "dark" : "light";
    setTheme(newTheme);
    setProfile(p => ({ ...p, theme: newTheme }));
    try { await updateProfile({ theme: newTheme }); } catch { /* silent */ }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/splash");
  };

  const handleClearCache = () => {
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith("expensewiz-") || k.includes("query-cache")) localStorage.removeItem(k);
      });
      toast.success("Cache cleared");
    } catch { toast.error("Failed to clear cache"); }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto space-y-3 px-1 animate-fade-in">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  const initials = (profile.full_name || email).slice(0, 2).toUpperCase();
  const currencyCode = profile.default_currency || "USD";
  const currencyMeta = CURRENCIES.find(c => c.code === currencyCode);

  return (
    <div className="max-w-md mx-auto pb-4 space-y-3 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-primary font-semibold text-base active:scale-95 transition-transform"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
          Settings
        </button>
        <button
          onClick={() => navigate("/profile")}
          aria-label="Profile"
          className="active:scale-95 transition-transform"
        >
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
            <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>

      {/* Profile card */}
      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative shrink-0 active:scale-95 transition-transform"
            aria-label="Change profile picture"
          >
            <Avatar className="h-12 w-12 bg-primary/10">
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary">
                <UserIcon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary text-primary-foreground border-2 border-card flex items-center justify-center">
              {uploading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Camera className="h-2.5 w-2.5" />}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
          <button
            onClick={() => navigate("/profile")}
            className="flex-1 min-w-0 text-left"
          >
            <p className="text-sm font-bold truncate">{profile.full_name || "Add your name"}</p>
            <p className="text-xs text-muted-foreground truncate">
              <span className="text-success font-semibold">Pro Member</span> · {email}
            </p>
          </button>
          <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
        </CardContent>
      </Card>

      {/* ACCOUNT & SECURITY */}
      <Section title="Account & Security">
        <Row
          icon={<Lock className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/10"
          label="Change Password"
          onClick={() => setEditingPwd(true)}
        />
        <Row
          icon={<UserIcon className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/10"
          label="Edit Name"
          value={profile.full_name || "—"}
          onClick={() => { setTempName(profile.full_name); setEditingName(true); }}
        />
        <Row
          icon={<ShieldCheck className="h-4 w-4 text-success" />}
          iconBg="bg-success/10"
          label="Email"
          value={email}
        />
      </Section>

      {/* PREFERENCES */}
      <Section title="Preferences">
        <Row
          icon={<Bell className="h-4 w-4 text-warning" />}
          iconBg="bg-warning/10"
          label="Budget Alerts"
          trailing={<Switch checked={!!profile.budget_alerts_enabled} onCheckedChange={handleAlerts} />}
        />
        <Row
          icon={<Globe className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/10"
          label="Language"
          value="English (US)"
        />
        <Row
          icon={<Wallet className="h-4 w-4 text-success" />}
          iconBg="bg-success/10"
          label="Currency"
          trailing={
            <Select value={currencyCode} onValueChange={handleCurrency}>
              <SelectTrigger className="w-auto h-7 border-0 bg-transparent px-1.5 gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground focus:ring-0">
                <SelectValue>
                  {currencyMeta ? `${currencyCode} (${currencyMeta.symbol})` : currencyCode}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="flex items-center gap-2"><span>{c.flag}</span><span>{c.code}</span></span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
        <Row
          icon={<Bell className="h-4 w-4 text-accent" />}
          iconBg="bg-accent/10"
          label="Dark Mode"
          trailing={<Switch checked={theme === "dark"} onCheckedChange={handleDark} />}
        />
      </Section>

      {/* PRIVACY & LEGAL */}
      <Section title="Privacy & Legal">
        <Row
          icon={<FileText className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/10"
          label="Privacy Policy"
          onClick={() => toast.info("Privacy policy coming soon")}
        />
        <Row
          icon={<Scale className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/10"
          label="Terms of Service"
          onClick={() => toast.info("Terms coming soon")}
        />
      </Section>

      {/* SUPPORT */}
      <Section title="Support">
        <Row
          icon={<MessageSquare className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/10"
          label="Contact Us"
          onClick={() => window.location.href = "mailto:support@expensewiz.app"}
        />
        <Row
          icon={<HelpCircle className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/10"
          label="FAQ"
          onClick={() => toast.info("FAQ coming soon")}
        />
        <Row
          icon={<BookOpen className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/10"
          label="Help Center"
          onClick={() => toast.info("Help center coming soon")}
        />
      </Section>

      {/* APP INFO */}
      <Section title="App Info">
        <Row
          icon={<Info className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/10"
          label="Version"
          value={APP_VERSION}
        />
        <Row
          icon={<Trash2 className="h-4 w-4 text-destructive" />}
          iconBg="bg-destructive/10"
          label="Clear Cache"
          destructive
          onClick={handleClearCache}
        />
      </Section>

      {/* Sign Out */}
      <div className="px-1 pt-1">
        <Button
          variant="outline"
          onClick={() => setSignOutOpen(true)}
          className="w-full h-11 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Edit name dialog */}
      <Dialog open={editingName} onOpenChange={setEditingName}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Edit name</DialogTitle></DialogHeader>
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

      {/* Change password dialog */}
      <Dialog open={editingPwd} onOpenChange={setEditingPwd}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Change password</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="New password (min 8 chars)"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              autoFocus
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingPwd(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleChangePassword} disabled={savingPwd} className="rounded-xl">
              {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign out confirmation */}
      <Dialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Sign out?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">You'll need to sign back in to access your data.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSignOutOpen(false)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
