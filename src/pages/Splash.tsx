import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Shield, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Splash = () => {
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkAuth();

    setFadeIn(true);
  }, [navigate]);

  const handleGetStarted = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className={`text-center space-y-8 transition-all duration-1000 transform ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary to-accent rounded-3xl shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
              <Wallet className="w-12 h-12 md:w-16 md:h-16 text-primary-foreground" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* App Name */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            ExpenseWiz
          </h1>
          <p className="text-base md:text-lg text-muted-foreground font-medium">
            Smart Expense Management
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
          <div className="flex flex-col items-center space-y-2 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
            <TrendingUp className="w-8 h-8 text-primary" strokeWidth={2} />
            <p className="text-sm font-medium text-foreground">Track Expenses</p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
            <Sparkles className="w-8 h-8 text-accent" strokeWidth={2} />
            <p className="text-sm font-medium text-foreground">AI Insights</p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
            <Shield className="w-8 h-8 text-success" strokeWidth={2} />
            <p className="text-sm font-medium text-foreground">Secure & Private</p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-8">
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="px-12 py-6 text-lg font-semibold rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105"
          >
            Let's Go
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Splash;
