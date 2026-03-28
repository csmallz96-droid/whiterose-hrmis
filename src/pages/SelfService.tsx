import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBranches } from "@/hooks/useSupabaseData";
import { calculatePayroll } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, CalendarDays, FileText, Receipt, UserCircle, BookOpen, Printer, Download, Plus } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { printPayslip, downloadPayslipPDF } from "@/utils/downloadPayslipPDF";

const LEAVE_TYPES = ["Annual", "Sick", "Maternity", "Paternity", "Compassionate"];

const TABS = [
  { id: "payslips", label: "My Payslips", icon: Wallet },
  { id: "leave", label: "My Leave", icon: CalendarDays },
  { id: "expenses", label: "My Expenses", icon: Receipt },
  { id: "performance", label: "My Performance", icon: FileText },
  { id: "profile", label: "My Profile", icon: UserCircle },
  { id: "documents", label: "My Documents", icon: BookOpen },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── My Payslips Tab ──────────────────────────────────────────────────────────
function PayslipsTab() {
  const { employee } = useAuth();
  const { branches } = useBranches();
  const [payslips, setPayslips] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employee) return;
    supabase.from("payslips").select("*").eq("employee_id", employee.id).order("created_at", { ascending: false })
      .then(({ data }) => { setPayslips(data ?? []); setLoading(false); });
  }, [employee]);

  if (!employee) return null;

  const branchName = branches.find((b) => b.id === employee.branch_id)?.name ?? "—";

  // Compute current payslip from employee data if none saved
  const computed = calculatePayroll(employee);
  const currentPeriod = "March 2026";

  const hasDbPayslips = payslips.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">Payslip History</h3>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted" />)}</div>
      ) : (
        <div className="space-y-2">
          {/* Current month payslip (always show computed) */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <p className="text-sm font-medium text-card-foreground">{currentPeriod}</p>
              <p className="text-xs text-muted-foreground">Net Pay: <span className="font-semibold text-primary">{formatCurrency(computed.netPay, 2)}</span></p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => printPayslip(employee, branchName, currentPeriod)}>
                <Printer className="mr-1 h-3.5 w-3.5" /> Print
              </Button>
              <Button size="sm" onClick={() => downloadPayslipPDF(employee, branchName, currentPeriod)}>
                <Download className="mr-1 h-3.5 w-3.5" /> PDF
              </Button>
            </div>
          </div>

          {hasDbPayslips && payslips.slice(0, 12).map((ps) => (
            <div key={ps.id as string} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div>
                <p className="text-sm font-medium text-card-foreground">{ps.period as string}</p>
                <p className="text-xs text-muted-foreground">Net Pay: <span className="font-semibold text-primary">{formatCurrency(ps.net_pay as number, 2)}</span></p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => printPayslip(employee, branchName, ps.period as string)}>
                  <Printer className="mr-1 h-3.5 w-3.5" /> Print
                </Button>
                <Button size="sm" onClick={() => downloadPayslipPDF(employee, branchName, ps.period as string)}>
                  <Download className="mr-1 h-3.5 w-3.5" /> PDF
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current payslip breakdown */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm font-semibold text-card-foreground mb-3">Current Month Breakdown — {currentPeriod}</p>
        <div className="space-y-1.5 text-sm">
          {[["Basic Salary", employee.basic_salary], ["House Allowance", employee.house_allowance], ["Transport Allowance", employee.transport_allowance]].map(([l, v]) => (
            <div key={l as string} className="flex justify-between"><span className="text-muted-foreground">{l}</span><span>{formatCurrency(v as number)}</span></div>
          ))}
          <div className="flex justify-between font-semibold border-t border-border pt-1.5 mt-1.5"><span>Gross Pay</span><span>{formatCurrency(computed.gross)}</span></div>
          {[["PAYE", computed.paye], ["NSSF", computed.nssf.employee], ["SHA (2.75%)", computed.sha], ["AHL (1.5%)", computed.ahl.employee], ["NITA", computed.nita.employee]].map(([l, v]) => (
            <div key={l as string} className="flex justify-between"><span className="text-muted-foreground">{l}</span><span className="text-destructive">-{formatCurrency(v as number)}</span></div>
          ))}
          <div className="flex justify-between font-bold border-t border-border pt-1.5 mt-1.5">
            <span>NET PAY</span><span className="text-primary text-base">{formatCurrency(computed.netPay, 2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── My Leave Tab ──────────────────────────────────────────────────────────────
function LeaveTab() {
  const { employee } = useAuth();
  const [leaves, setLeaves] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "Annual", start_date: "", end_date: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLeaves = () => {
    if (!employee) return;
    supabase.from("leave_requests").select("*").eq("employee_id", employee.id).order("applied_on", { ascending: false })
      .then(({ data }) => { setLeaves(data ?? []); setLoading(false); });
  };

  useEffect(() => { fetchLeaves(); }, [employee]); // eslint-disable-line

  const calcDays = () => {
    if (!form.start_date || !form.end_date) return 0;
    return Math.max(0, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1);
  };
  const days = calcDays();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    setFormError(null);
    if (!form.start_date || !form.end_date || !form.reason) { setFormError("All fields required."); return; }
    setSubmitting(true);
    const { error } = await supabase.from("leave_requests").insert({
      id: `LR${Date.now()}`, employee_id: employee.id, type: form.type,
      start_date: form.start_date, end_date: form.end_date, days,
      reason: form.reason, status: "Pending", applied_on: new Date().toISOString().split("T")[0], approved_by: null,
    });
    setSubmitting(false);
    if (error) { setFormError(error.message); return; }
    setShowForm(false);
    setForm({ type: "Annual", start_date: "", end_date: "", reason: "" });
    fetchLeaves();
  };

  const statusColor = (s: string) => s === "Approved" ? "bg-green-100 text-green-800" : s === "Rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-card-foreground">Leave Balance</p>
          <p className="text-xs text-muted-foreground">{employee?.leave_balance} days remaining of 21 annual entitlement</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="mr-1 h-3.5 w-3.5" /> Apply</Button>
      </div>

      {/* Balance bars */}
      <div className="space-y-2">
        {[["Annual Leave", employee?.leave_balance ?? 0, 21], ["Sick Leave", 30 - (leaves.filter((l) => l.type === "Sick" && l.status === "Approved").reduce((s, l) => s + (l.days as number), 0)), 30]].map(([label, rem, total]) => (
          <div key={label as string} className="rounded-lg border border-border bg-card p-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-card-foreground">{label}</span>
              <span className="text-muted-foreground">{rem} of {total} days remaining</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, ((rem as number) / (total as number)) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {loading ? <div className="animate-pulse space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted" />)}</div>
        : leaves.length === 0 ? <p className="text-sm text-muted-foreground">No leave requests yet.</p>
        : (
          <div className="space-y-2">
            {leaves.map((req) => (
              <div key={req.id as string} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{req.type as string} Leave</p>
                  <p className="text-xs text-muted-foreground">{formatDate(req.start_date as string)} — {formatDate(req.end_date as string)} · {req.days as number} days</p>
                </div>
                <Badge className={`${statusColor(req.status as string)} border-0`}>{req.status as string}</Badge>
              </div>
            ))}
          </div>
        )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {formError && <div className="text-xs text-destructive bg-destructive/10 rounded p-2">{formError}</div>}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Leave Type</label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date *</label><Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">End Date *</label><Input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} /></div>
            </div>
            {days > 0 && <div className="rounded-lg bg-primary/10 px-4 py-2 text-sm text-primary font-medium">{days} day{days !== 1 ? "s" : ""} requested</div>}
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Reason *</label><Input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Brief reason…" /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting || days === 0}>{submitting ? "Submitting…" : "Submit"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── My Expenses Tab ────────────────────────────────────────────────────────────
function ExpensesTab() {
  const { employee } = useAuth();
  const [expenses, setExpenses] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "Travel", amount: "", description: "", expense_date: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchExpenses = () => {
    if (!employee) return;
    supabase.from("expenses").select("*").eq("employee_id", employee.id).order("created_at", { ascending: false })
      .then(({ data }) => { setExpenses(data ?? []); setLoading(false); });
  };

  useEffect(() => { fetchExpenses(); }, [employee]); // eslint-disable-line

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    setFormError(null);
    if (!form.amount || !form.description || !form.expense_date) { setFormError("All fields required."); return; }
    setSubmitting(true);
    const { error } = await supabase.from("expenses").insert({
      employee_id: employee.id, category: form.category, amount: parseFloat(form.amount),
      description: form.description, expense_date: form.expense_date, status: "pending",
    });
    setSubmitting(false);
    if (error) { setFormError(error.message); return; }
    setShowForm(false);
    setForm({ category: "Travel", amount: "", description: "", expense_date: "" });
    fetchExpenses();
  };

  const statusColor = (s: string) => ({ pending: "bg-amber-100 text-amber-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800", reimbursed: "bg-blue-100 text-blue-800" }[s] ?? "bg-gray-100 text-gray-700");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">My Expense Claims</h3>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="mr-1 h-3.5 w-3.5" /> Submit</Button>
      </div>

      {loading ? <div className="animate-pulse space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted" />)}</div>
        : expenses.length === 0 ? <p className="text-sm text-muted-foreground">No expense claims submitted yet.</p>
        : (
          <div className="space-y-2">
            {expenses.map((exp) => (
              <div key={exp.id as string} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{exp.description as string}</p>
                  <p className="text-xs text-muted-foreground">{exp.category as string} · {formatDate(exp.expense_date as string)} · <span className="font-semibold">{formatCurrency(exp.amount as number)}</span></p>
                </div>
                <Badge className={`${statusColor(exp.status as string)} border-0 capitalize`}>{exp.status as string}</Badge>
              </div>
            ))}
          </div>
        )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Submit Expense Claim</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {formError && <div className="text-xs text-destructive bg-destructive/10 rounded p-2">{formError}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Travel", "Meals", "Supplies", "Equipment", "Other"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Amount (KES) *</label><Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Description *</label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description…" /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Expense Date *</label><Input type="date" value={form.expense_date} onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))} /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit Claim"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── My Performance Tab ────────────────────────────────────────────────────────
function PerformanceTab() {
  const { employee } = useAuth();
  const [appraisals, setAppraisals] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employee) return;
    supabase.from("appraisals").select("*").eq("employee_id", employee.id).order("created_at", { ascending: false })
      .then(({ data }) => { setAppraisals(data ?? []); setLoading(false); });
  }, [employee]);

  const ratingColor = (r: string) => ({ Exceeds: "bg-green-100 text-green-800", Meets: "bg-blue-100 text-blue-800", Below: "bg-red-100 text-red-800" }[r] ?? "bg-gray-100 text-gray-700");

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-card-foreground">My Performance Reviews</h3>
      {loading ? <div className="animate-pulse space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-muted" />)}</div>
        : appraisals.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No performance reviews on record yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appraisals.map((a) => (
              <div key={a.id as string} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-card-foreground">{a.period as string}</p>
                  {a.rating && <Badge className={`${ratingColor(a.rating as string)} border-0`}>{a.rating as string}</Badge>}
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div><p className="text-muted-foreground">Self Score</p><p className="font-semibold">{a.self_score != null ? `${(a.self_score as number).toFixed(1)} / 5` : "—"}</p></div>
                  <div><p className="text-muted-foreground">Manager Score</p><p className="font-semibold">{a.manager_score != null ? `${(a.manager_score as number).toFixed(1)} / 5` : "—"}</p></div>
                  <div><p className="text-muted-foreground">Final Score</p><p className="font-bold text-primary">{a.final_score != null ? `${(a.final_score as number).toFixed(2)} / 5` : "—"}</p></div>
                </div>
                {a.comments && <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2 italic">"{a.comments as string}"</p>}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── My Profile Tab ──────────────────────────────────────────────────────────
function ProfileTab() {
  const { employee } = useAuth();
  const { branches } = useBranches();
  const [form, setForm] = useState({ phone: employee?.phone ?? "", mpesa_no: "", bank_name: "", bank_account: "", next_of_kin_name: "", next_of_kin_phone: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (employee) {
      setForm({
        phone: employee.phone ?? "",
        mpesa_no: (employee as Record<string, unknown>).mpesa_no as string ?? "",
        bank_name: (employee as Record<string, unknown>).bank_name as string ?? "",
        bank_account: (employee as Record<string, unknown>).bank_account as string ?? "",
        next_of_kin_name: (employee as Record<string, unknown>).next_of_kin_name as string ?? "",
        next_of_kin_phone: (employee as Record<string, unknown>).next_of_kin_phone as string ?? "",
      });
    }
  }, [employee]);

  const branch = branches.find((b) => b.id === employee?.branch_id);

  const handleSave = async () => {
    if (!employee) return;
    setSaving(true);
    await supabase.from("employees").update(form as Record<string, string>).eq("id", employee.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!employee) return null;

  return (
    <div className="space-y-5">
      {/* Read-only info */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Personal Details</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {[
            ["Full Name", employee.name], ["Employee ID", employee.id],
            ["Job Title", employee.job_title], ["Department", employee.department],
            ["Branch", branch?.name ?? "—"], ["Employment Type", employee.employment_type],
            ["Join Date", formatDate(employee.join_date)], ["Status", employee.status],
          ].map(([l, v]) => (
            <div key={l as string}><p className="text-xs text-muted-foreground">{l}</p><p className="font-medium text-card-foreground">{v}</p></div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Statutory Information (Read-Only)</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {[["KRA PIN", employee.kra_pin], ["NSSF No.", employee.nssf_no], ["National ID", employee.national_id], ["SHA No.", employee.sha_no]].map(([l, v]) => (
            <div key={l as string}><p className="text-xs text-muted-foreground">{l}</p><p className="font-medium text-card-foreground">{v ?? "—"}</p></div>
          ))}
        </div>
      </div>

      {/* Editable */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Update Your Contact & Payment Details</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { k: "phone", label: "Phone Number" },
            { k: "mpesa_no", label: "M-Pesa Number" },
            { k: "bank_name", label: "Bank Name" },
            { k: "bank_account", label: "Bank Account Number" },
            { k: "next_of_kin_name", label: "Next of Kin Name" },
            { k: "next_of_kin_phone", label: "Next of Kin Phone" },
          ].map(({ k, label }) => (
            <div key={k}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
              <Input value={(form as Record<string, string>)[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── My Documents Tab ────────────────────────────────────────────────────────
function DocumentsTab() {
  const { employee } = useAuth();
  const [contracts, setContracts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employee) return;
    supabase.from("contracts").select("*").eq("employee_id", employee.id).order("created_at", { ascending: false })
      .then(({ data }) => { setContracts(data ?? []); setLoading(false); });
  }, [employee]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
        These documents are for your personal records. Contact HR for queries or corrections.
      </div>

      <h3 className="text-sm font-semibold text-card-foreground">My Contracts</h3>
      {loading ? <div className="animate-pulse h-16 rounded-lg bg-muted" />
        : contracts.length === 0 ? <p className="text-sm text-muted-foreground">No contracts on file.</p>
        : (
          <div className="space-y-2">
            {contracts.map((c) => (
              <div key={c.id as string} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-card-foreground">{c.contract_type as string}</p>
                  <Badge className={c.status === "active" ? "bg-green-100 text-green-800 border-0" : "bg-gray-100 text-gray-700 border-0 capitalize"}>{c.status as string}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Start: {formatDate(c.start_date as string)}</span>
                  <span>End: {c.end_date ? formatDate(c.end_date as string) : "Open-ended"}</span>
                  {c.position && <span>Position: {c.position as string}</span>}
                  {c.salary && <span>Salary: {formatCurrency(c.salary as number)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SelfService() {
  const { employee, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<TabId>("payslips");

  if (authLoading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground text-sm">Loading profile…</p></div>;

  if (!employee) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Employee Self-Service</h1>
      <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">No employee profile linked to your account. Contact HR.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Employee Self-Service</h1>
        <p className="text-sm text-muted-foreground">Welcome, {employee.name} — {employee.job_title}</p>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${tab === id ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-card-foreground"}`}>
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.replace("My ", "")}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        {tab === "payslips" && <PayslipsTab />}
        {tab === "leave" && <LeaveTab />}
        {tab === "expenses" && <ExpensesTab />}
        {tab === "performance" && <PerformanceTab />}
        {tab === "profile" && <ProfileTab />}
        {tab === "documents" && <DocumentsTab />}
      </div>
    </div>
  );
}
