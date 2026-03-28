import { useEffect, useMemo, useState } from "react";
import { Users, Wallet, CalendarDays, Building2, AlertTriangle } from "lucide-react";
import StatCard from "@/components/StatCard";
import { calculatePayroll } from "@/data/mockData";
import { useBranches, useEmployees, useLeaveRequests } from "@/hooks/useSupabaseData";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse">
      <div className="h-4 w-1/2 rounded bg-muted mb-3" />
      <div className="h-8 w-1/3 rounded bg-muted mb-2" />
      <div className="h-3 w-2/3 rounded bg-muted" />
    </div>
  );
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const { branches, loading: branchesLoading, error: branchesError } = useBranches();
  const { employees, loading: employeesLoading, error: employeesError } = useEmployees();
  const { leaveRequests, loading: leavesLoading, error: leavesError } = useLeaveRequests();
  const [expiringContracts, setExpiringContracts] = useState<{ employee_id: string; end_date: string }[]>([]);

  const loading = branchesLoading || employeesLoading || leavesLoading;
  const error = branchesError || employeesError || leavesError;

  useEffect(() => {
    supabase
      .from("contracts")
      .select("employee_id, end_date")
      .eq("status", "active")
      .not("end_date", "is", null)
      .then(({ data }) => {
        const expiring = (data ?? []).filter((contract) => {
          const days = daysUntil(contract.end_date);
          return days !== null && days <= 60 && days > 0;
        });
        setExpiringContracts(expiring);
      });
  }, []);

  const totalPayroll = useMemo(() => employees.reduce((sum, employee) => sum + calculatePayroll(employee).gross, 0), [employees]);
  const pendingLeaves = leaveRequests.filter((request) => request.status === "Pending").length;
  const today = new Date().toISOString().slice(0, 10);
  const employeesOnLeaveToday = leaveRequests
    .filter((request) => request.status === "Approved" && request.start_date <= today && request.end_date >= today)
    .map((request) => employees.find((employee) => employee.id === request.employee_id))
    .filter(Boolean);
  const leaveLiability = employees.reduce((sum, employee) => {
    const dailyRate = employee.basic_salary / 30;
    return sum + (employee.leave_balance * dailyRate);
  }, 0);

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
        <p className="text-sm text-muted-foreground">Whiterose Venyou Enterprises - Multi-Branch Overview</p>
      </div>

      {expiringContracts.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {expiringContracts.length} employee contract{expiringContracts.length > 1 ? "s" : ""} expiring within 60 days - review in <a href="/contracts" className="underline">Contracts</a>
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} title="Total Headcount" value={employees.length} subtitle={`Across ${branches.length} locations`} />
          <StatCard icon={Building2} title="Total Branches" value={branches.length} subtitle="Active locations" />
          <StatCard icon={CalendarDays} title="Pending Leave" value={pendingLeaves} subtitle="Awaiting approval" />
          <StatCard icon={Wallet} title="Monthly Payroll" value={formatCurrency(totalPayroll)} subtitle="Gross payroll cost" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">Who Is On Leave Today</h3>
          {employeesOnLeaveToday.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees are on approved leave today.</p>
          ) : (
            <div className="space-y-3">
              {employeesOnLeaveToday.map((employee) => (
                <div key={employee?.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{employee?.name}</p>
                    <p className="text-xs text-muted-foreground">{employee?.job_title} | {branches.find((branch) => branch.id === employee?.branch_id)?.name ?? "-"}</p>
                  </div>
                  <Badge variant="outline">On Leave</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">Leave Liability</h3>
          <p className="text-3xl font-bold text-primary">{formatCurrency(leaveLiability)}</p>
          <p className="text-sm text-muted-foreground mt-2">Estimated accrued unused leave days multiplied by daily salary.</p>
          <div className="mt-4 space-y-3">
            {employees.slice(0, 4).map((employee) => (
              <div key={employee.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">{employee.leave_balance} unused days</p>
                </div>
                <span className="text-sm font-semibold text-card-foreground">{formatCurrency((employee.basic_salary / 30) * employee.leave_balance)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Branch Deployment</h2>
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="rounded-xl border border-border bg-card p-4 shadow-sm animate-pulse">
                <div className="h-4 w-3/4 rounded bg-muted mb-3" />
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(3)].map((_, cell) => <div key={cell} className="h-8 rounded bg-muted" />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {branches.map((branch) => {
              const branchEmployees = employees.filter((employee) => employee.branch_id === branch.id);
              const branchPayroll = branchEmployees.reduce((sum, employee) => sum + calculatePayroll(employee).gross, 0);
              const branchOnLeave = employeesOnLeaveToday.filter((employee) => employee?.branch_id === branch.id).length;

              return (
                <div key={branch.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold text-card-foreground truncate">
                        {branch.name}
                        {branch.sub_location && <span className="font-normal text-muted-foreground"> | {branch.sub_location}</span>}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs ml-1 shrink-0">{branch.region}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-card-foreground">{branchEmployees.length}</p>
                      <p className="text-[10px] text-muted-foreground">Staff</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-card-foreground">{branchOnLeave}</p>
                      <p className="text-[10px] text-muted-foreground">On Leave</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">{branchPayroll > 0 ? `${(branchPayroll / 1000).toFixed(0)}K` : "-"}</p>
                      <p className="text-[10px] text-muted-foreground">Payroll</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">Pending Leave Requests</h3>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, index) => <div key={index} className="h-14 rounded-lg bg-muted animate-pulse" />)}</div>
          ) : leaveRequests.filter((request) => request.status === "Pending").length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending requests.</p>
          ) : (
            <div className="space-y-3">
              {leaveRequests.filter((request) => request.status === "Pending").map((request) => {
                const employee = employees.find((item) => item.id === request.employee_id);
                return (
                  <div key={request.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{employee?.name ?? request.employee_id}</p>
                      <p className="text-xs text-muted-foreground">{request.type} Leave | {request.days} days | {formatDate(request.start_date)}</p>
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
            <div className="space-y-3">{[...Array(4)].map((_, index) => <div key={index} className="h-10 rounded-lg bg-muted animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Active Employees", value: employees.filter((employee) => employee.status === "Active").length },
                { label: "Permanent Staff", value: employees.filter((employee) => employee.employment_type === "Permanent").length },
                { label: "Contract Staff", value: employees.filter((employee) => employee.employment_type === "Contract").length },
                { label: "Casual Staff", value: employees.filter((employee) => employee.employment_type === "Casual").length },
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
