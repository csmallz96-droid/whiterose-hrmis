import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmployees } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardList, CheckCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { formatDate } from "@/lib/utils";

type OnboardingTask = Tables<"onboarding_tasks">;
type Employee = Tables<"employees">;

const DEFAULT_TASKS = [
  { task_name: "Submit National ID copy", category: "Documents", day_offset: 3 },
  { task_name: "Sign employment contract", category: "Documents", day_offset: 3 },
  { task_name: "NSSF registration", category: "Compliance", day_offset: 5 },
  { task_name: "SHA registration", category: "Compliance", day_offset: 5 },
  { task_name: "KRA PIN submission", category: "Compliance", day_offset: 7 },
  { task_name: "Branch orientation with manager", category: "Training", day_offset: 2 },
  { task_name: "System access setup", category: "IT Setup", day_offset: 3 },
  { task_name: "Emergency contact form", category: "Documents", day_offset: 5 },
];

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function Onboarding() {
  const { employees } = useEmployees();
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const fetchTasks = () => {
    supabase.from("onboarding_tasks").select("*").order("created_at")
      .then(({ data }) => { setTasks(data ?? []); setLoading(false); });
  };

  useEffect(() => { fetchTasks(); }, []);

  // New employees = joined in last 90 days
  const newEmployees = employees.filter((e) => daysSince(e.join_date) <= 90);

  const empTasks = (empId: string) => tasks.filter((t) => t.employee_id === empId);
  const completion = (empId: string) => {
    const et = empTasks(empId);
    if (et.length === 0) return { done: 0, total: 0, pct: 0 };
    const done = et.filter((t) => t.is_completed).length;
    return { done, total: et.length, pct: Math.round((done / et.length) * 100) };
  };

  const toggleTask = async (task: OnboardingTask) => {
    const newVal = !task.is_completed;
    await supabase.from("onboarding_tasks").update({
      is_completed: newVal,
      completed_at: newVal ? new Date().toISOString() : null,
    }).eq("id", task.id);
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, is_completed: newVal } : t));
  };

  const startOnboarding = async (empId: string, joinDate: string) => {
    const base = new Date(joinDate);
    const records = DEFAULT_TASKS.map((dt) => {
      const due = new Date(base);
      due.setDate(due.getDate() + dt.day_offset);
      return {
        employee_id: empId,
        task_name: dt.task_name,
        category: dt.category,
        is_completed: false,
        due_date: due.toISOString().split("T")[0],
      };
    });
    await supabase.from("onboarding_tasks").insert(records);
    fetchTasks();
  };

  const categoryColor: Record<string, string> = {
    Documents: "bg-blue-100 text-blue-800",
    Compliance: "bg-purple-100 text-purple-800",
    Training: "bg-green-100 text-green-800",
    "IT Setup": "bg-amber-100 text-amber-800",
  };

  const selectedTasks = selectedEmp ? empTasks(selectedEmp.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Onboarding</h1>
        <p className="text-sm text-muted-foreground">New employee onboarding task tracking</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted" />)}</div>
      ) : newEmployees.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
          <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-card-foreground">No new employees in the last 90 days</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {newEmployees.map((emp) => {
            const { done, total, pct } = completion(emp.id);
            const hasTasks = total > 0;
            return (
              <div key={emp.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-card-foreground">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.job_title} · Joined {formatDate(emp.join_date)}</p>
                  </div>
                  {hasTasks ? (
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{pct}%</p>
                      <p className="text-[10px] text-muted-foreground">{done}/{total} tasks</p>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => startOnboarding(emp.id, emp.join_date)} className="text-xs">
                      Start
                    </Button>
                  )}
                </div>
                {hasTasks && (
                  <>
                    <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
                      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setSelectedEmp(emp)}>
                      View Tasks
                    </Button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedEmp} onOpenChange={(open) => { if (!open) setSelectedEmp(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Onboarding — {selectedEmp?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {selectedTasks.map((task) => (
              <div key={task.id} className={`flex items-start gap-3 rounded-lg p-3 border transition-colors ${task.is_completed ? "bg-green-50 border-green-200" : "bg-background border-border"}`}>
                <button onClick={() => toggleTask(task)} className="mt-0.5 shrink-0">
                  {task.is_completed
                    ? <CheckCircle className="h-5 w-5 text-green-600" />
                    : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />}
                </button>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${task.is_completed ? "line-through text-muted-foreground" : "text-card-foreground"}`}>
                    {task.task_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {task.category && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${categoryColor[task.category] ?? "bg-gray-100 text-gray-600"}`}>
                        {task.category}
                      </span>
                    )}
                    {task.due_date && (
                      <span className="text-[10px] text-muted-foreground">Due {formatDate(task.due_date)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
