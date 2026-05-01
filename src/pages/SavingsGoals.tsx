import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Target, Trash2, TrendingUp, Award } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useGroupedCategories } from "@/hooks/useCategories";
import { getCurrencySymbol } from "@/lib/currencies";

interface SavingsGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  category?: string;
  description?: string;
}

const SavingsGoals = () => {
  const groupedCategories = useGroupedCategories();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [formData, setFormData] = useState({
    title: "",
    target_amount: "",
    current_amount: "",
    deadline: undefined as Date | undefined,
    category: "",
    description: "",
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's currency preference
      const { data: profile } = await supabase
        .from("profiles")
        .select("default_currency")
        .eq("user_id", user.id)
        .single();

      if (profile?.default_currency) {
        setCurrencySymbol(getCurrencySymbol(profile.default_currency));
      }

      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to load savings goals");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("savings_goals").insert({
        user_id: user.id,
        title: formData.title,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount || "0"),
        deadline: formData.deadline ? format(formData.deadline, "yyyy-MM-dd") : null,
        category: formData.category || null,
        description: formData.description || null,
      });

      if (error) throw error;

      toast.success("Savings goal created!");
      setIsOpen(false);
      setFormData({
        title: "",
        target_amount: "",
        current_amount: "",
        deadline: undefined,
        category: "",
        description: "",
      });
      fetchGoals();
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("Failed to create savings goal");
    }
  };

  const handleUpdateAmount = async (goalId: string, newAmount: string) => {
    try {
      const { error } = await supabase
        .from("savings_goals")
        .update({ current_amount: parseFloat(newAmount) })
        .eq("id", goalId);

      if (error) throw error;

      toast.success("Progress updated!");
      fetchGoals();
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error("Failed to update progress");
    }
  };

  const handleDelete = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from("savings_goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;

      toast.success("Savings goal deleted");
      fetchGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete savings goal");
    }
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Savings Goals
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Track your financial targets</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/90">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border-border/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Create Savings Goal
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Emergency Fund"
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_amount">Target ({currencySymbol})</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    step="0.01"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    placeholder="5000.00"
                    required
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="current_amount">Saved ({currencySymbol})</Label>
                  <Input
                    id="current_amount"
                    type="number"
                    step="0.01"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                    placeholder="0.00"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div>
                <Label>Category (Optional)</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[60vh]">
                    {groupedCategories.map(([group, items]) => (
                      <SelectGroup key={group}>
                        <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {group}
                        </SelectLabel>
                        {items.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.emoji} {cat.value}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Deadline (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal rounded-xl", !formData.deadline && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.deadline ? format(formData.deadline, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.deadline}
                      onSelect={(date) => setFormData({ ...formData, deadline: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Save for a rainy day..."
                  rows={3}
                  className="rounded-xl"
                />
              </div>
              <Button type="submit" className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-lg">
                Create Goal
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-border/40 bg-gradient-to-br from-primary/10 to-primary/5 shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground font-medium">Total Saved</p>
              </div>
              <p className="text-xl font-bold text-primary tabular-nums">
                {currencySymbol}{totalSaved.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-gradient-to-br from-accent/10 to-accent/5 shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-accent" />
                <p className="text-xs text-muted-foreground font-medium">Progress</p>
              </div>
              <p className="text-xl font-bold text-accent tabular-nums">
                {overallProgress.toFixed(0)}%
              </p>
              <Progress value={Math.min(overallProgress, 100)} className="h-1.5 mt-1" />
            </CardContent>
          </Card>
        </div>
      )}

      {goals.length === 0 ? (
        <Card className="border-border/40 shadow-lg rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
              <Target className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No savings goals yet</h3>
            <p className="text-muted-foreground text-center mb-4 text-sm">
              Start setting financial targets to track your progress
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const progress = (goal.current_amount / goal.target_amount) * 100;
            const isComplete = progress >= 100;

            return (
              <Card key={goal.id} className="border-border/40 shadow-lg relative overflow-hidden rounded-2xl">
                {isComplete && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success via-accent to-success" />
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        isComplete ? "bg-success/20" : "bg-primary/20"
                      )}>
                        {isComplete ? (
                          <Award className="h-4 w-4 text-success" />
                        ) : (
                          <Target className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <span className="truncate">{goal.title}</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(goal.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  {goal.category && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full w-fit text-muted-foreground">
                      {goal.category}
                    </span>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {goal.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{goal.description}</p>
                  )}
                  <div>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-2xl font-bold text-primary tabular-nums">
                        {currencySymbol}{goal.current_amount.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        of {currencySymbol}{goal.target_amount.toFixed(2)}
                      </span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2.5 rounded-full" />
                    <p className={cn(
                      "text-xs font-medium mt-1.5",
                      isComplete ? "text-success" : progress > 75 ? "text-warning" : "text-muted-foreground"
                    )}>
                      {progress.toFixed(1)}% {isComplete ? "Complete! 🎉" : "saved"}
                    </p>
                  </div>
                  {goal.deadline && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {format(new Date(goal.deadline), "MMM dd, yyyy")}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={`Update (${currencySymbol})`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUpdateAmount(goal.id, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                      className="flex-1 rounded-xl text-sm"
                    />
                    <Button
                      size="sm"
                      className="rounded-xl"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value) {
                          handleUpdateAmount(goal.id, input.value);
                          input.value = "";
                        }
                      }}
                    >
                      Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavingsGoals;
