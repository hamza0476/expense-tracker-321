import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { FloatingAIChat } from "@/components/FloatingAIChat";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "@/components/AppSidebar";
import { pushNotificationService } from "@/services/pushNotifications";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string }>({});
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
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

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/splash");
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
      <header className="h-14 border-b border-border/30 bg-card/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] safe-top">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </div>
          <h1 className="text-base font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
            ExpenseWiz
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          
          {/* Profile Avatar - Premium Ring */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/profile")}
            className="hover:bg-primary/10 hover:text-primary transition-all duration-200 gap-2 rounded-full p-1.5"
          >
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-primary to-accent rounded-full opacity-70" />
              <Avatar className="h-7 w-7 relative border-2 border-background">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                  {profile.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </Button>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogoutDialog(true)}
            className="hover:bg-destructive/10 hover:text-destructive transition-all duration-200 text-xs font-medium rounded-full p-2"
          >
            <LogOut className="w-4 h-4" />
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
      <FloatingAIChat />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-2xl border-border/50 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90 rounded-xl">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Layout;
