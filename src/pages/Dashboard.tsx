import { Users, Wallet, CalendarDays, Building2 } from "lucide-react";
import StatCard from "@/components/StatCard";
import { calculatePayroll } from "@/data/mockData";
import { useBranches, useEmployees, useLeaveRequests } from "@/hooks/useSupabaseData";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse">
      <div className="h-4 w-1/2 rounded bg-muted mb-3" />
      <div className="h-8 w-1/3 rounded bg-muted mb-2" />
      <div className="h-3 w-2/3 rounded bg-muted" />
    </div>
  );
}

export default function Dashboard() {
  const { branches, loading: branchesLoading, error: branchesError } = useBranches();
  const { employees, loading: employeesLoading, error: employeesError } = useEmployees();
  const { leaveRequests, loading: leavesLoading, error: leavesError } = useLeaveRequests();

  const loading = branchesLoading || employeesLoading || leavesLoading;
  const error = branchesError || employeesError || leavesError;

  const totalPayroll = employees.reduce((sum, emp) => sum + calculatePayroll(emp).gross, 0);
  const pendingLeaves = leaveRequests.filter((l) => l.status === "Pending").length;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load dashboard data</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Whiterose Venyou Enterprises — Multi-Branch Overview</p>
      </div>

      {/* Top KPI Stats */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} title="Total Headcount" value={employees.length} subtitle={`Across ${branches.length} locations`} />
          <StatCard icon={Building2} title="Total Branches" value={branches.length} subtitle="Active locations" />
          <StatCard icon={CalendarDays} title="Pending Leave" value={pendingLeaves} subtitle="Awaiting approval" />
          <StatCard icon={Wallet} title="Monthly Payroll" value={`KES ${(totalPayroll / 1000).toFixed(0)}K`} subtitle="Gross payroll cost" />
        </div>
      )}

      {/* Branch Grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Branch Deployment</h2>
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm animate-pulse">
                <div className="h-4 w-3/4 rounded bg-muted mb-3" />
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(3)].map((_, j) => <div key={j} className="h-8 rounded bg-muted" />)}
                </div>
              </div>
            ))}
          </div>
        ) : branches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No branches found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {branches.map((branch) => {
              const branchEmps = employees.filter((e) => e.branch_id === branch.id);
              const branchPayroll = branchEmps.reduce((s, e) => s + calculatePayroll(e).gross, 0);
              const branchOnLeave = branchEmps.filter((e) => e.status === "On Leave").length;

              return (
                <div key={branch.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold text-card-foreground truncate">
                        {branch.name}
                        {branch.sub_location && (
                          <span className="font-normal text-muted-foreground"> — {branch.sub_location}</span>
                        )}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs ml-1 shrink-0">{branch.region}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-card-foreground">{branchEmps.length}</p>
                      <p className="text-[10px] text-muted-foreground">Staff</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-card-foreground">{branchOnLeave}</p>
                      <p className="text-[10px] text-muted-foreground">On Leave</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">
                        {branchPayroll > 0 ? `${(branchPayroll / 1000).toFixed(0)}K` : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Payroll</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Approvals + Quick Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">Pending Leave Requests</h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : leaveRequests.filter((l) => l.status === "Pending").length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending requests.</p>
          ) : (
            <div className="space-y-3">
              {leaveRequests.filter((l) => l.status === "Pending").map((req) => {
                const emp = employees.find((e) => e.id === req.employee_id);
                return (
                  <div key={req.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{emp?.name ?? req.employee_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.type} Leave · {req.days} days · {formatDate(req.start_date)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs border-amber-400/50 text-amber-600">Pending</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">Quick Stats</h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Active Employees", value: employees.filter((e) => e.status === "Active").length },
                { label: "Permanent Staff", value: employees.filter((e) => e.employment_type === "Permanent").length },
                { label: "Contract Staff", value: employees.filter((e) => e.employment_type === "Contract").length },
                { label: "Casual Staff", value: employees.filter((e) => e.employment_type === "Casual").length },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className="text-sm font-bold text-card-foreground">{stat.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
