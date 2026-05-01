import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Splash from "./pages/Splash";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import AddExpense from "./pages/AddExpense";
import Expenses from "./pages/Expenses";
import Budgets from "./pages/Budgets";
import Profile from "./pages/Profile";
import RecurringExpenses from "./pages/RecurringExpenses";
import AddRecurringExpense from "./pages/AddRecurringExpense";
import EditRecurringExpense from "./pages/EditRecurringExpense";
import CreateBudget from "./pages/CreateBudget";
import AIAssistant from "./pages/AIAssistant";
import DataExport from "./pages/DataExport";
import SavingsGoals from "./pages/SavingsGoals";
import DailyTasks from "./pages/DailyTasks";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Categories from "./pages/Categories";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 24 * 60 * 60 * 1000, // 24h — keep cached data for offline use
      retry: 1,
      refetchOnWindowFocus: false,
      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

const persister =
  typeof window !== "undefined"
    ? createSyncStoragePersister({
        storage: window.localStorage,
        key: "expensewiz-query-cache",
        throttleTime: 1000,
      })
    : undefined;

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister: persister!,
      maxAge: 24 * 60 * 60 * 1000,
      buster: "v1",
    }}
  >
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/splash" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/add-expense" element={<Layout><AddExpense /></Layout>} />
          <Route path="/expenses" element={<Layout><Expenses /></Layout>} />
          <Route path="/budgets" element={<Layout><Budgets /></Layout>} />
          <Route path="/budgets/new" element={<Layout><CreateBudget /></Layout>} />
          <Route path="/recurring-expenses" element={<Layout><RecurringExpenses /></Layout>} />
          <Route path="/recurring-expenses/new" element={<Layout><AddRecurringExpense /></Layout>} />
          <Route path="/recurring-expenses/edit/:id" element={<Layout><EditRecurringExpense /></Layout>} />
          <Route path="/ai-assistant" element={<Layout><AIAssistant /></Layout>} />
          <Route path="/savings-goals" element={<Layout><SavingsGoals /></Layout>} />
          <Route path="/daily-tasks" element={<Layout><DailyTasks /></Layout>} />
          <Route path="/export" element={<Layout><DataExport /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </PersistQueryClientProvider>
);

export default App;
