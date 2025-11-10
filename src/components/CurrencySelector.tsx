import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES } from "@/lib/currencies";
import { toast } from "sonner";

export const CurrencySelector = () => {
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserCurrency = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("default_currency")
          .eq("user_id", user.id)
          .single();
        if (profile?.default_currency) {
          setCurrency(profile.default_currency);
        }
      }
    };
    fetchUserCurrency();
  }, []);

  const handleCurrencyChange = async (newCurrency: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ default_currency: newCurrency })
        .eq("user_id", user.id);

      if (error) throw error;

      setCurrency(newCurrency);
      toast.success("Currency updated successfully!");
      
      // Reload page to update all currency displays
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to update currency");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      value={currency}
      onValueChange={handleCurrencyChange}
      disabled={loading}
    >
      <SelectTrigger className="w-[140px] bg-card border-border/50">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((curr) => (
          <SelectItem key={curr.code} value={curr.code}>
            <span className="flex items-center gap-2">
              <span>{curr.flag}</span>
              <span>{curr.code}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
