import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBranches, useEmployees } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Calculator, GitBranch, CalendarDays, Users, Bell, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";

const SECTIONS = [
  { id: "company", label: "Company Info", icon: Building2 },
  { id: "payroll", label: "Payroll Settings", icon: Calculator },
  { id: "branches", label: "Branch Management", icon: GitBranch },
  { id: "leave", label: "Leave Settings", icon: CalendarDays },
  { id: "users", label: "User Management", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function CompanyInfo() {
  const [form, setForm] = useState({
    name: "Whiterose Ltd",
    kra_pin: "P051234567X",
    nssf_no: "NSSF-001234",
    nhif_no: "NHIF-005678",
    nita_no: "NITA-000123",
    address: "Nairobi, Kenya",
    phone: "+254 700 000 000",
    email: "hr@whiterose.co.ke",
  });
  const [saved, setSaved] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-card-foreground mb-1">Company Information</h2>
        <p className="text-xs text-muted-foreground">Organisation details used on payslips and statutory forms</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { k: "name", label: "Company Name" },
          { k: "email", label: "HR Email" },
          { k: "phone", label: "Phone" },
          { k: "address", label: "Address" },
          { k: "kra_pin", label: "KRA PIN" },
          { k: "nssf_no", label: "NSSF Number" },
          { k: "nhif_no", label: "NHIF / SHA Number" },
          { k: "nita_no", label: "NITA Number" },
        ].map(({ k, label }) => (
          <div key={k}>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
            <Input value={(form as Record<string, string>)[k]} onChange={(e) => set(k, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave}>{saved ? "Saved!" : "Save Changes"}</Button>
      </div>
    </div>
  );
}

function PayrollSettings() {
  const [form, setForm] = useState({
    currency: "KES",
    pay_cycle: "Monthly",
    payment_day: "28",
    nssf_tier1_limit: "7000",
    nssf_tier2_limit: "18000",
    sha_rate: "2.75",
    ahl_rate: "1.5",
    nita_amount: "50",
    personal_relief: "2400",
  });
  const [saved, setSaved] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-card-foreground mb-1">Payroll Settings</h2>
        <p className="text-xs text-muted-foreground">Configure statutory deduction rates and payroll cycle</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Currency</label>
          <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="KES">KES — Kenyan Shilling</SelectItem>
              <SelectItem value="USD">USD — US Dollar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Pay Cycle</label>
          <Select value={form.pay_cycle} onValueChange={(v) => set("pay_cycle", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Day of Month</label>
          <Input type="number" value={form.payment_day} onChange={(e) => set("payment_day", e.target.value)} min="1" max="31" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">PAYE Personal Relief (KES/mo)</label>
          <Input type="number" value={form.personal_relief} onChange={(e) => set("personal_relief", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">NSSF Tier I Limit (KES)</label>
          <Input type="number" value={form.nssf_tier1_limit} onChange={(e) => set("nssf_tier1_limit", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">NSSF Tier II Limit (KES)</label>
          <Input type="number" value={form.nssf_tier2_limit} onChange={(e) => set("nssf_tier2_limit", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">SHA Rate (%)</label>
          <Input type="number" step="0.01" value={form.sha_rate} onChange={(e) => set("sha_rate", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">AHL Rate (%)</label>
          <Input type="number" step="0.01" value={form.ahl_rate} onChange={(e) => set("ahl_rate", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">NITA (KES/employee/month)</label>
          <Input type="number" value={form.nita_amount} onChange={(e) => set("nita_amount", e.target.value)} />
        </div>
      </div>
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">Current PAYE Bands (KRA 2024)</p>
        <p>0 – 24,000 @ 10% | 24,001 – 32,333 @ 25% | 32,334 – 500,000 @ 30%</p>
        <p>500,001 – 800,000 @ 32.5% | &gt;800,000 @ 35%</p>
      </div>
      <div className="flex justify-end">
        <Button onClick={() => { }}>{false ? "Saved!" : "Save Changes"}</Button>
      </div>
    </div>
  );
}

function BranchManagement() {
  const { branches, refetch } = useBranches();
  const [form, setForm] = useState({ name: "", location: "", manager_name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.location) { setError("Name and location are required."); return; }
    setSubmitting(true);
    const { error: err } = await supabase.from("branches").insert({ name: form.name, location: form.location, staff_count: 0 });
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    setForm({ name: "", location: "", manager_name: "" });
    refetch();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-card-foreground mb-1">Branch Management</h2>
        <p className="text-xs text-muted-foreground">View and add company branches</p>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Branch</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Location</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Staff</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="px-4 py-2 font-medium text-card-foreground">{b.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{b.location}</td>
                <td className="px-4 py-2 text-right text-card-foreground">{b.staff_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-card-foreground mb-3">Add Branch</p>
        {error && <div className="text-xs text-destructive bg-destructive/10 rounded p-2 mb-2">{error}</div>}
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Branch Name *</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Mombasa Branch" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Location *</label>
            <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Mombasa" />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={submitting} className="w-full">{submitting ? "Adding…" : "Add Branch"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeaveSettings() {
  const [policies, setPolicies] = useState([
    { type: "Annual Leave", days: "21", carry_over: true, requires_approval: true },
    { type: "Sick Leave", days: "14", carry_over: false, requires_approval: false },
    { type: "Maternity Leave", days: "90", carry_over: false, requires_approval: true },
    { type: "Paternity Leave", days: "14", carry_over: false, requires_approval: true },
    { type: "Compassionate Leave", days: "5", carry_over: false, requires_approval: true },
  ]);
  const [saved, setSaved] = useState(false);

  const updateDays = (idx: number, days: string) =>
    setPolicies((prev) => prev.map((p, i) => i === idx ? { ...p, days } : p));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-card-foreground mb-1">Leave Settings</h2>
        <p className="text-xs text-muted-foreground">Configure leave types and entitlements</p>
      </div>
      <div className="space-y-2">
        {policies.map((p, i) => (
          <div key={p.type} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-card-foreground">{p.type}</p>
              <div className="flex gap-3 mt-1">
                <Badge className={p.carry_over ? "bg-blue-100 text-blue-800 border-0 text-[10px]" : "bg-gray-100 text-gray-600 border-0 text-[10px]"}>
                  {p.carry_over ? "Carry-over" : "No carry-over"}
                </Badge>
                <Badge className={p.requires_approval ? "bg-amber-100 text-amber-800 border-0 text-[10px]" : "bg-green-100 text-green-800 border-0 text-[10px]"}>
                  {p.requires_approval ? "Requires approval" : "Auto-approved"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" value={p.days} onChange={(e) => updateDays(i, e.target.value)} className="w-20 text-right" min="0" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">days/yr</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

function UserManagement() {
  const { employees } = useEmployees();
  const { role } = useAuth();

  if (role !== "admin") {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Admin access required to manage users.</p>
      </div>
    );
  }

  const roleColor: Record<string, string> = {
    admin: "bg-amber-100 text-amber-800",
    hr: "bg-blue-100 text-blue-800",
    manager: "bg-purple-100 text-purple-800",
    employee: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-card-foreground mb-1">User Management</h2>
        <p className="text-xs text-muted-foreground">Manage employee system roles and access</p>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Employee</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Department</th>
              <th className="px-4 py-2 text-center font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-2 text-center font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="px-4 py-2">
                  <p className="font-medium text-card-foreground">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">{emp.job_title}</p>
                </td>
                <td className="px-4 py-2 text-muted-foreground text-xs">{emp.email}</td>
                <td className="px-4 py-2 text-card-foreground">{emp.department}</td>
                <td className="px-4 py-2 text-center">
                  <Badge className={`${roleColor[(emp as { role?: string }).role ?? "employee"] ?? "bg-gray-100 text-gray-700"} border-0 capitalize text-[10px]`}>
                    {(emp as { role?: string }).role ?? "employee"}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-center">
                  <Badge className={emp.status === "Active" ? "bg-green-100 text-green-800 border-0 text-[10px]" : "bg-red-100 text-red-800 border-0 text-[10px]"}>
                    {emp.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NotificationsSettings() {
  const [prefs, setPrefs] = useState({
    leave_requests: true,
    contract_expiry: true,
    payroll_run: true,
    expense_approvals: true,
    onboarding_reminders: false,
    performance_reviews: false,
  });

  const toggle = (k: string) => setPrefs((p) => ({ ...p, [k]: !(p as Record<string, boolean>)[k] }));
  const [saved, setSaved] = useState(false);

  const NOTIFS = [
    { k: "leave_requests", label: "Leave Request Submissions", desc: "Notify HR when employees submit leave requests" },
    { k: "contract_expiry", label: "Contract Expiry Alerts", desc: "Alert 60 days before contracts expire" },
    { k: "payroll_run", label: "Payroll Run Completion", desc: "Notify admins when payroll is processed" },
    { k: "expense_approvals", label: "Expense Approvals", desc: "Notify managers of pending expense claims" },
    { k: "onboarding_reminders", label: "Onboarding Reminders", desc: "Remind HR of incomplete onboarding tasks" },
    { k: "performance_reviews", label: "Performance Review Reminders", desc: "Remind managers when reviews are due" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-card-foreground mb-1">Notification Settings</h2>
        <p className="text-xs text-muted-foreground">Configure which events trigger system notifications</p>
      </div>
      <div className="space-y-2">
        {NOTIFS.map(({ k, label, desc }) => (
          <div key={k} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div>
              <p className="text-sm font-medium text-card-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <button
              onClick={() => toggle(k)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${(prefs as Record<string, boolean>)[k] ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${(prefs as Record<string, boolean>)[k] ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
          {saved ? "Saved!" : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState("company");

  const renderSection = () => {
    switch (activeSection) {
      case "company": return <CompanyInfo />;
      case "payroll": return <PayrollSettings />;
      case "branches": return <BranchManagement />;
      case "leave": return <LeaveSettings />;
      case "users": return <UserManagement />;
      case "notifications": return <NotificationsSettings />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">System configuration and preferences</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Sidebar nav */}
        <nav className="w-full sm:w-56 shrink-0 space-y-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${activeSection === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-card-foreground"}`}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </span>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 rounded-xl border border-border bg-card p-5 shadow-sm">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
