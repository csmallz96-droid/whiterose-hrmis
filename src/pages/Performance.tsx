import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmployees } from "@/hooks/useSupabaseData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Target } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

type Appraisal = Tables<"appraisals">;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    "self-assessed": "bg-blue-100 text-blue-800",
    "manager-reviewed": "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
  };
  return <Badge className={`${map[status] ?? "bg-gray-100 text-gray-800"} border-0 capitalize`}>{status.replace("-", " ")}</Badge>;
}

function RatingBadge({ rating }: { rating: string | null }) {
  if (!rating) return <span className="text-muted-foreground text-sm">—</span>;
  const map: Record<string, string> = {
    Exceeds: "bg-green-100 text-green-800",
    Meets: "bg-blue-100 text-blue-800",
    Below: "bg-red-100 text-red-800",
  };
  return <Badge className={`${map[rating] ?? "bg-gray-100"} border-0`}>{rating}</Badge>;
}

function ScoreBar({ score, max = 5 }: { score: number | null; max?: number }) {
  if (score === null) return <span className="text-muted-foreground text-sm">—</span>;
  const pct = Math.min(100, (score / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-card-foreground w-8">{score.toFixed(1)}</span>
    </div>
  );
}

export default function Performance() {
  const { employees } = useEmployees();
  const { role } = useAuth();
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Appraisal | null>(null);
  const [starting, setStarting] = useState(false);

  const fetchAppraisals = () => {
    supabase.from("appraisals").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setAppraisals(data ?? []); setLoading(false); });
  };

  useEffect(() => { fetchAppraisals(); }, []);

  const filtered = appraisals.filter((a) =>
    statusFilter === "all" || a.status === statusFilter
  );

  // Dept average scores
  const deptScores: Record<string, number[]> = {};
  appraisals.filter((a) => a.final_score !== null).forEach((a) => {
    const emp = employees.find((e) => e.id === a.employee_id);
    const dept = emp?.department ?? "Unknown";
    if (!deptScores[dept]) deptScores[dept] = [];
    deptScores[dept].push(a.final_score!);
  });

  const startAppraisalCycle = async () => {
    if (!window.confirm("Start Annual 2026 appraisal cycle for all active employees?")) return;
    setStarting(true);
    const active = employees.filter((e) => e.status === "Active");
    const records = active.map((e) => ({
      employee_id: e.id,
      appraiser_id: null,
      period: "Annual 2026",
      appraisal_type: "annual",
      status: "pending",
      objectives: [] as unknown[],
    }));
    await supabase.from("appraisals").insert(records);
    setStarting(false);
    fetchAppraisals();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performance</h1>
          <p className="text-sm text-muted-foreground">Employee appraisals and performance reviews</p>
        </div>
        {(role === "admin" || role === "hr") && (
          <Button onClick={startAppraisalCycle} disabled={starting}>
            <Target className="mr-2 h-4 w-4" />
            {starting ? "Starting…" : "Start Appraisal Cycle"}
          </Button>
        )}
      </div>

      {/* Dept averages */}
      {Object.keys(deptScores).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-card-foreground">Department Average Scores</h3>
          <div className="space-y-3">
            {Object.entries(deptScores).map(([dept, scores]) => {
              const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
              return (
                <div key={dept} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-32 shrink-0">{dept}</span>
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-3 rounded-full bg-primary" style={{ width: `${(avg / 5) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-card-foreground w-10">{avg.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["pending","self-assessed","manager-reviewed","completed"].map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s.replace("-", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">No appraisals found. Start an appraisal cycle to begin.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Period</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Self</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Manager</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-40">Final Score</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Rating</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const emp = employees.find((e) => e.id === a.employee_id);
                return (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-card-foreground">{emp?.name ?? a.employee_id}</p>
                      <p className="text-xs text-muted-foreground">{emp?.department}</p>
                    </td>
                    <td className="px-4 py-3 text-card-foreground">{a.period}</td>
                    <td className="px-4 py-3 text-card-foreground capitalize">{a.appraisal_type}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-center text-card-foreground">{a.self_score?.toFixed(1) ?? "—"}</td>
                    <td className="px-4 py-3 text-center text-card-foreground">{a.manager_score?.toFixed(1) ?? "—"}</td>
                    <td className="px-4 py-3 w-40"><ScoreBar score={a.final_score} /></td>
                    <td className="px-4 py-3 text-center"><RatingBadge rating={a.rating} /></td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => setSelected(a)}>View</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Appraisal Details</DialogTitle></DialogHeader>
          {selected && (() => {
            const emp = employees.find((e) => e.id === selected.employee_id);
            const appraiser = employees.find((e) => e.id === selected.appraiser_id);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Employee", emp?.name ?? selected.employee_id],
                    ["Appraiser", appraiser?.name ?? "—"],
                    ["Period", selected.period],
                    ["Type", selected.appraisal_type],
                    ["Status", selected.status],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-xs text-muted-foreground">{l}</p>
                      <p className="font-medium text-card-foreground">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Self Score</span>
                    <span className="font-medium">{selected.self_score?.toFixed(1) ?? "—"} / 5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Manager Score</span>
                    <span className="font-medium">{selected.manager_score?.toFixed(1) ?? "—"} / 5</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-2">
                    <span className="text-sm font-semibold text-card-foreground">Final Score</span>
                    <span className="text-lg font-bold text-primary">{selected.final_score?.toFixed(2) ?? "—"} / 5</span>
                  </div>
                  {selected.rating && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Rating</span>
                      <RatingBadge rating={selected.rating} />
                    </div>
                  )}
                </div>
                {selected.comments && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Manager Comments</p>
                    <p className="text-sm text-card-foreground bg-muted/50 rounded p-3">{selected.comments}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
