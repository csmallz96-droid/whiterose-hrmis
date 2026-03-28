import { useState } from "react";
import { Search, Filter, Plus, X, ChevronRight } from "lucide-react";
import { useBranches, useEmployees, type Employee } from "@/hooks/useSupabaseData";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate, formatCurrency } from "@/lib/utils";

// ─── Add/Edit Employee Form ───────────────────────────────────────────────────

interface EmployeeFormProps {
  branches: ReturnType<typeof useBranches>["branches"];
  initial?: Partial<Employee>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
  title: string;
}

function EmployeeForm({ branches, initial, onSubmit, onClose, title }: EmployeeFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    national_id: initial?.national_id ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    branch_id: initial?.branch_id ?? "",
    department: initial?.department ?? "",
    job_title: initial?.job_title ?? "",
    employment_type: initial?.employment_type ?? "Permanent",
    basic_salary: String(initial?.basic_salary ?? ""),
    house_allowance: String(initial?.house_allowance ?? "0"),
    transport_allowance: String(initial?.transport_allowance ?? "0"),
    join_date: initial?.join_date ?? "",
    contract_end: initial?.contract_end ?? "",
    nssf_no: initial?.nssf_no ?? "",
    nhif_no: initial?.nhif_no ?? "",
    kra_pin: initial?.kra_pin ?? "",
    status: initial?.status ?? "Active",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.name || !form.national_id || !form.branch_id || !form.job_title || !form.basic_salary || !form.join_date) {
      setFormError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        basic_salary: parseFloat(form.basic_salary),
        house_allowance: parseFloat(form.house_allowance) || 0,
        transport_allowance: parseFloat(form.transport_allowance) || 0,
        contract_end: form.contract_end || null,
        leave_balance: initial?.leave_balance ?? 21,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const field = (label: string, key: string, type = "text", required = false) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}{required && <span className="text-destructive ml-1">*</span>}
      </label>
      <Input type={type} value={(form as Record<string, string>)[key]} onChange={(e) => set(key, e.target.value)} required={required} />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {formError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">{formError}</div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {field("Full Name", "name", "text", true)}
        {field("National ID", "national_id", "text", true)}
        {field("Email", "email", "email")}
        {field("Phone", "phone", "tel")}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Branch <span className="text-destructive">*</span></label>
          <Select value={form.branch_id} onValueChange={(v) => set("branch_id", v)}>
            <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}{b.sub_location ? ` - ${b.sub_location}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {field("Department", "department", "text")}
        {field("Job Title / Designation", "job_title", "text", true)}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Employment Type <span className="text-destructive">*</span></label>
          <Select value={form.employment_type} onValueChange={(v) => set("employment_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Permanent", "Contract", "Casual"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {field("Gross / Basic Salary (KES)", "basic_salary", "number", true)}
        {field("House Allowance (KES)", "house_allowance", "number")}
        {field("Transport Allowance (KES)", "transport_allowance", "number")}
        {field("Start Date", "join_date", "date", true)}
        {field("Contract End Date", "contract_end", "date")}
        {field("NSSF No.", "nssf_no")}
        {field("NHIF No.", "nhif_no")}
        {field("KRA PIN", "kra_pin")}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Active", "On Leave", "Inactive", "Probation"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : title}</Button>
      </div>
    </form>
  );
}

// ─── Employee Detail View ─────────────────────────────────────────────────────

interface EmployeeDetailProps {
  employee: Employee;
  branchName: string;
  onClose: () => void;
  onEdit: () => void;
}

function EmployeeDetail({ employee: emp, branchName, onClose, onEdit }: EmployeeDetailProps) {
  const [tab, setTab] = useState<"personal" | "contract" | "leave">("personal");

  const row = (label: string, value: string | number | null | undefined) => (
    <div key={label} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-card-foreground mt-0.5 sm:mt-0">{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-card-foreground">{emp.name}</p>
          <p className="text-xs text-muted-foreground">{emp.job_title} · {branchName}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["personal", "contract", "leave"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "personal" ? "Personal Info" : t === "contract" ? "Contract" : "Leave Balance"}
          </button>
        ))}
      </div>

      {tab === "personal" && (
        <div>
          {row("Employee ID", emp.id)}
          {row("Full Name", emp.name)}
          {row("Email", emp.email)}
          {row("Phone", emp.phone)}
          {row("National ID", emp.national_id)}
          {row("KRA PIN", emp.kra_pin)}
          {row("NSSF No.", emp.nssf_no)}
          {row("NHIF No.", emp.nhif_no)}
          {row("Department", emp.department)}
          {row("Branch", branchName)}
          {row("Status", emp.status)}
        </div>
      )}

      {tab === "contract" && (
        <div>
          {row("Employment Type", emp.employment_type)}
          {row("Job Title", emp.job_title)}
          {row("Start Date", formatDate(emp.join_date))}
          {row("Contract End", formatDate(emp.contract_end) ?? "Open-ended")}
          {row("Basic Salary", formatCurrency(emp.basic_salary))}
          {row("House Allowance", formatCurrency(emp.house_allowance))}
          {row("Transport Allowance", formatCurrency(emp.transport_allowance))}
          {row("Gross Salary", formatCurrency(emp.basic_salary + emp.house_allowance + emp.transport_allowance))}
        </div>
      )}

      {tab === "leave" && (
        <div>
          {row("Annual Leave Entitlement", "21 days")}
          {row("Leave Balance Remaining", `${emp.leave_balance} days`)}
          {row("Leave Taken", `${21 - emp.leave_balance} days`)}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

// ─── Main Employees Page ──────────────────────────────────────────────────────

export default function Employees() {
  const { branches } = useBranches();
  const { employees, loading, error, addEmployee, updateEmployee } = useEmployees();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const filtered = employees.filter((emp) => {
    const matchSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.id.toLowerCase().includes(search.toLowerCase());
    const matchBranch = branchFilter === "all" || emp.branch_id === branchFilter;
    const matchStatus = statusFilter === "all" || emp.status === statusFilter;
    return matchSearch && matchBranch && matchStatus;
  });

  const statusColor = (status: string) => {
    if (status === "Active") return "bg-green-100 text-green-800 border-green-200";
    if (status === "On Leave") return "bg-amber-100 text-amber-800 border-amber-200";
    if (status === "Probation") return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const generateId = () => {
    const nums = employees
      .map((e) => parseInt(e.id.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `WR${String(next).padStart(3, "0")}`;
  };

  const handleAdd = async (data: Record<string, unknown>) => {
    setAddError(null);
    const result = await addEmployee({
      id: generateId(),
      name: data.name as string,
      national_id: data.national_id as string,
      email: data.email as string,
      phone: data.phone as string,
      branch_id: data.branch_id as string,
      department: data.department as string,
      job_title: data.job_title as string,
      employment_type: data.employment_type as string,
      basic_salary: data.basic_salary as number,
      house_allowance: data.house_allowance as number,
      transport_allowance: data.transport_allowance as number,
      join_date: data.join_date as string,
      contract_end: data.contract_end as string | null,
      nssf_no: data.nssf_no as string,
      nhif_no: data.nhif_no as string,
      kra_pin: data.kra_pin as string,
      leave_balance: 21,
      status: data.status as string,
    });
    if (result.error) {
      setAddError(result.error);
      throw new Error(result.error);
    }
    setShowAdd(false);
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!editingEmp) return;
    const result = await updateEmployee(editingEmp.id, {
      name: data.name as string,
      national_id: data.national_id as string,
      email: data.email as string,
      phone: data.phone as string,
      branch_id: data.branch_id as string,
      department: data.department as string,
      job_title: data.job_title as string,
      employment_type: data.employment_type as string,
      basic_salary: data.basic_salary as number,
      house_allowance: data.house_allowance as number,
      transport_allowance: data.transport_allowance as number,
      join_date: data.join_date as string,
      contract_end: data.contract_end as string | null,
      nssf_no: data.nssf_no as string,
      nhif_no: data.nhif_no as string,
      kra_pin: data.kra_pin as string,
      status: data.status as string,
    });
    if (result.error) throw new Error(result.error);
    setEditingEmp(null);
    setSelectedEmp(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Directory</h1>
          <p className="text-sm text-muted-foreground">
            {employees.length} employees across {branches.length} branches
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}{b.sub_location ? ` - ${b.sub_location}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["Active", "On Leave", "Inactive", "Probation"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="animate-pulse">
            <div className="h-10 bg-muted/50 border-b border-border" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3 border-b border-border/50">
                <div className="h-4 w-16 rounded bg-muted" />
                <div className="h-4 flex-1 rounded bg-muted" />
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-4 w-24 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-card-foreground">No employees found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search || branchFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters."
              : "Add your first employee using the button above."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Branch</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Job Title</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Basic Salary</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const branch = branches.find((b) => b.id === emp.branch_id);
                return (
                  <tr
                    key={emp.id}
                    className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30"
                    onClick={() => setSelectedEmp(emp)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{emp.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-card-foreground">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.email}</p>
                    </td>
                    <td className="px-4 py-3 text-card-foreground">
                      {branch?.name ?? "—"}
                      {branch?.sub_location ? ` (${branch.sub_location})` : ""}
                    </td>
                    <td className="px-4 py-3 text-card-foreground">{emp.job_title}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">{emp.employment_type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(emp.status)}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-card-foreground">
                      {formatCurrency(emp.basic_salary)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <ChevronRight className="h-4 w-4" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Employee Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          {addError && (
            <div className="rounded bg-destructive/10 p-2 text-xs text-destructive">{addError}</div>
          )}
          <EmployeeForm
            branches={branches}
            onSubmit={handleAdd}
            onClose={() => setShowAdd(false)}
            title="Add Employee"
          />
        </DialogContent>
      </Dialog>

      {/* Employee Detail Modal */}
      <Dialog open={!!selectedEmp && !editingEmp} onOpenChange={(open) => { if (!open) setSelectedEmp(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmp && (
            <EmployeeDetail
              employee={selectedEmp}
              branchName={branches.find((b) => b.id === selectedEmp.branch_id)?.name ?? "—"}
              onClose={() => setSelectedEmp(null)}
              onEdit={() => setEditingEmp(selectedEmp)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={!!editingEmp} onOpenChange={(open) => { if (!open) setEditingEmp(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee — {editingEmp?.name}</DialogTitle>
          </DialogHeader>
          {editingEmp && (
            <EmployeeForm
              branches={branches}
              initial={editingEmp}
              onSubmit={handleEdit}
              onClose={() => setEditingEmp(null)}
              title="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
