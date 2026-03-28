import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wallet,
  CalendarDays,
  UserCircle,
  X,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/employees", icon: Users, label: "Employees" },
  { to: "/payroll", icon: Wallet, label: "Payroll" },
  { to: "/leave", icon: CalendarDays, label: "Leave" },
  { to: "/self-service", icon: UserCircle, label: "Self-Service" },
];

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AppSidebar({ open, onClose }: AppSidebarProps) {
  const location = useLocation();

  const content = (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="White Rose Drycleaners"
            className="h-12 w-auto rounded-md object-contain"
          />
          <span className="text-[11px] font-semibold tracking-widest text-sidebar-foreground/60 uppercase">
            HRMIS
          </span>
        </div>
        {/* Close button — only on mobile overlay */}
        <button
          className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
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

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-primary shrink-0">
            GW
          </div>
          <div className="leading-tight">
            <p className="text-xs font-medium text-sidebar-primary-foreground">Grace Wanjiku</p>
            <p className="text-[11px] text-sidebar-foreground/50">HR Officer</p>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64">
        {content}
      </div>

      {/* Mobile: overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
            {content}
          </div>
        </>
      )}
    </>
  );
}
