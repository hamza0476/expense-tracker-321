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
  Tag,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  trigger: React.ReactNode;
}

const PRIMARY = [
  { to: "/analytics", label: "Analytics", desc: "Insights & trends", Icon: BarChart3, tone: "bg-primary/15 text-primary" },
  { to: "/expenses", label: "Transactions", desc: "All your spending", Icon: Receipt, tone: "bg-primary/15 text-primary" },
  { to: "/recurring-expenses", label: "Recurring", desc: "Subscriptions & bills", Icon: RefreshCw, tone: "bg-accent/15 text-accent" },
  { to: "/savings-goals", label: "Savings Goals", desc: "Reach your targets", Icon: Target, tone: "bg-success/15 text-success" },
  { to: "/categories", label: "Categories", desc: "Manage all categories", Icon: Tag, tone: "bg-primary/15 text-primary" },
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
        className="w-[82%] max-w-sm p-0 border-r-0 bg-card flex flex-col"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        {/* Hero - compact on mobile */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-accent to-primary p-4 pt-5 md:p-5 md:pt-7 text-primary-foreground safe-top shrink-0">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -right-2 bottom-0 w-20 h-20 rounded-full bg-white/10 blur-xl" />
          <div className="relative flex items-center gap-2.5 md:gap-3">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-md">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
              <p className="text-base md:text-lg font-bold tracking-tight leading-none">ExpenseWiz</p>
              <p className="text-[10px] md:text-xs opacity-85 mt-0.5 md:mt-1">Your finance hub</p>
            </div>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto thin-scrollbar overscroll-contain">
          <div className="p-3 md:p-4 space-y-1.5 md:space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
              Manage
            </p>
            {PRIMARY.map(({ to, label, desc, Icon, tone }) => (
              <button
                key={to}
                onClick={() => go(to)}
                className="w-full flex items-center gap-2.5 md:gap-3 p-2 md:p-3 rounded-xl md:rounded-2xl bg-card border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-[0.98] shadow-sm min-h-0"
              >
                <div className={cn("w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0", tone)}>
                  <Icon className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.2} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-xs md:text-sm leading-tight">{label}</p>
                  <p className="text-[10px] md:text-[11px] text-muted-foreground mt-0.5 truncate">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}

            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 pt-2 md:pt-3">
              More
            </p>
            {SECONDARY.map(({ to, label, Icon }) => (
              <button
                key={to}
                onClick={() => go(to)}
                className="w-full flex items-center gap-2.5 md:gap-3 p-2 md:p-2.5 rounded-lg md:rounded-xl hover:bg-muted/70 transition-colors min-h-0"
              >
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                </div>
                <span className="font-medium text-xs md:text-sm flex-1 text-left">{label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
