import { useState } from "react";
import { useBranches, useEmployees } from "@/hooks/useSupabaseData";
import { calculatePayroll } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, FileText, CheckCircle } from "lucide-react";
import StatCard from "@/components/StatCard";

export default function Payroll() {
  const { branches } = useBranches();
  const { employees, loading } = useEmployees();
  const [branchFilter, setBranchFilter] = useState("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const filtered = branchFilter === "all" ? employees : employees.filter((e) => e.branch_id === branchFilter);

  const totals = filtered.reduce(
    (acc, emp) => {
      const p = calculatePayroll(emp);
      return {
        gross: acc.gross + p.gross,
        paye: acc.paye + p.paye,
        nssf: acc.nssf + p.nssf.employee,
        sha: acc.sha + p.sha,
        ahl: acc.ahl + p.ahl.employee,
        nita: acc.nita + p.nita.employee,
        net: acc.net + p.netPay,
      };
    },
    { gross: 0, paye: 0, nssf: 0, sha: 0, ahl: 0, nita: 0, net: 0 }
  );

  const fmt = (n: number) => `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const selectedEmp = selectedEmployeeId ? employees.find((e) => e.id === selectedEmployeeId) : null;
  const selectedPayroll = selectedEmp ? calculatePayroll(selectedEmp) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payroll</h1>
          <p className="text-sm text-muted-foreground">March 2026 — Monthly Payroll Cycle</p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary">Draft</Badge>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet} title="Gross Payroll" value={fmt(totals.gross)} />
        <StatCard icon={FileText} title="Total Deductions" value={fmt(totals.paye + totals.nssf + totals.sha + totals.ahl + totals.nita)} />
        <StatCard icon={CheckCircle} title="Net Payroll" value={fmt(totals.net)} />
      </div>

      {/* Statutory Summary */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-card-foreground">Statutory Deductions Summary</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "PAYE", value: totals.paye },
            { label: "NSSF", value: totals.nssf },
            { label: "SHA", value: totals.sha },
            { label: "AHL", value: totals.ahl },
            { label: "NITA", value: totals.nita },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-sm font-bold text-card-foreground">{fmt(item.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Table */}
      <div className="flex items-center gap-3">
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading payroll data…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Gross</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">PAYE</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">NSSF</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">SHA</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">AHL</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const p = calculatePayroll(emp);
                return (
                  <tr
                    key={emp.id}
                    className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30"
                    onClick={() => setSelectedEmployeeId(selectedEmployeeId === emp.id ? null : emp.id)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-card-foreground">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.job_title}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-card-foreground">{fmt(p.gross)}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{fmt(p.paye)}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{fmt(p.nssf.employee)}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{fmt(p.sha)}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{fmt(p.ahl.employee)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">{fmt(p.netPay)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee Payslip Detail */}
      {selectedEmp && selectedPayroll && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-card-foreground">Payslip — {selectedEmp.name}</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Earnings</h4>
              <div className="space-y-2">
                {[
                  { label: "Basic Salary", value: selectedEmp.basic_salary },
                  { label: "House Allowance", value: selectedEmp.house_allowance },
                  { label: "Transport Allowance", value: selectedEmp.transport_allowance },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-card-foreground">{fmt(item.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
                  <span className="text-card-foreground">Gross Pay</span>
                  <span className="text-card-foreground">{fmt(selectedPayroll.gross)}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Deductions</h4>
              <div className="space-y-2">
                {[
                  { label: "PAYE", value: selectedPayroll.paye },
                  { label: "NSSF (Employee)", value: selectedPayroll.nssf.employee },
                  { label: "SHA (2.75%)", value: selectedPayroll.sha },
                  { label: "AHL (1.5%)", value: selectedPayroll.ahl.employee },
                  { label: "NITA", value: selectedPayroll.nita.employee },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-destructive">{fmt(item.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
                  <span className="text-card-foreground">Net Pay</span>
                  <span className="text-primary">{fmt(selectedPayroll.netPay)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
