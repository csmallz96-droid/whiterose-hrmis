import { Users, Wallet, CalendarDays, AlertTriangle, Building2, TrendingUp } from "lucide-react";
import StatCard from "@/components/StatCard";
import { calculatePayroll } from "@/data/mockData";
import { useBranches, useEmployees, useLeaveRequests } from "@/hooks/useSupabaseData";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { branches, loading: branchesLoading } = useBranches();
  const { employees, loading: employeesLoading } = useEmployees();
  const { leaveRequests, loading: leavesLoading } = useLeaveRequests();

  const loading = branchesLoading || employeesLoading || leavesLoading;

  const totalPayroll = employees.reduce((sum, emp) => sum + calculatePayroll(emp).gross, 0);
  const pendingLeaves = leaveRequests.filter((l) => l.status === "Pending").length;
  const onLeave = employees.filter((e) => e.status === "On Leave").length;
  const contractExpiring = employees.filter((e) => {
    if (!e.contract_end) return false;
    const diff = new Date(e.contract_end).getTime() - Date.now();
    return diff > 0 && diff < 60 * 24 * 60 * 60 * 1000;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Whiterose Venyou Enterprises — Multi-Branch Overview</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} title="Total Employees" value={employees.length} subtitle={`Across ${branches.length} locations`} />
        <StatCard icon={Wallet} title="Monthly Payroll" value={`KES ${(totalPayroll / 1000).toFixed(0)}K`} subtitle="Gross payroll cost" />
        <StatCard icon={CalendarDays} title="On Leave" value={onLeave} subtitle={`${pendingLeaves} pending requests`} />
        <StatCard icon={AlertTriangle} title="Contract Alerts" value={contractExpiring} subtitle="Expiring within 60 days" />
      </div>

      {/* Branch Grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Branch Deployment</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {branches.map((branch) => {
            const branchEmps = employees.filter((e) => e.branch_id === branch.id);
            const branchPayroll = branchEmps.reduce((s, e) => s + calculatePayroll(e).gross, 0);
            const branchOnLeave = branchEmps.filter((e) => e.status === "On Leave").length;

            return (
              <div key={branch.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-card-foreground">
                      {branch.name}
                      {branch.sub_location && <span className="font-normal text-muted-foreground"> — {branch.sub_location}</span>}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{branch.region}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-card-foreground">{branch.staff_count}</p>
                    <p className="text-[10px] text-muted-foreground">Staff</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-card-foreground">{branchOnLeave}</p>
                    <p className="text-[10px] text-muted-foreground">On Leave</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{branchPayroll > 0 ? `${(branchPayroll / 1000).toFixed(0)}K` : "—"}</p>
                    <p className="text-[10px] text-muted-foreground">Payroll</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">Pending Leave Requests</h3>
          <div className="space-y-3">
            {leaveRequests.filter((l) => l.status === "Pending").map((req) => {
              const emp = employees.find((e) => e.id === req.employee_id);
              return (
                <div key={req.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{emp?.name}</p>
                    <p className="text-xs text-muted-foreground">{req.type} Leave · {req.days} days · {req.start_date}</p>
                  </div>
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">Pending</Badge>
                </div>
              );
            })}
            {leaveRequests.filter((l) => l.status === "Pending").length === 0 && (
              <p className="text-sm text-muted-foreground">No pending requests</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">Quick Stats</h3>
          <div className="space-y-3">
            {[
              { label: "Active Employees", value: employees.filter((e) => e.status === "Active").length },
              { label: "Permanent Staff", value: employees.filter((e) => e.employment_type === "Permanent").length },
              { label: "Contract Staff", value: employees.filter((e) => e.employment_type === "Contract").length },
              { label: "Total Branches", value: branches.length },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <span className="text-sm font-bold text-card-foreground">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
