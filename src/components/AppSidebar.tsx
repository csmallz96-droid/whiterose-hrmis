import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Calculator, FileText, CalendarDays,
  FileSignature, Target, UserCircle, BarChart3, ClipboardList,
  Receipt, Settings, X, LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type NavItem = { to: string; icon: React.ElementType; label: string };

const ALL_NAV: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/employees", icon: Users, label: "Employees" },
  { to: "/payroll", icon: Calculator, label: "Payroll" },
  { to: "/payslips", icon: FileText, label: "Payslips" },
  { to: "/leave", icon: CalendarDays, label: "Leave" },
  { to: "/contracts", icon: FileSignature, label: "Contracts" },
  { to: "/performance", icon: Target, label: "Performance" },
  { to: "/self-service", icon: UserCircle, label: "Self-Service" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/onboarding", icon: ClipboardList, label: "Onboarding" },
  { to: "/expenses", icon: Receipt, label: "Expenses" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const MANAGER_PATHS = ["/", "/employees", "/leave", "/performance", "/self-service", "/expenses"];
const EMPLOYEE_NAV: NavItem[] = [
  { to: "/self-service", icon: UserCircle, label: "My Portal" },
];

function getNavItems(role: string): NavItem[] {
  if (role === "admin" || role === "hr") return ALL_NAV;
  if (role === "manager") return ALL_NAV.filter((n) => MANAGER_PATHS.includes(n.to));
  return EMPLOYEE_NAV;
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function getRoleBadge(role: string) {
  const map: Record<string, { label: string; color: string }> = {
    admin: { label: "Admin", color: "bg-amber-400/20 text-amber-200" },
    hr: { label: "HR Officer", color: "bg-blue-400/20 text-blue-200" },
    manager: { label: "Manager", color: "bg-purple-400/20 text-purple-200" },
    employee: { label: "Employee", color: "bg-sidebar-accent/40 text-sidebar-foreground/70" },
  };
  return map[role] ?? map.employee;
}

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AppSidebar({ open, onClose }: AppSidebarProps) {
  const location = useLocation();
  const { employee, role, signOut } = useAuth();
  const navItems = getNavItems(role);
  const roleBadge = getRoleBadge(role);
  const isEmployee = role === "employee";

  const sidebarContent = (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground overflow-y-auto">
      {/* Brand */}
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="Whiterose" className="h-12 w-auto rounded-md object-contain" />
          <span className="text-[11px] font-semibold tracking-widest text-sidebar-foreground/60 uppercase">HRMIS</span>
        </div>
        <button className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {navItems.map((item) => {
          const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Employee info + branch (shown for employee role) */}
      {isEmployee && employee && (
        <div className="px-4 py-2 border-t border-sidebar-border/50">
          <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-wider mb-1">My Info</p>
          <p className="text-xs text-sidebar-foreground/70">{employee.job_title}</p>
          <p className="text-xs text-sidebar-foreground/50">{employee.branch_id?.toUpperCase()}</p>
        </div>
      )}

      {/* User footer */}
      <div className="shrink-0 border-t border-sidebar-border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-primary shrink-0">
            {employee ? getInitials(employee.name) : "??"}
          </div>
          <div className="leading-tight min-w-0 flex-1">
            <p className="text-xs font-semibold text-sidebar-primary-foreground truncate">
              {employee?.name ?? "Loading…"}
            </p>
            <p className="text-[11px] text-sidebar-foreground/50 truncate">{employee?.job_title ?? ""}</p>
            <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-0.5 font-medium ${roleBadge.color}`}>
              {roleBadge.label}
            </span>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64">
        {sidebarContent}
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true" />
          <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">{sidebarContent}</div>
        </>
      )}
    </>
  );
}
