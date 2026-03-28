import { useEmployees, useLeaveRequests } from "@/hooks/useSupabaseData";
import { useBranches } from "@/hooks/useSupabaseData";
import { calculatePayroll } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Wallet, CalendarDays, FileText } from "lucide-react";

// Simulating logged-in employee view (Amina Hassan - WR004)
const CURRENT_USER_ID = "WR004";

export default function SelfService() {
  const { employees } = useEmployees();
  const { branches } = useBranches();
  const { leaveRequests } = useLeaveRequests();

  const currentUser = employees.find((e) => e.id === CURRENT_USER_ID);
  const userBranch = currentUser ? branches.find((b) => b.id === currentUser.branch_id) : null;
  const userLeaves = leaveRequests.filter((l) => l.employee_id === CURRENT_USER_ID);

  const fmt = (n: number) => `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Loading profile…</p>
      </div>
    );
  }

  const userPayroll = calculatePayroll(currentUser);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Employee Self-Service</h1>
        <p className="text-sm text-muted-foreground">Welcome, {currentUser.name}</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <UserCircle className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Employee ID", value: currentUser.id },
              { label: "Job Title", value: currentUser.job_title },
              { label: "Department", value: currentUser.department },
              { label: "Branch", value: userBranch?.name ?? "—" },
              { label: "Employment Type", value: currentUser.employment_type },
              { label: "Join Date", value: currentUser.join_date },
              { label: "Email", value: currentUser.email },
              { label: "Phone", value: currentUser.phone },
              { label: "KRA PIN", value: currentUser.kra_pin },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium text-card-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Latest Payslip */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-card-foreground">Latest Payslip — March 2026</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Basic Salary</span>
              <span className="text-card-foreground">{fmt(currentUser.basic_salary)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">House Allowance</span>
              <span className="text-card-foreground">{fmt(currentUser.house_allowance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transport Allowance</span>
              <span className="text-card-foreground">{fmt(currentUser.transport_allowance)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
              <span>Gross Pay</span>
              <span>{fmt(userPayroll.gross)}</span>
            </div>
            <div className="mt-2 space-y-1">
              {[
                { label: "PAYE", value: userPayroll.paye },
                { label: "NSSF", value: userPayroll.nssf.employee },
                { label: "SHA", value: userPayroll.sha },
                { label: "AHL", value: userPayroll.ahl.employee },
                { label: "NITA", value: userPayroll.nita.employee },
              ].map((d) => (
                <div key={d.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="text-destructive">-{fmt(d.value)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
              <span className="text-card-foreground">Net Pay</span>
              <span className="text-primary">{fmt(userPayroll.netPay)}</span>
            </div>
          </div>
        </div>

        {/* Leave */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-card-foreground">Leave</h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{currentUser.leave_balance}</p>
              <p className="text-[10px] text-muted-foreground">days remaining</p>
            </div>
          </div>
          {userLeaves.length > 0 ? (
            <div className="space-y-2">
              {userLeaves.map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{req.type} Leave</p>
                    <p className="text-xs text-muted-foreground">{req.start_date} — {req.end_date} ({req.days} days)</p>
                  </div>
                  <Badge
                    className={
                      req.status === "Approved"
                        ? "bg-primary/10 text-primary border-0"
                        : req.status === "Rejected"
                        ? "bg-destructive/10 text-destructive border-0"
                        : "border-primary/30 text-primary"
                    }
                    variant={req.status === "Pending" ? "outline" : "default"}
                  >
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No leave requests found.</p>
          )}
        </div>
      </div>

      {/* Contract Info */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Contract Details</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Contract Type</p>
            <p className="text-sm font-medium text-card-foreground">{currentUser.employment_type}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Start Date</p>
            <p className="text-sm font-medium text-card-foreground">{currentUser.join_date}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">End Date</p>
            <p className="text-sm font-medium text-card-foreground">{currentUser.contract_end || "Open-ended"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge className="bg-primary/10 text-primary border-0 mt-0.5">Active</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
