import { useState } from "react";
import { useBranches, useEmployees, useLeaveRequests } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, CheckCircle, XCircle, Clock, Plus, Download, History, User } from "lucide-react";
import StatCard from "@/components/StatCard";
import { formatDate } from "@/lib/utils";
import { downloadBrandedCSV } from "@/utils/brandedExport";
import { downloadLeaveHistoryReport } from "@/utils/employeeReports";

const LEAVE_TYPES = ["Annual", "Sick", "Maternity", "Paternity", "Compassionate"];

// ─── Apply for Leave Form ─────────────────────────────────────────────────────

interface LeaveFormProps {
  employees: ReturnType<typeof useEmployees>["employees"];
  onSubmit: (data: {
    employee_id: string;
    type: string;
    start_date: string;
    end_date: string;
    days: number;
    reason: string;
  }) => Promise<void>;
  onClose: () => void;
  prefillEmployeeId?: string;
}

function LeaveForm({ employees, onSubmit, onClose, prefillEmployeeId }: LeaveFormProps) {
  const [employeeId, setEmployeeId] = useState(prefillEmployeeId ?? "");
  const [type, setType] = useState("Annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const calcDays = (): number => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  const days = calcDays();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!employeeId || !startDate || !endDate || !reason) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setFormError("End date must be on or after start date.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ employee_id: employeeId, type, start_date: startDate, end_date: endDate, days, reason });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
          {formError}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Employee <span className="text-destructive">*</span></label>
          <Select value={employeeId} onValueChange={setEmployeeId} disabled={!!prefillEmployeeId}>
            <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name} ({e.id})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Leave Type <span className="text-destructive">*</span></label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEAVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Start Date <span className="text-destructive">*</span></label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">End Date <span className="text-destructive">*</span></label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 px-3 py-2 text-center min-w-[80px]">
            <p className="text-xl font-bold text-primary">{days}</p>
            <p className="text-[10px] text-muted-foreground">days</p>
          </div>
          <p className="text-xs text-muted-foreground">Auto-calculated from dates selected</p>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Reason <span className="text-destructive">*</span></label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Brief reason for leave…" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={submitting || days === 0}>
          {submitting ? "Submitting…" : "Submit Request"}
        </Button>
      </div>
    </form>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "Approved")
    return <Badge className="bg-green-100 text-green-800 border-0">Approved</Badge>;
  if (status === "Rejected")
    return <Badge className="bg-red-100 text-red-800 border-0">Declined</Badge>;
  return <Badge className="bg-amber-100 text-amber-800 border-0">Pending</Badge>;
}

// ─── Employee Leave History Modal ─────────────────────────────────────────────

interface EmpHistoryProps {
  employeeId: string | null;
  onClose: () => void;
  employees: ReturnType<typeof useEmployees>["employees"];
  branches: { id: string; name: string }[];
  leaveRequests: ReturnType<typeof useLeaveRequests>["leaveRequests"];
}

function EmployeeLeaveHistoryModal({ employeeId, onClose, employees, branches, leaveRequests }: EmpHistoryProps) {
  const emp = employees.find((e) => e.id === employeeId);
  const branch = branches.find((b) => b.id === emp?.branch_id);
  const history = leaveRequests
    .filter((r) => r.employee_id === employeeId)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  const totalApproved = history.filter((r) => r.status === "Approved").reduce((s, r) => s + r.days, 0);
  const totalPending = history.filter((r) => r.status === "Pending").reduce((s, r) => s + r.days, 0);

  const handleExport = () => {
    downloadBrandedCSV(
      `Leave_History_${emp?.name ?? employeeId}`,
      ["Employee ID", "Name", "Branch", "Leave Type", "Start Date", "End Date", "Days", "Reason", "Status", "Applied On"],
      history.map((r) => [
        r.employee_id,
        emp?.name ?? "",
        branch?.name ?? "",
        r.type,
        r.start_date,
        r.end_date,
        String(r.days),
        r.reason,
        r.status,
        r.applied_on ?? "",
      ])
    );
  };

  const handlePdfExport = () => {
    if (!emp) return;
    downloadLeaveHistoryReport(emp, branch?.name ?? "-", history);
  };

  return (
    <Dialog open={!!employeeId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Leave History — {emp?.name ?? employeeId}
            {branch && <span className="text-sm font-normal text-muted-foreground">({branch.name})</span>}
          </DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-blue-50 p-3 text-center">
            <p className="text-xl font-bold text-blue-700">{emp?.leave_balance ?? 0}</p>
            <p className="text-xs text-blue-600">Annual Balance</p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-xl font-bold text-green-700">{totalApproved}</p>
            <p className="text-xs text-green-600">Days Approved</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-3 text-center">
            <p className="text-xl font-bold text-amber-700">{totalPending}</p>
            <p className="text-xs text-amber-600">Days Pending</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={handlePdfExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>

        {history.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">No leave requests found for this employee.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Period</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Days</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Reason</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Applied</th>
                </tr>
              </thead>
              <tbody>
                {history.map((req) => (
                  <tr key={req.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 font-medium text-card-foreground">{req.type}</td>
                    <td className="px-3 py-2 text-card-foreground whitespace-nowrap">
                      {formatDate(req.start_date)} — {formatDate(req.end_date)}
                    </td>
                    <td className="px-3 py-2 text-center text-card-foreground">{req.days}</td>
                    <td className="px-3 py-2 text-muted-foreground max-w-[160px] truncate">{req.reason}</td>
                    <td className="px-3 py-2 text-center"><StatusBadge status={req.status} /></td>
                    <td className="px-3 py-2 text-muted-foreground">{req.applied_on ? formatDate(req.applied_on) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Leave History Tab ─────────────────────────────────────────────────────────

interface LeaveHistoryTabProps {
  leaveRequests: ReturnType<typeof useLeaveRequests>["leaveRequests"];
  employees: ReturnType<typeof useEmployees>["employees"];
  branches: { id: string; name: string }[];
}

function LeaveHistoryTab({ leaveRequests, employees, branches }: LeaveHistoryTabProps) {
  const [empSearch, setEmpSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const getBranchId = (employeeId: string) =>
    employees.find((e) => e.id === employeeId)?.branch_id ?? "";

  const sorted = [...leaveRequests].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  const filtered = sorted.filter((req) => {
    const emp = employees.find((e) => e.id === req.employee_id);
    const matchEmp = !empSearch || emp?.name.toLowerCase().includes(empSearch.toLowerCase()) || req.employee_id.toLowerCase().includes(empSearch.toLowerCase());
    const matchBranch = branchFilter === "all" || getBranchId(req.employee_id) === branchFilter;
    const matchType = typeFilter === "all" || req.type === typeFilter;
    const matchStatus = statusFilter === "all" || req.status === statusFilter;
    const matchFrom = !dateFrom || req.start_date >= dateFrom;
    const matchTo = !dateTo || req.end_date <= dateTo;
    return matchEmp && matchBranch && matchType && matchStatus && matchFrom && matchTo;
  });

  const totalDays = filtered.filter((r) => r.status === "Approved").reduce((s, r) => s + r.days, 0);

  const handleExport = () => {
    downloadBrandedCSV(
      "Leave_History_All",
      ["Employee ID", "Employee Name", "Branch", "Leave Type", "Start Date", "End Date", "Days", "Reason", "Status", "Applied On"],
      filtered.map((req) => {
        const emp = employees.find((e) => e.id === req.employee_id);
        const branch = branches.find((b) => b.id === getBranchId(req.employee_id));
        return [
          req.employee_id,
          emp?.name ?? "",
          branch?.name ?? "",
          req.type,
          req.start_date,
          req.end_date,
          String(req.days),
          req.reason,
          req.status,
          req.applied_on ?? "",
        ];
      })
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Search Employee</label>
          <Input
            className="w-[180px] h-9"
            placeholder="Name or ID…"
            value={empSearch}
            onChange={(e) => setEmpSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Branch</label>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="All Branches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Leave Type</label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {LEAVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">From</label>
          <Input type="date" className="h-9 w-[145px]" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">To</label>
          <Input type="date" className="h-9 w-[145px]" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <Button size="sm" variant="outline" onClick={handleExport} className="h-9 mt-auto">
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/40 rounded-lg px-4 py-2">
        <span><strong className="text-card-foreground">{filtered.length}</strong> records</span>
        <span>·</span>
        <span><strong className="text-card-foreground">{totalDays}</strong> approved days</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">No leave records match the selected filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Branch</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Period</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Days</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reason</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Applied</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => {
                const emp = employees.find((e) => e.id === req.employee_id);
                const branch = branches.find((b) => b.id === getBranchId(req.employee_id));
                return (
                  <tr key={req.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-card-foreground">{emp?.name ?? req.employee_id}</p>
                      <p className="text-xs text-muted-foreground">{req.employee_id}</p>
                    </td>
                    <td className="px-4 py-3 text-card-foreground">{branch?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-card-foreground">{req.type}</td>
                    <td className="px-4 py-3 text-card-foreground whitespace-nowrap">
                      {formatDate(req.start_date)} — {formatDate(req.end_date)}
                    </td>
                    <td className="px-4 py-3 text-center text-card-foreground">{req.days}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{req.reason}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={req.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{req.applied_on ? formatDate(req.applied_on) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Leave Page ──────────────────────────────────────────────────────────

export default function Leave() {
  const { branches } = useBranches();
  const { employees, refetch: refetchEmployees } = useEmployees();
  const { leaveRequests, loading, error, updateStatus, addLeaveRequest } = useLeaveRequests();
  const { employee: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"requests" | "history">("requests");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [empHistoryId, setEmpHistoryId] = useState<string | null>(null);

  const pending = leaveRequests.filter((r) => r.status === "Pending");
  const approved = leaveRequests.filter((r) => r.status === "Approved");
  const rejected = leaveRequests.filter((r) => r.status === "Rejected");

  const getBranchId = (employeeId: string) =>
    employees.find((e) => e.id === employeeId)?.branch_id ?? "";

  const filtered = leaveRequests.filter((req) => {
    const matchStatus = statusFilter === "all" || req.status === statusFilter;
    const branchId = getBranchId(req.employee_id);
    const matchBranch = branchFilter === "all" || branchId === branchFilter;
    return matchStatus && matchBranch;
  });

  const handleApply = async (data: {
    employee_id: string; type: string; start_date: string;
    end_date: string; days: number; reason: string;
  }) => {
    const result = await addLeaveRequest({
      ...data, status: "Pending",
      applied_on: new Date().toISOString().split("T")[0],
      approved_by: null,
    });
    if (result.error) throw new Error(result.error);
    setShowForm(false);
  };

  const handleApprove = async (id: string) => {
    const req = leaveRequests.find((r) => r.id === id);
    await updateStatus(id, "Approved", currentUser?.id ?? "WR001");
    if (req && req.type === "Annual") {
      const emp = employees.find((e) => e.id === req.employee_id);
      if (emp) {
        const newBalance = Math.max(0, emp.leave_balance - req.days);
        await supabase.from("employees").update({ leave_balance: newBalance }).eq("id", emp.id);
        refetchEmployees();
      }
    }
  };

  const handleReject = async (id: string) => {
    await updateStatus(id, "Rejected", currentUser?.id ?? "WR001");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
          <p className="text-sm text-muted-foreground">Track and manage employee leave requests</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Apply for Leave
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Clock} title="Pending" value={pending.length} subtitle="Awaiting approval" />
        <StatCard icon={CheckCircle} title="Approved" value={approved.length} subtitle="This month" />
        <StatCard icon={XCircle} title="Declined" value={rejected.length} subtitle="This month" />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0">
          {(["requests", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-card-foreground"
              }`}
            >
              {tab === "requests" ? (
                <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Leave Requests</span>
              ) : (
                <span className="flex items-center gap-1.5"><History className="h-3.5 w-3.5" /> Leave History</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "requests" && (
        <>
          {/* Pending Approvals */}
          {pending.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-card-foreground">Pending Approvals</h3>
              <div className="space-y-3">
                {pending.map((req) => {
                  const emp = employees.find((e) => e.id === req.employee_id);
                  const branch = branches.find((b) => b.id === emp?.branch_id);
                  return (
                    <div key={req.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4 flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 shrink-0">
                          <CalendarDays className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <button
                            className="font-medium text-card-foreground hover:text-primary hover:underline transition-colors"
                            onClick={() => setEmpHistoryId(req.employee_id)}
                          >
                            {emp?.name ?? req.employee_id}
                          </button>
                          <p className="text-xs text-muted-foreground">
                            {branch?.name} · {req.type} Leave · {req.days} days · {formatDate(req.start_date)} → {formatDate(req.end_date)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground italic">"{req.reason}"</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm" variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleReject(req.id)}
                        >
                          Decline
                        </Button>
                        <Button size="sm" onClick={() => handleApprove(req.id)}>Approve</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Declined</SelectItem>
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Branches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">{error}</div>
          )}

          {loading ? (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-pulse">
              <div className="h-10 bg-muted/50 border-b border-border" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-3 border-b border-border/50">
                  <div className="h-4 flex-1 rounded bg-muted" />
                  <div className="h-4 w-20 rounded bg-muted" />
                  <div className="h-4 w-32 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
              <p className="text-sm font-medium text-card-foreground">No leave requests found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or submit a new request.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Branch</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Period</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Days</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reason</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((req) => {
                    const emp = employees.find((e) => e.id === req.employee_id);
                    const branch = branches.find((b) => b.id === emp?.branch_id);
                    return (
                      <tr key={req.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <button
                            className="font-medium text-card-foreground hover:text-primary hover:underline transition-colors"
                            onClick={() => setEmpHistoryId(req.employee_id)}
                          >
                            {emp?.name ?? req.employee_id}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-card-foreground">{branch?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-card-foreground">{req.type}</td>
                        <td className="px-4 py-3 text-card-foreground whitespace-nowrap">
                          {formatDate(req.start_date)} — {formatDate(req.end_date)}
                        </td>
                        <td className="px-4 py-3 text-center text-card-foreground">{req.days}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{req.reason}</td>
                        <td className="px-4 py-3 text-center"><StatusBadge status={req.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Leave Balances */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-card-foreground">Leave Balances</h3>
            {employees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No employee data available.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-3 hover:bg-muted transition-colors text-left"
                    onClick={() => setEmpHistoryId(emp.id)}
                  >
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.job_title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{emp.leave_balance}</p>
                      <p className="text-[10px] text-muted-foreground">days left</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "history" && (
        <LeaveHistoryTab
          leaveRequests={leaveRequests}
          employees={employees}
          branches={branches}
        />
      )}

      {/* Apply for Leave Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          <LeaveForm
            employees={employees}
            onSubmit={handleApply}
            onClose={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Employee Leave History Modal */}
      <EmployeeLeaveHistoryModal
        employeeId={empHistoryId}
        onClose={() => setEmpHistoryId(null)}
        employees={employees}
        branches={branches}
        leaveRequests={leaveRequests}
      />
    </div>
  );
}
