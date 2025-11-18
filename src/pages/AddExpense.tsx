import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/categories";
import { CalendarIcon, Sparkles, Receipt } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { pushNotificationService } from "@/services/pushNotifications";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { TodayTransactions } from "@/components/TodayTransactions";
import { Separator } from "@/components/ui/separator";

const AddExpense = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    date: new Date(),
    paymentMethod: "",
    vendor: "",
    notes: ""
  });

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
          setDefaultCurrency(profile.default_currency);
        }
      }
    };
    fetchUserCurrency();
  }, []);

  const handleAICategorize = async () => {
    if (!formData.description && !formData.vendor) {
      toast.error("Please add a description or vendor first");
      return;
    }

    setAiLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-categorize-expense`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: formData.description,
            amount: formData.amount,
            vendor: formData.vendor,
          }),
        }
      );

      if (!response.ok) throw new Error('AI categorization failed');

      const { category } = await response.json();
      setFormData({ ...formData, category });
      toast.success(`AI suggested: ${category}`);
    } catch (error: any) {
      toast.error(error.message || "AI categorization failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("expenses").insert([
        {
          user_id: user.id,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          date: format(formData.date, "yyyy-MM-dd"),
          payment_method: formData.paymentMethod,
          vendor: formData.vendor,
          notes: formData.notes,
          currency: defaultCurrency,
          original_amount: parseFloat(formData.amount),
          exchange_rate: 1.0
        }
      ]);

      if (error) throw error;

      toast.success("Expense added successfully!");
      
      // Check budget alerts after adding expense
      pushNotificationService.checkBudgetAlerts(formData.category);
      
      navigate("/expenses");
    } catch (error: any) {
      toast.error(error.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptScan = (data: any) => {
    setFormData({
      ...formData,
      amount: data.amount || formData.amount,
      category: data.category || formData.category,
      vendor: data.vendor || formData.vendor,
      description: data.description || formData.description,
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="text-center md:text-left">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Add New Expense
        </h2>
        <p className="text-muted-foreground mt-2">Quick and easy expense tracking with AI assistance</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <Card className="shadow-xl border-border/40 bg-gradient-to-br from-card via-card to-card/90">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Receipt className="h-6 w-6 text-primary" />
                Expense Details
              </CardTitle>
              <CardDescription>Fill in the information below or scan a receipt</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Receipt Scanner Button */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <ReceiptScanner onScanComplete={handleReceiptScan} />
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-base font-semibold">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      className="h-12 text-lg font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="category" className="text-base font-semibold">Category *</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAICategorize}
                        disabled={aiLoading}
                        className="h-8 gap-1 text-xs hover:bg-primary/10"
                      >
                        <Sparkles className="h-3 w-3" />
                        {aiLoading ? "Suggesting..." : "AI Suggest"}
                      </Button>
                    </div>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      required
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-base font-semibold">Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-12 justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.date, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => date && setFormData({ ...formData, date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod" className="text-base font-semibold">Payment Method</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="vendor" className="text-base font-semibold">Vendor/Store</Label>
                    <Input
                      id="vendor"
                      placeholder="e.g., Walmart, Amazon"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                    <Input
                      id="description"
                      placeholder="Brief description of the expense"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes" className="text-base font-semibold">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional details..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="min-h-[100px] resize-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                    disabled={loading}
                  >
                    {loading ? "Adding..." : "Add Expense"}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => navigate("/expenses")}
                    className="h-12 px-8"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Today's Transactions Sidebar */}
        <div className="lg:col-span-1">
          <TodayTransactions />
        </div>
      </div>
    </div>
  );
};

export default AddExpense;
