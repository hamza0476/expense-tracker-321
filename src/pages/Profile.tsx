import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Camera, Loader2, User, Check, Shield, Calendar, Palette,
  Link2, Mail, Sun, Moon, Monitor, ChevronRight, Sparkles,
  TrendingUp, Target, Receipt
} from "lucide-react";
import { useTheme } from "next-themes";

interface Profile {
  full_name: string;
  avatar_url?: string;
  theme?: string;
}

const AnimatedCounter = ({ end, duration = 1200 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (end === 0) return;
    let start = 0;
    const step = Math.max(1, Math.floor(end / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{count}</span>;
};

const Profile = () => {
  const { setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [email, setEmail] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [nameError, setNameError] = useState("");
  const [profile, setProfile] = useState<Profile>({ full_name: "", avatar_url: "", theme: "system" });
  const [stats, setStats] = useState({ expenses: 0, budgets: 0, goals: 0, memberSince: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      setStats(s => ({ ...s, memberSince: user.created_at || "" }));

      const [profileRes, expenseRes, budgetRes, goalRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("expenses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("budgets").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("savings_goals").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      if (profileRes.data) {
        setProfile({
          full_name: profileRes.data.full_name || "",
          avatar_url: profileRes.data.avatar_url || "",
          theme: profileRes.data.theme || "system",
        });
        if (profileRes.data.theme) setTheme(profileRes.data.theme);
      }
      setStats(s => ({
        ...s,
        expenses: expenseRes.count || 0,
        budgets: budgetRes.count || 0,
        goals: goalRes.count || 0,
      }));
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const processFile = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("File size must be less than 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}-${Date.now()}.${fileExt}`;
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split("/").pop();
        if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);
      }
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
      if (updateError) throw updateError;
      setProfile(p => ({ ...p, avatar_url: publicUrl }));
      toast.success("Avatar updated!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  }, [profile.avatar_url]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.full_name.trim()) { setNameError("Name cannot be empty"); return; }
    if (profile.full_name.trim().length > 100) { setNameError("Name must be less than 100 characters"); return; }
    setNameError("");
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("profiles").update({
        full_name: profile.full_name.trim(),
        avatar_url: profile.avatar_url,
        theme: profile.theme,
      }).eq("user_id", user.id);
      if (error) throw error;
      if (profile.theme) setTheme(profile.theme);
      setSaved(true);
      toast.success("Profile updated!");
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const completeness = [
    !!profile.full_name,
    !!profile.avatar_url,
    !!email,
    !!profile.theme && profile.theme !== "system",
  ].filter(Boolean).length * 25;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 p-4 animate-fade-in">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="flex flex-col items-center -mt-12 space-y-3">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-6 space-y-5 animate-fade-in">
      {/* Cover + Avatar */}
      <div className="relative">
        <div className="h-36 rounded-b-3xl bg-gradient-to-br from-primary via-accent to-primary animate-gradient overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary)/0.4),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.3),transparent_50%)]" />
        </div>
        <div className="flex flex-col items-center -mt-14 relative z-10">
          <div
            className={`relative group cursor-pointer ${dragOver ? "scale-105" : ""} transition-transform duration-200`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="p-[3px] rounded-full bg-gradient-to-br from-primary via-accent to-primary shadow-lg">
              <Avatar className="h-28 w-28 border-[3px] border-background">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} className="object-cover transition-opacity duration-300" />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {profile.full_name.charAt(0)?.toUpperCase() || email.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/40 transition-colors duration-200">
              <Camera className="h-6 w-6 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
            {uploading && (
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-foreground/50">
                <Loader2 className="h-7 w-7 animate-spin text-primary-foreground" />
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
          </div>
          <h2 className="mt-3 text-xl font-bold">{profile.full_name || "Your Name"}</h2>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </div>

      {/* Profile Completeness */}
      <Card className="mx-4 border-border/40 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Profile Completeness</span>
            </div>
            <span className="text-sm font-bold text-primary">{completeness}%</span>
          </div>
          <Progress value={completeness} className="h-2" />
          {completeness < 100 && (
            <p className="text-xs text-muted-foreground mt-2">
              {!profile.full_name && "Add your name • "}
              {!profile.avatar_url && "Upload a photo • "}
              {profile.theme === "system" && "Choose a theme"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="mx-4 border-border/40 shadow-md">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={profile.full_name}
                onChange={(e) => {
                  setProfile({ ...profile, full_name: e.target.value });
                  if (nameError) setNameError("");
                }}
                placeholder="Full Name"
                className={`pl-10 h-11 ${nameError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input value={email} disabled placeholder="Email" className="pl-10 h-11 bg-muted/50" />
            </div>

            {/* Theme */}
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setProfile({ ...profile, theme: value })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                      profile.theme === value
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${profile.theme === value ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-medium ${profile.theme === value ? "text-primary" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <Button
              type="submit"
              disabled={saving || saved}
              className={`w-full h-12 text-base font-semibold rounded-xl transition-all duration-300 ${
                saved ? "bg-success hover:bg-success" : ""
              }`}
            >
              {saving ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</>
              ) : saved ? (
                <><Check className="mr-2 h-5 w-5" /> Saved!</>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 px-4">
        {[
          { icon: Receipt, label: "Expenses", value: stats.expenses, color: "text-primary" },
          { icon: Target, label: "Budgets", value: stats.budgets, color: "text-accent" },
          { icon: TrendingUp, label: "Goals", value: stats.goals, color: "text-success" },
          { icon: Calendar, label: "Member Since", value: 0, color: "text-warning",
            display: stats.memberSince
              ? new Date(stats.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })
              : "—" },
        ].map(({ icon: Icon, label, value, color, display }, i) => (
          <Card
            key={label}
            className="border-border/40 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-default"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
              <div className={`p-2 rounded-xl bg-muted/60`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-lg font-bold">
                {display ?? <AnimatedCounter end={value} />}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Account Info */}
      <Card className="mx-4 border-border/40 shadow-md">
        <CardContent className="p-0">
          {[
            { icon: Shield, label: "Account Status", value: "Active", valueColor: "text-success" },
            { icon: Palette, label: "Current Theme", value: profile.theme || "system", valueColor: "text-primary capitalize" },
          ].map(({ icon: Icon, label, value, valueColor }, i) => (
            <div key={label} className={`flex items-center justify-between p-4 ${i > 0 ? "border-t border-border/40" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/60">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm">{label}</span>
              </div>
              <span className={`text-sm font-semibold ${valueColor}`}>{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
