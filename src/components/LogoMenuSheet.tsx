import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Receipt,
  RefreshCw,
  Target,
  ListTodo,
  Bot,
  Download,
  User,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  trigger: React.ReactNode;
}

const PRIMARY = [
  { to: "/expenses", label: "Transactions", desc: "All your spending", Icon: Receipt, tone: "bg-primary/15 text-primary" },
  { to: "/recurring-expenses", label: "Recurring", desc: "Subscriptions & bills", Icon: RefreshCw, tone: "bg-accent/15 text-accent" },
  { to: "/savings-goals", label: "Savings Goals", desc: "Reach your targets", Icon: Target, tone: "bg-success/15 text-success" },
  { to: "/daily-tasks", label: "Daily Tasks", desc: "Your money to-dos", Icon: ListTodo, tone: "bg-warning/15 text-warning" },
];

const SECONDARY = [
  { to: "/ai-assistant", label: "AI Assistant", Icon: Bot },
  { to: "/export", label: "Export Data", Icon: Download },
  { to: "/profile", label: "Profile", Icon: User },
];

export const LogoMenuSheet = ({ trigger }: Props) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="left"
        className="w-[86%] max-w-sm p-0 border-r-0 bg-card"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-accent to-primary p-5 pt-7 text-primary-foreground safe-top">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -right-2 bottom-0 w-20 h-20 rounded-full bg-white/10 blur-xl" />
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight leading-none">ExpenseWiz</p>
              <p className="text-xs opacity-85 mt-1">Your finance hub</p>
            </div>
          </div>
        </div>

        {/* Primary list */}
        <div className="p-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
            Manage
          </p>
          {PRIMARY.map(({ to, label, desc, Icon, tone }) => (
            <button
              key={to}
              onClick={() => go(to)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-[0.98] shadow-sm"
            >
              <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", tone)}>
                <Icon className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-sm leading-tight">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}

          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 pt-3">
            More
          </p>
          {SECONDARY.map(({ to, label, Icon }) => (
            <button
              key={to}
              onClick={() => go(to)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/70 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium text-sm flex-1 text-left">{label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
