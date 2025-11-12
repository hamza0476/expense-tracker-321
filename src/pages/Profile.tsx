import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, User } from "lucide-react";
import { useTheme } from "next-themes";

interface Profile {
  full_name: string;
  avatar_url?: string;
  theme?: string;
}

const Profile = () => {
  const { setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    avatar_url: "",
    theme: "system",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setEmail(user.email || "");
        
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          avatar_url: data.avatar_url || "",
          theme: data.theme || "system",
        });
        if (data.theme) {
          setTheme(data.theme);
        }
      }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split("/").pop();
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError, data } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success("Avatar updated successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          theme: profile.theme,
        })
        .eq("user_id", user.id);

      if (!error && profile.theme) {
        setTheme(profile.theme);
      }

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Profile
          </span>
        </h2>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Header Card */}
      <Card className="border-border/40 shadow-lg overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-primary via-accent to-primary" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col items-center -mt-16 space-y-4">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-card shadow-xl">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {profile.full_name.charAt(0) || email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 cursor-pointer flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </Label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-2xl font-bold">{profile.full_name || "User"}</h3>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card className="border-border/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Enter your name"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="mt-1.5 bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="theme">Theme Preference</Label>
                <Select
                  value={profile.theme}
                  onValueChange={(value) => setProfile({ ...profile, theme: value })}
                >
                  <SelectTrigger id="theme" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">☀️ Light Mode</SelectItem>
                    <SelectItem value="dark">🌙 Dark Mode</SelectItem>
                    <SelectItem value="system">💻 System Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="avatar_url">Avatar URL (Optional)</Label>
                <Input
                  id="avatar_url"
                  type="url"
                  value={profile.avatar_url}
                  onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="mt-1.5"
                />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full md:w-auto">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/40 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6 text-center space-y-2">
            <div className="text-3xl">📅</div>
            <p className="text-sm text-muted-foreground">Member Since</p>
            <p className="text-lg font-bold text-primary">
              {new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6 text-center space-y-2">
            <div className="text-3xl">✅</div>
            <p className="text-sm text-muted-foreground">Account Status</p>
            <p className="text-lg font-bold text-success">Active</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6 text-center space-y-2">
            <div className="text-3xl">{profile.theme === "light" ? "☀️" : profile.theme === "dark" ? "🌙" : "💻"}</div>
            <p className="text-sm text-muted-foreground">Current Theme</p>
            <p className="text-lg font-bold text-accent capitalize">{profile.theme}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
