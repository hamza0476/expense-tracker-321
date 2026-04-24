import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Splash from "./pages/Splash";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import AddExpense from "./pages/AddExpense";
import Expenses from "./pages/Expenses";
import Budgets from "./pages/Budgets";
import Profile from "./pages/Profile";
import RecurringExpenses from "./pages/RecurringExpenses";
import CreateBudget from "./pages/CreateBudget";
import AIAssistant from "./pages/AIAssistant";
import DataExport from "./pages/DataExport";
import SavingsGoals from "./pages/SavingsGoals";
import DailyTasks from "./pages/DailyTasks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
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
          <Route path="/ai-assistant" element={<Layout><AIAssistant /></Layout>} />
          <Route path="/savings-goals" element={<Layout><SavingsGoals /></Layout>} />
          <Route path="/daily-tasks" element={<Layout><DailyTasks /></Layout>} />
          <Route path="/export" element={<Layout><DataExport /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
