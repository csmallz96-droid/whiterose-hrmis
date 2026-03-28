import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmployees, useBranches } from "@/hooks/useSupabaseData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

type Expense = Tables<"expenses">;

const CATEGORIES = ["Travel", "Meals", "Supplies", "Equipment", "Other"];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    reimbursed: "bg-blue-100 text-blue-800",
  };
  return <Badge className={`${map[status] ?? "bg-gray-100 text-gray-800"} border-0 capitalize`}>{status}</Badge>;
}

export default function Expenses() {
  const { employees } = useEmployees();
  const { branches } = useBranches();
  const { employee: currentEmp, role } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    employee_id: currentEmp?.id ?? "",
    category: "Travel",
    amount: "",
    description: "",
    expense_date: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchExpenses = () => {
    supabase.from("expenses").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setExpenses(data ?? []); setLoading(false); });
  };

  useEffect(() => { fetchExpenses(); }, []);

  const pendingTotal = expenses.filter((e) => e.status === "pending").reduce((s, e) => s + e.amount, 0);
  const approvedTotal = expenses.filter((e) => e.status === "approved").reduce((s, e) => s + e.amount, 0);

  const filtered = expenses.filter((e) => {
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    const matchCat = categoryFilter === "all" || e.category === categoryFilter;
    return matchStatus && matchCat;
  });

  const handleApprove = async (id: string) => {
    await supabase.from("expenses").update({ status: "approved", approved_by: currentEmp?.id ?? "HR", approved_at: new Date().toISOString() }).eq("id", id);
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, status: "approved" } : e));
  };

  const handleReject = async (id: string) => {
    await supabase.from("expenses").update({ status: "rejected" }).eq("id", id);
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, status: "rejected" } : e));
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError(null);
    if (!form.employee_id || !form.amount || !form.expense_date || !form.description) {
      setFormError("All fields are required."); return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("expenses").insert({
      employee_id: form.employee_id,
      category: form.category,
      amount: parseFloat(form.amount),
      description: form.description,
      expense_date: form.expense_date,
      status: "pending",
    });
    setSubmitting(false);
    if (error) { setFormError(error.message); return; }
    setShowAdd(false);
    fetchExpenses();
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const canApprove = role === "admin" || role === "hr";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track and manage expense claims</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" /> Submit Expense</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total Pending</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(pendingTotal)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Approved This Month</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(approvedTotal)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["pending","approved","rejected","reimbursed"].map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">No expense claims found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                {canApprove && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => {
                const emp = employees.find((e) => e.id === exp.employee_id);
                return (
                  <tr key={exp.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-card-foreground">{emp?.name ?? exp.employee_id}</p>
                    </td>
                    <td className="px-4 py-3 text-card-foreground">{exp.category}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{exp.description}</td>
                    <td className="px-4 py-3 text-card-foreground whitespace-nowrap">{formatDate(exp.expense_date)}</td>
                    <td className="px-4 py-3 text-right font-medium text-card-foreground">{formatCurrency(exp.amount)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={exp.status} /></td>
                    {canApprove && (
                      <td className="px-4 py-3">
                        {exp.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10" onClick={() => handleReject(exp.id)}>Reject</Button>
                            <Button size="sm" className="h-7 px-2 text-xs" onClick={() => handleApprove(exp.id)}>Approve</Button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Submit Expense Claim</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {formError && <div className="text-xs text-destructive bg-destructive/10 rounded p-2">{formError}</div>}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Employee *</label>
              <Select value={form.employee_id} onValueChange={(v) => set("employee_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Category *</label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount (KES) *</label>
                <Input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description *</label>
              <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief description…" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Expense Date *</label>
              <Input type="date" value={form.expense_date} onChange={(e) => set("expense_date", e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit Claim"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
