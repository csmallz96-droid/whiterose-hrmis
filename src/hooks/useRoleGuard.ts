import { useAuth } from "@/context/AuthContext";

export const useRoleGuard = () => {
  const { employee } = useAuth();
  const role = employee?.role ?? "employee";

  const isHR = ["hr", "admin"].includes(role);
  const isManager = ["hr", "admin", "manager"].includes(role);
  const isEmployee = role === "employee";

  return { isHR, isManager, isEmployee, role };
};
