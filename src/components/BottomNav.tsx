import { NavLink as RRNavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Receipt, Plus, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutGrid },
  { title: "Transactions", url: "/expenses", icon: Receipt },
  { title: "Add", url: "/add-expense", icon: Plus, isSpecial: true },
  { title: "Analytics", url: "/budgets", icon: BarChart3 },
  { title: "Profile", url: "/profile", icon: User },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-50 md:hidden">
      <div className="flex items-end justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive =
            item.url === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.url);

          if (item.isSpecial) {
            return (
              <button
                key={item.title}
                onClick={() => navigate(item.url)}
                className="flex flex-col items-center gap-1 -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform">
                  <item.icon className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase">
                  {item.title}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.title}
              onClick={() => navigate(item.url)}
              className={cn(
                "flex flex-col items-center justify-end gap-1 min-w-[56px] py-1.5 px-2 rounded-xl transition-all",
                isActive && "bg-primary/10"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-wide uppercase",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
