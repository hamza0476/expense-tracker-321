import { useLocation, useNavigate } from "react-router-dom";
import { Home, Receipt, Plus, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { url: "/", icon: Home, label: "Dashboard" },
  { url: "/expenses", icon: Receipt, label: "Transactions" },
  { url: "/add-expense", icon: Plus, label: "Add", isSpecial: true },
  { url: "/analytics", icon: BarChart3, label: "Analytics" },
  { url: "/profile", icon: User, label: "Profile" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-50 md:hidden">
      <div className="flex items-center justify-around px-4 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
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
                className="flex items-center justify-center -mt-6"
              >
                <div className="w-12 h-12 rounded-full bg-primary shadow-lg shadow-primary/40 ring-4 ring-card flex items-center justify-center active:scale-95 transition-transform">
                  <item.icon className="w-5 h-5 text-primary-foreground" strokeWidth={2.6} />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.url)}
              aria-label={item.label}
              className="flex items-center justify-center w-10 h-10 active:scale-90 transition-transform"
            >
              <item.icon
                className={cn(
                  "w-[19px] h-[19px] transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground/70"
                )}
                strokeWidth={isActive ? 2.4 : 1.9}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
};
