import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmployees, useBranches } from "@/hooks/useSupabaseData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { formatDate, formatCurrency } from "@/lib/utils";

type Contract = Tables<"contracts">;

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ContractStatusBadge({ contract }: { contract: Contract }) {
  if (contract.status === "expired") return <Badge className="bg-red-100 text-red-800 border-0">Expired</Badge>;
  if (!contract.end_date) return <Badge className="bg-green-100 text-green-800 border-0">Active</Badge>;
  const days = daysUntil(contract.end_date);
  if (days !== null && days <= 60 && days > 0)
    return <Badge className="bg-amber-100 text-amber-800 border-0">Expiring in {days}d</Badge>;
  if (days !== null && days <= 0) return <Badge className="bg-red-100 text-red-800 border-0">Expired</Badge>;
  return <Badge className="bg-green-100 text-green-800 border-0">Active</Badge>;
}

export default function Contracts() {
  const { employees } = useEmployees();
  const { branches } = useBranches();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Contract | null>(null);

  // Add form state
  const [form, setForm] = useState({
    employee_id: "", contract_type: "Permanent", start_date: "",
    end_date: "", position: "", department: "", salary: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchContracts = () => {
    supabase.from("contracts").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setContracts(data ?? []); setLoading(false); });
  };

  useEffect(() => { fetchContracts(); }, []);

  const expiringCount = contracts.filter((c) => {
    const d = daysUntil(c.end_date);
    return d !== null && d <= 60 && d > 0;
  }).length;

  const filtered = contracts.filter((c) => {
    const emp = employees.find((e) => e.id === c.employee_id);
    const matchSearch = !search || emp?.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.employee_id || !form.contract_type || !form.start_date) {
      setFormError("Employee, contract type and start date are required.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contracts").insert({
      employee_id: form.employee_id,
      contract_type: form.contract_type,
      start_date: form.start_date,
      end_date: form.end_date || null,
      position: form.position || null,
      department: form.department || null,
      salary: form.salary ? parseFloat(form.salary) : null,
      notes: form.notes || null,
      status: "active",
      signed_by_employee: false,
    });
    setSubmitting(false);
    if (error) { setFormError(error.message); return; }
    setShowAdd(false);
    fetchContracts();
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contracts</h1>
          <p className="text-sm text-muted-foreground">Manage employee contracts and renewals</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" /> Add Contract</Button>
      </div>

      {expiringCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {expiringCount} contract{expiringCount > 1 ? "s" : ""} expiring within 60 days
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Input placeholder="Search employee…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">No contracts found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Position</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Start</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">End</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Salary</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const emp = employees.find((e) => e.id === c.employee_id);
                return (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-card-foreground">{emp?.name ?? c.employee_id}</p>
                      <p className="text-xs text-muted-foreground">{emp?.department}</p>
                    </td>
                    <td className="px-4 py-3 text-card-foreground">{c.contract_type}</td>
                    <td className="px-4 py-3 text-card-foreground">{c.position ?? "—"}</td>
                    <td className="px-4 py-3 text-card-foreground whitespace-nowrap">{formatDate(c.start_date)}</td>
                    <td className="px-4 py-3 text-card-foreground whitespace-nowrap">
                      {c.end_date ? formatDate(c.end_date) : <span className="text-muted-foreground">Open-ended</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-card-foreground">
                      {c.salary ? formatCurrency(c.salary) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center"><ContractStatusBadge contract={c} /></td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => setSelected(c)}>View</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Contract detail modal */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Contract Details</DialogTitle></DialogHeader>
          {selected && (() => {
            const emp = employees.find((e) => e.id === selected.employee_id);
            const branch = branches.find((b) => b.id === emp?.branch_id);
            const rows = [
              ["Employee", emp?.name ?? selected.employee_id],
              ["Branch", branch?.name ?? "—"],
              ["Contract Type", selected.contract_type],
              ["Position", selected.position ?? "—"],
              ["Department", selected.department ?? "—"],
              ["Start Date", formatDate(selected.start_date)],
              ["End Date", selected.end_date ? formatDate(selected.end_date) : "Open-ended"],
              ["Salary", selected.salary ? formatCurrency(selected.salary) : "—"],
              ["Status", selected.status],
              ["Signed by Employee", selected.signed_by_employee ? "Yes" : "No"],
              ["Notes", selected.notes ?? "—"],
            ];
            return (
              <div className="space-y-2">
                {rows.map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-border/50 py-1.5 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-card-foreground text-right">{value}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Add Contract modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Contract</DialogTitle></DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-3">
            {formError && <div className="text-xs text-destructive bg-destructive/10 rounded p-2">{formError}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Employee *</label>
                <Select value={form.employee_id} onValueChange={(v) => set("employee_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Contract Type *</label>
                <Select value={form.contract_type} onValueChange={(v) => set("contract_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Permanent","Fixed-Term","Casual","Internship"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Salary (KES)</label>
                <Input type="number" value={form.salary} onChange={(e) => set("salary", e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date *</label>
                <Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">End Date</label>
                <Input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Position</label>
                <Input value={form.position} onChange={(e) => set("position", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Department</label>
                <Input value={form.department} onChange={(e) => set("department", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                <Input value={form.notes} onChange={(e) => set("notes", e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Add Contract"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
