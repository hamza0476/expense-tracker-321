import { Home, Wallet, Target, Receipt, RefreshCw, ListTodo, User, PlusCircle, TrendingUp, Bot, Download, Tag } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Add Expense", url: "/add-expense", icon: PlusCircle },
  { title: "Budgets", url: "/budgets", icon: Wallet },
  { title: "Savings Goals", url: "/savings-goals", icon: Target },
  { title: "Expenses", url: "/expenses", icon: Receipt },
  { title: "Recurring", url: "/recurring-expenses", icon: RefreshCw },
  { title: "Daily Tasks", url: "/daily-tasks", icon: ListTodo },
];

const aiMenuItems = [
  { title: "AI Assistant", url: "/ai-assistant", icon: Bot },
  { title: "Export Data", url: "/export", icon: Download },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent>
        <div className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            {open && (
              <div>
                <h2 className="text-lg font-bold text-sidebar-foreground">ExpenseWiz</h2>
                <p className="text-xs text-sidebar-foreground/60">Smart Finance</p>
              </div>
            )}
          </div>
        </div>
        
        <Separator className="bg-sidebar-border" />
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs uppercase tracking-wider px-4 py-2">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-sidebar-accent/80 transition-all duration-200">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg"
                      activeClassName="bg-sidebar-accent text-primary font-semibold shadow-lg shadow-primary/10"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {open && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="bg-sidebar-border my-2" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs uppercase tracking-wider px-4 py-2">
            AI Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-sidebar-accent/80 transition-all duration-200">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg"
                      activeClassName="bg-sidebar-accent text-primary font-semibold shadow-lg shadow-primary/10"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {open && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <Separator className="bg-sidebar-border mb-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-sidebar-accent/80 transition-all duration-200">
              <NavLink
                to="/profile"
                className="flex items-center gap-3 px-4 py-3 rounded-lg"
                activeClassName="bg-sidebar-accent text-primary font-semibold shadow-lg shadow-primary/10"
              >
                <User className="h-5 w-5 flex-shrink-0" />
                {open && <span className="truncate">Profile</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}