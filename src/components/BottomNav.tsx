import { useLocation, useNavigate } from "react-router-dom";
import { Home, Receipt, Plus, Wallet, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { url: "/", icon: Home, label: "Home" },
  { url: "/expenses", icon: Receipt, label: "Transactions" },
  { url: "/add-expense", icon: Plus, label: "Add", isSpecial: true },
  { url: "/budgets", icon: Wallet, label: "Budget" },
  { url: "/recurring-expenses", icon: Repeat, label: "Recurring" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-50 md:hidden">
      <div className="flex items-center justify-around px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive =
            item.url === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.url);

          if (item.isSpecial) {
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.url)}
                aria-label={item.label}
                className="flex items-center justify-center -mt-7"
              >
                <div className="w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/40 ring-4 ring-card flex items-center justify-center active:scale-95 transition-transform">
                  <item.icon className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.url)}
              aria-label={item.label}
              className={cn(
                "flex items-center justify-center w-11 h-11 rounded-2xl transition-all active:scale-95",
                isActive
                  ? "bg-primary/10 ring-2 ring-primary/60"
                  : "hover:bg-muted/60"
              )}
            >
              <item.icon
                className={cn(
                  "w-[22px] h-[22px] transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
};
