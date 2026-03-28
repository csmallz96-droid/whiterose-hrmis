import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBranches, useEmployees } from "@/hooks/useSupabaseData";
import { calculatePayroll } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, Printer, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { formatCurrency } from "@/lib/utils";
import { downloadPayslipPDF, printPayslip } from "@/utils/downloadPayslipPDF";


type Payslip = Tables<"payslips">;
type Employee = Tables<"employees">;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getPeriodLabel(periodMonth: number, periodYear: number) {
  return `${MONTHS[periodMonth - 1]} ${periodYear}`;
}

export default function Payslips() {
  const { employees } = useEmployees();
  const { branches } = useBranches();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [selected, setSelected] = useState<Payslip | null>(null);

  useEffect(() => {
    supabase
      .from("payslips")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPayslips(data ?? []);
        setLoading(false);
      });
  }, []);

  const displayPayslips = payslips.length > 0
    ? payslips
    : employees.map((emp) => {
        const p = calculatePayroll(emp);
        return {
          id: emp.id,
          payroll_run_id: null,
          employee_id: emp.id,
          period_month: 3,
          period_year: 2026,
          gross_salary: p.gross,
          basic_salary: emp.basic_salary,
          house_allowance: emp.house_allowance,
          transport_allowance: emp.transport_allowance,
          paye: p.paye,
          nssf: p.nssf.employee,
          sha: p.sha,
          ahl: p.ahl.employee,
          nita: p.nita.employee,
          other_deductions: 0,
          net_salary: p.netPay,
          created_at: new Date().toISOString(),
        } as Payslip;
      });

  const filtered = displayPayslips.filter((slip) => {
    const employee = employees.find((emp) => emp.id === slip.employee_id);
    const branch = branches.find((item) => item.id === employee?.branch_id);
    const searchTerm = search.trim().toLowerCase();

    const matchesSearch = !searchTerm
      || employee?.name.toLowerCase().includes(searchTerm)
      || slip.employee_id.toLowerCase().includes(searchTerm)
      || employee?.job_title.toLowerCase().includes(searchTerm);
    const matchesBranch = branchFilter === "all" || branch?.id === branchFilter;
    const matchesMonth = monthFilter === "all" || `${slip.period_month}-${slip.period_year}` === monthFilter;

    return !!matchesSearch && matchesBranch && matchesMonth;
  });

  const selectedEmployee = selected ? employees.find((emp) => emp.id === selected.employee_id) : null;
  const selectedBranchName = selectedEmployee
    ? branches.find((branch) => branch.id === selectedEmployee.branch_id)?.name ?? "-"
    : "-";
  const selectedPeriod = selected ? getPeriodLabel(selected.period_month, selected.period_year) : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payslips</h1>
        <p className="text-sm text-muted-foreground">View, print, and export branded employee payslips</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search employee..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Branches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Months" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            <SelectItem value="3-2026">Mar 2026</SelectItem>
            <SelectItem value="2-2026">Feb 2026</SelectItem>
            <SelectItem value="1-2026">Jan 2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="h-12 border-b border-border/50 bg-muted/30" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">No payslips found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Branch</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Period</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Gross</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net Pay</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((slip) => {
                const employee = employees.find((emp) => emp.id === slip.employee_id);
                const branchName = branches.find((branch) => branch.id === employee?.branch_id)?.name ?? "-";
                const period = getPeriodLabel(slip.period_month, slip.period_year);

                return (
                  <tr key={slip.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-card-foreground">{employee?.name ?? slip.employee_id}</p>
                      <p className="text-xs text-muted-foreground">{employee?.job_title ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-card-foreground">{branchName}</td>
                    <td className="px-4 py-3 text-card-foreground">{period}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(slip.gross_salary)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">{formatCurrency(slip.net_salary)}</td>
                    <td className="px-4 py-3">
                      {employee && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => setSelected(slip)}>
                            <FileText className="h-3.5 w-3.5 mr-1" /> View
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => printPayslip(employee, branchName, period)}>
                            <Printer className="h-3.5 w-3.5 mr-1" /> Print
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => downloadPayslipPDF(employee, branchName, period)}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
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
          <DialogHeader>
            <DialogTitle>Payslip Actions</DialogTitle>
          </DialogHeader>
          {selected && selectedEmployee && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-card-foreground">{selectedEmployee.name}</p>
                <p className="text-xs text-muted-foreground">{selectedBranchName} | {selectedPeriod}</p>
                <p className="mt-2 text-sm text-card-foreground">Net Pay: <span className="font-semibold text-primary">{formatCurrency(selected.net_salary)}</span></p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => printPayslip(selectedEmployee, selectedBranchName, selectedPeriod)}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
                <Button onClick={() => downloadPayslipPDF(selectedEmployee, selectedBranchName, selectedPeriod)}>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
