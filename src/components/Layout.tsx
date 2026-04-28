import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { LogoMenuSheet } from "@/components/LogoMenuSheet";
import { pushNotificationService } from "@/services/pushNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string }>({});
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/splash");
      } else {
        setUser(session.user);
        pushNotificationService.initialize();
        fetchProfile(session.user.id);
      }
      setAuthLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/splash");
      } else {
        setUser(session.user);
        pushNotificationService.initialize();
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", userId)
        .single();
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };


  // Premium loading skeleton
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Skeleton Header */}
        <header className="h-14 border-b border-border/50 bg-card/95 backdrop-blur-lg sticky top-0 z-40 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-24 h-5 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        </header>
        {/* Skeleton Body */}
        <main className="flex-1 p-4 space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </main>
        {/* Skeleton Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border/50 flex items-center justify-around px-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="w-10 h-10 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header - Premium Glass Effect */}
      <header className="h-12 md:h-14 border-b border-border/30 bg-card/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-3 md:px-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] safe-top">
        <LogoMenuSheet
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl px-1 py-0.5 -ml-1 hover:bg-primary/10 active:scale-95 transition-all min-h-0 min-w-0"
              aria-label="Open menu"
            >
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-primary to-accent rounded-lg md:rounded-xl flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground md:w-[18px] md:h-[18px]">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
              </div>
              <h1 className="text-sm md:text-base font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight whitespace-nowrap">
                ExpenseWiz
              </h1>
            </button>
          }
        />

        <div className="flex items-center gap-2 shrink-0">
          {/* Ask AI - Gradient floating button */}
          <Button
            type="button"
            onClick={() => navigate("/ai-assistant")}
            className="h-8 md:h-9 px-3 rounded-xl gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40 active:scale-95 transition-all border-0"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
            Ask AI
          </Button>

          {/* Profile Avatar - top right */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/profile")}
            aria-label="Profile"
            className="hover:bg-primary/10 transition-all duration-200 rounded-full p-1 md:p-1.5 min-h-0 min-w-0 h-auto w-auto"
          >
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-primary to-accent rounded-full opacity-70" />
              <Avatar className="h-7 w-7 md:h-8 md:w-8 relative border-2 border-background">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="text-[10px] md:text-xs bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                  {profile.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-6 overflow-auto bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container max-w-7xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Layout;
