import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";

interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export default function RoleGuard({ children, allowedRoles, redirectTo = "/self-service" }: Props) {
  const { role, loading } = useAuth();

  useEffect(() => {
    if (!loading && !allowedRoles.includes(role)) {
      toast.error("Access restricted. Please contact HR.");
    }
  }, [role, loading, allowedRoles]);

  if (loading) return null;
  if (!allowedRoles.includes(role)) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}
