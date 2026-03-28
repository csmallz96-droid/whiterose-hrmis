import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Payroll from "@/pages/Payroll";
import Payslips from "@/pages/Payslips";
import Leave from "@/pages/Leave";
import Contracts from "@/pages/Contracts";
import Performance from "@/pages/Performance";
import SelfService from "@/pages/SelfService";
import Reports from "@/pages/Reports";
import Onboarding from "@/pages/Onboarding";
import Expenses from "@/pages/Expenses";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Wrapper that applies ProtectedRoute then renders the AppLayout <Outlet>
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/payslips" element={<Payslips />} />
              <Route path="/leave" element={<Leave />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/self-service" element={<SelfService />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
