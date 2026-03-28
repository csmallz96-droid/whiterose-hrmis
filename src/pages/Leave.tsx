import { useEmployees, useLeaveRequests } from "@/hooks/useSupabaseData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, CheckCircle, XCircle, Clock } from "lucide-react";
import StatCard from "@/components/StatCard";

export default function Leave() {
  const { employees } = useEmployees();
  const { leaveRequests, loading, updateStatus } = useLeaveRequests();

  const pending = leaveRequests.filter((r) => r.status === "Pending");
  const approved = leaveRequests.filter((r) => r.status === "Approved");
  const rejected = leaveRequests.filter((r) => r.status === "Rejected");

  const statusBadge = (status: string) => {
    if (status === "Approved") return <Badge className="bg-primary/10 text-primary border-0">Approved</Badge>;
    if (status === "Rejected") return <Badge className="bg-destructive/10 text-destructive border-0">Rejected</Badge>;
    return <Badge variant="outline" className="border-primary/30 text-primary">Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
        <p className="text-sm text-muted-foreground">Track and manage employee leave requests</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Clock} title="Pending" value={pending.length} subtitle="Awaiting approval" />
        <StatCard icon={CheckCircle} title="Approved" value={approved.length} subtitle="This month" />
        <StatCard icon={XCircle} title="Rejected" value={rejected.length} subtitle="This month" />
      </div>

      {/* Pending Approvals */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">Pending Approvals</h3>
          <div className="space-y-3">
            {pending.map((req) => {
              const emp = employees.find((e) => e.id === req.employee_id);
              return (
                <div key={req.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">{emp?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.type} Leave · {req.days} days · {req.start_date} → {req.end_date}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground italic">"{req.reason}"</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => updateStatus(req.id, "Rejected", "WR002")}>
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => updateStatus(req.id, "Approved", "WR002")}>
                      Approve
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Requests Table */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading leave requests…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Period</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Days</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reason</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((req) => {
                const emp = employees.find((e) => e.id === req.employee_id);
                return (
                  <tr key={req.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-card-foreground">{emp?.name}</td>
                    <td className="px-4 py-3 text-card-foreground">{req.type}</td>
                    <td className="px-4 py-3 text-card-foreground">{req.start_date} — {req.end_date}</td>
                    <td className="px-4 py-3 text-center text-card-foreground">{req.days}</td>
                    <td className="px-4 py-3 text-muted-foreground">{req.reason}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(req.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee Leave Balances */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-card-foreground">Leave Balances</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {employees.slice(0, 6).map((emp) => (
            <div key={emp.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <p className="text-sm font-medium text-card-foreground">{emp.name}</p>
                <p className="text-xs text-muted-foreground">{emp.job_title}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{emp.leave_balance}</p>
                <p className="text-[10px] text-muted-foreground">days left</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
