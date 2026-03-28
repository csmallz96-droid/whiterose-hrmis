import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleGuard from "@/components/RoleGuard";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Payroll from "@/pages/Payroll";
import PayrollRunDetail from "@/pages/PayrollRunDetail";
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
import { useAuth } from "@/context/AuthContext";

const queryClient = new QueryClient();

const HR_ADMIN = ["hr", "admin"];
const HR_ADMIN_MANAGER = ["hr", "admin", "manager"];
const ALL_ROLES = ["hr", "admin", "manager", "employee"];

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  );
}

function HomeRoute() {
  const { role, loading } = useAuth();

  if (loading) return null;
  if (role === "employee") return <Navigate to="/self-service" replace />;

  return (
    <RoleGuard allowedRoles={HR_ADMIN_MANAGER}>
      <Dashboard />
    </RoleGuard>
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
              <Route index element={<HomeRoute />} />
              <Route path="/employees" element={<RoleGuard allowedRoles={HR_ADMIN}><Employees /></RoleGuard>} />
              <Route path="/payroll" element={<RoleGuard allowedRoles={HR_ADMIN}><Payroll /></RoleGuard>} />
              <Route path="/payroll/history/:payrollRunId" element={<RoleGuard allowedRoles={HR_ADMIN}><PayrollRunDetail /></RoleGuard>} />
              <Route path="/payslips" element={<RoleGuard allowedRoles={HR_ADMIN}><Payslips /></RoleGuard>} />
              <Route path="/leave" element={<RoleGuard allowedRoles={HR_ADMIN_MANAGER}><Leave /></RoleGuard>} />
              <Route path="/contracts" element={<RoleGuard allowedRoles={HR_ADMIN}><Contracts /></RoleGuard>} />
              <Route path="/performance" element={<RoleGuard allowedRoles={HR_ADMIN_MANAGER}><Performance /></RoleGuard>} />
              <Route path="/reports" element={<RoleGuard allowedRoles={HR_ADMIN}><Reports /></RoleGuard>} />
              <Route path="/onboarding" element={<RoleGuard allowedRoles={HR_ADMIN}><Onboarding /></RoleGuard>} />
              <Route path="/expenses" element={<RoleGuard allowedRoles={HR_ADMIN_MANAGER}><Expenses /></RoleGuard>} />
              <Route path="/settings" element={<RoleGuard allowedRoles={HR_ADMIN}><Settings /></RoleGuard>} />
              {/* Employee: self-service only */}
              <Route path="/self-service" element={<RoleGuard allowedRoles={ALL_ROLES}><SelfService /></RoleGuard>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
