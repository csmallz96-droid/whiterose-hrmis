import { useState } from "react";
import { useEmployees, useLeaveRequests, useBranches } from "@/hooks/useSupabaseData";
import { calculatePayroll } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserCircle, Wallet, CalendarDays, FileText, Plus } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

const LEAVE_TYPES = ["Annual", "Sick", "Maternity", "Paternity", "Compassionate"];

export default function SelfService() {
  const { employees, loading: empLoading } = useEmployees();
  const { branches } = useBranches();
  const { leaveRequests, addLeaveRequest } = useLeaveRequests();
  const [selectedId, setSelectedId] = useState("WR004");
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  // Leave form state
  const [leaveType, setLeaveType] = useState("Annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const currentUser = employees.find((e) => e.id === selectedId);
  const userBranch = currentUser ? branches.find((b) => b.id === currentUser.branch_id) : null;
  const userLeaves = leaveRequests.filter((l) => l.employee_id === selectedId);

  const calcDays = (): number => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  const days = calcDays();

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!startDate || !endDate || !reason) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setFormError("End date must be on or after start date.");
      return;
    }
    setSubmitting(true);
    const result = await addLeaveRequest({
      employee_id: selectedId,
      type: leaveType,
      start_date: startDate,
      end_date: endDate,
      days,
      reason,
      status: "Pending",
      applied_on: new Date().toISOString().split("T")[0],
      approved_by: null,
    });
    setSubmitting(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setFormSuccess(true);
    setShowLeaveForm(false);
    setStartDate(""); setEndDate(""); setReason(""); setLeaveType("Annual"); setFormSuccess(false);
  };

  if (empLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Loading profile…</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Self-Service</h1>
        </div>
        <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-card-foreground">Employee not found</p>
          <p className="text-xs text-muted-foreground mt-1">Please select an employee from the dropdown below.</p>
        </div>
      </div>
    );
  }

  const userPayroll = calculatePayroll(currentUser);

  const statusBadgeClass = (status: string) => {
    if (status === "Approved") return "bg-green-100 text-green-800 border-0";
    if (status === "Rejected") return "bg-red-100 text-red-800 border-0";
    return "bg-amber-100 text-amber-800 border-0";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Self-Service</h1>
          <p className="text-sm text-muted-foreground">Welcome, {currentUser.name}</p>
        </div>
        {/* Employee selector */}
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name} ({e.id})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <UserCircle className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Employee ID", value: currentUser.id },
              { label: "Job Title", value: currentUser.job_title },
              { label: "Department", value: currentUser.department },
              { label: "Branch", value: userBranch?.name ?? "—" },
              { label: "Employment Type", value: currentUser.employment_type },
              { label: "Join Date", value: formatDate(currentUser.join_date) },
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
          <div className="space-y-2 text-sm">
            {[
              { label: "Basic Salary", value: currentUser.basic_salary },
              { label: "House Allowance", value: currentUser.house_allowance },
              { label: "Transport Allowance", value: currentUser.transport_allowance },
            ].map((item) => (
              <div key={item.label} className="flex justify-between">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="text-card-foreground">{formatCurrency(item.value)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>Gross Pay</span>
              <span>{formatCurrency(userPayroll.gross)}</span>
            </div>
            <div className="mt-1 space-y-1">
              {[
                { label: "PAYE", value: userPayroll.paye },
                { label: "NSSF", value: userPayroll.nssf.employee },
                { label: "SHA (2.75%)", value: userPayroll.sha },
                { label: "AHL (1.5%)", value: userPayroll.ahl.employee },
                { label: "NITA", value: userPayroll.nita.employee },
              ].map((d) => (
                <div key={d.label} className="flex justify-between">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="text-destructive">-{formatCurrency(d.value)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-bold">
              <span className="text-card-foreground">Net Pay</span>
              <span className="text-primary">{formatCurrency(userPayroll.netPay, 2)}</span>
            </div>
          </div>
        </div>

        {/* Leave */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-card-foreground">My Leave</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{currentUser.leave_balance}</p>
                <p className="text-[10px] text-muted-foreground">days remaining</p>
              </div>
              <Button size="sm" onClick={() => setShowLeaveForm(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Apply
              </Button>
            </div>
          </div>
          {userLeaves.length > 0 ? (
            <div className="space-y-2">
              {userLeaves.map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{req.type} Leave</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(req.start_date)} — {formatDate(req.end_date)} ({req.days} days)
                    </p>
                  </div>
                  <Badge className={statusBadgeClass(req.status)}>{req.status}</Badge>
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
          <h3 className="text-sm font-semibold text-card-foreground">My Contract</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Contract Type", value: currentUser.employment_type },
            { label: "Start Date", value: formatDate(currentUser.join_date) },
            { label: "End Date", value: currentUser.contract_end ? formatDate(currentUser.contract_end) : "Open-ended" },
            { label: "Status", value: "Active" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              {item.label === "Status" ? (
                <Badge className="bg-green-100 text-green-800 border-0 mt-0.5">{item.value}</Badge>
              ) : (
                <p className="text-sm font-medium text-card-foreground">{item.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Apply for Leave Modal */}
      <Dialog open={showLeaveForm} onOpenChange={setShowLeaveForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLeaveSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
                {formError}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Leave Type</label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Start Date <span className="text-destructive">*</span></label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">End Date <span className="text-destructive">*</span></label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            {days > 0 && (
              <div className="rounded-lg bg-primary/10 px-4 py-2 text-sm text-primary font-medium">
                {days} day{days !== 1 ? "s" : ""} requested
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Reason <span className="text-destructive">*</span></label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Brief reason…" />
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button type="button" variant="outline" onClick={() => setShowLeaveForm(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting || days === 0}>
                {submitting ? "Submitting…" : "Submit Request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
