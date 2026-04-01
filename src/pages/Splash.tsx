import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Splash = () => {
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkAuth();
    setFadeIn(true);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      
      <div className={`text-center space-y-8 transition-all duration-1000 transform relative z-10 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Premium Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse scale-150" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-primary via-primary to-accent rounded-3xl shadow-2xl shadow-primary/30 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
            </div>
          </div>
        </div>

        {/* App Name */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent tracking-tight">
            ExpenseWiz
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium tracking-wide">
            Smart Expense Management
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mt-6">
          <div className="flex flex-col items-center space-y-2 p-3 rounded-2xl bg-card/60 backdrop-blur-md border border-border/30 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" strokeWidth={2} />
            </div>
            <p className="text-xs font-medium text-foreground">Track</p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-3 rounded-2xl bg-card/60 backdrop-blur-md border border-border/30 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" strokeWidth={2} />
            </div>
            <p className="text-xs font-medium text-foreground">AI</p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-3 rounded-2xl bg-card/60 backdrop-blur-md border border-border/30 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-success" strokeWidth={2} />
            </div>
            <p className="text-xs font-medium text-foreground">Secure</p>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-6">
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="px-12 py-6 text-base font-semibold rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-primary to-primary/90"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Splash;
