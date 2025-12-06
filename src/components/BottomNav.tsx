import { NavLink } from "@/components/NavLink";
import { Home, PlusCircle, ListTodo, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Add", url: "/add-expense", icon: PlusCircle, isSpecial: true },
  { title: "Tasks", url: "/daily-tasks", icon: ListTodo },
  { title: "Profile", url: "/profile", icon: User },
];

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 shadow-2xl z-50 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[64px] h-14 rounded-xl transition-all duration-200",
              item.isSpecial && "relative -mt-8"
            )}
            activeClassName="text-primary"
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full transition-all duration-200",
                    item.isSpecial
                      ? "w-14 h-14 bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30"
                      : "w-10 h-10",
                    isActive && !item.isSpecial && "bg-primary/10",
                  )}
                >
                  <item.icon
                    className={cn(
                      "transition-all duration-200",
                      item.isSpecial ? "w-7 h-7 text-primary-foreground" : "w-6 h-6",
                      isActive && !item.isSpecial && "text-primary"
                    )}
                    strokeWidth={2.5}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground",
                    item.isSpecial && "hidden"
                  )}
                >
                  {item.title}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
