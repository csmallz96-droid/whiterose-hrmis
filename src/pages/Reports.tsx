import { useState } from "react";
import { useEmployees, useBranches, useLeaveRequests } from "@/hooks/useSupabaseData";
import { calculatePayroll } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { employees } = useEmployees();
  const { branches } = useBranches();
  const { leaveRequests } = useLeaveRequests();
  const [active, setActive] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("3");
  const [selectedYear] = useState("2026");

  // ── 1. Monthly Payroll Summary ──────────────────────────────────────
  const payrollByBranch = branches.map((b) => {
    const emps = employees.filter((e) => e.branch_id === b.id);
    const totals = emps.reduce((acc, e) => {
      const p = calculatePayroll(e);
      return { gross: acc.gross + p.gross, net: acc.net + p.netPay };
    }, { gross: 0, net: 0 });
    return { branch: b.name, headcount: emps.length, ...totals };
  });

  // ── 2. Statutory Returns ────────────────────────────────────────────
  const statutory = employees.reduce((acc, e) => {
    const p = calculatePayroll(e);
    return {
      paye: acc.paye + p.paye,
      nssf_employee: acc.nssf_employee + p.nssf.employee,
      nssf_employer: acc.nssf_employer + p.nssf.employer,
      sha: acc.sha + p.sha,
      ahl: acc.ahl + p.ahl.employee,
      nita: acc.nita + p.nita.employee,
    };
  }, { paye: 0, nssf_employee: 0, nssf_employer: 0, sha: 0, ahl: 0, nita: 0 });

  // ── 3. Leave Utilisation ────────────────────────────────────────────
  const leaveByDept: Record<string, { entitlement: number; taken: number }> = {};
  employees.forEach((e) => {
    if (!leaveByDept[e.department]) leaveByDept[e.department] = { entitlement: 0, taken: 0 };
    leaveByDept[e.department].entitlement += 21;
    leaveByDept[e.department].taken += 21 - e.leave_balance;
  });

  // ── 4. Headcount Report ─────────────────────────────────────────────
  const headcountByBranch = branches.map((b) => {
    const emps = employees.filter((e) => e.branch_id === b.id);
    return {
      branch: b.name,
      total: emps.length,
      permanent: emps.filter((e) => e.employment_type === "Permanent").length,
      contract: emps.filter((e) => e.employment_type === "Contract").length,
      active: emps.filter((e) => e.status === "Active").length,
    };
  });

  // ── 5. Contract Expiry ──────────────────────────────────────────────
  const expiringContracts = employees.filter((e) => {
    if (!e.contract_end) return false;
    const days = Math.ceil((new Date(e.contract_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 90;
  }).map((e) => {
    const branch = branches.find((b) => b.id === e.branch_id);
    const days = Math.ceil((new Date(e.contract_end!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return { ...e, branchName: branch?.name ?? "—", daysLeft: days };
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  // ── 6. P9 Annual Summary ────────────────────────────────────────────
  const p9 = employees.map((e) => {
    const p = calculatePayroll(e);
    return {
      id: e.id, name: e.name, kra_pin: e.kra_pin,
      annual_gross: p.gross * 12, annual_paye: p.paye * 12,
    };
  });

  const REPORTS: { id: string; title: string; desc: string }[] = [
    { id: "payroll", title: "Monthly Payroll Summary", desc: "Total cost by branch for selected month" },
    { id: "statutory", title: "Statutory Returns", desc: "PAYE, NSSF, SHA, AHL, NITA totals for KRA/NSSF" },
    { id: "leave", title: "Leave Utilisation", desc: "Leave taken vs entitlement by department" },
    { id: "headcount", title: "Headcount Report", desc: "Staff count by branch and employment type" },
    { id: "expiry", title: "Contract Expiry Report", desc: "All contracts expiring in next 90 days" },
    { id: "p9", title: "P9 Annual Summary", desc: "Annual PAYE per employee for KRA P9 form" },
  ];

  const handleExport = (id: string) => {
    if (id === "payroll") {
      downloadCSV(
        [["Branch","Headcount","Gross Payroll","Net Payroll"],
          ...payrollByBranch.map((r) => [r.branch, String(r.headcount), r.gross.toFixed(2), r.net.toFixed(2)])],
        `Payroll_Summary_${selectedMonth}_${selectedYear}.csv`
      );
    } else if (id === "statutory") {
      downloadCSV(
        [["Item","Amount"],
          ["PAYE", statutory.paye.toFixed(2)],
          ["NSSF (Employee)", statutory.nssf_employee.toFixed(2)],
          ["NSSF (Employer)", statutory.nssf_employer.toFixed(2)],
          ["SHA", statutory.sha.toFixed(2)],
          ["AHL", statutory.ahl.toFixed(2)],
          ["NITA", statutory.nita.toFixed(2)]],
        `Statutory_Returns_${selectedMonth}_${selectedYear}.csv`
      );
    } else if (id === "leave") {
      downloadCSV(
        [["Department","Entitlement (Days)","Taken (Days)","Remaining (Days)"],
          ...Object.entries(leaveByDept).map(([dept, d]) => [dept, String(d.entitlement), String(d.taken), String(d.entitlement - d.taken)])],
        `Leave_Utilisation_${selectedYear}.csv`
      );
    } else if (id === "headcount") {
      downloadCSV(
        [["Branch","Total","Permanent","Contract","Active"],
          ...headcountByBranch.map((r) => [r.branch, String(r.total), String(r.permanent), String(r.contract), String(r.active)])],
        `Headcount_Report.csv`
      );
    } else if (id === "expiry") {
      downloadCSV(
        [["ID","Name","Branch","Contract End","Days Left"],
          ...expiringContracts.map((e) => [e.id, e.name, e.branchName, formatDate(e.contract_end), String(e.daysLeft)])],
        `Contract_Expiry_Report.csv`
      );
    } else if (id === "p9") {
      downloadCSV(
        [["Employee ID","Name","KRA PIN","Annual Gross","Annual PAYE"],
          ...p9.map((e) => [e.id, e.name, e.kra_pin, e.annual_gross.toFixed(2), e.annual_paye.toFixed(2)])],
        `P9_Annual_Summary_${selectedYear}.csv`
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Generate and export HR reports</p>
      </div>

      <div className="flex items-center gap-3">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
              <SelectItem key={i+1} value={String(i+1)}>{m} {selectedYear}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setActive(active === r.id ? null : r.id)}>
                {active === r.id ? "Hide" : "Generate"}
              </Button>
              <Button size="sm" variant="ghost" className="text-xs px-2" onClick={() => handleExport(r.id)}>
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Report output */}
      {active === "payroll" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              {["Branch","Headcount","Gross Payroll","Net Payroll"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}
            </tr></thead>
            <tbody>
              {payrollByBranch.map((r) => (
                <tr key={r.branch} className="border-b border-border/50">
                  <td className="px-4 py-3 font-medium text-card-foreground">{r.branch}</td>
                  <td className="px-4 py-3 text-card-foreground">{r.headcount}</td>
                  <td className="px-4 py-3 text-card-foreground">{formatCurrency(r.gross)}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{formatCurrency(r.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active === "statutory" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              {["Statutory Item","Employee Amount","Employer Amount"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}
            </tr></thead>
            <tbody>
              {[
                ["PAYE", statutory.paye, "—"],
                ["NSSF", statutory.nssf_employee, statutory.nssf_employer],
                ["SHA (2.75%)", statutory.sha, statutory.sha],
                ["AHL (1.5%)", statutory.ahl, statutory.ahl],
                ["NITA", statutory.nita, statutory.nita],
              ].map(([label, emp, er]) => (
                <tr key={label as string} className="border-b border-border/50">
                  <td className="px-4 py-3 font-medium text-card-foreground">{label}</td>
                  <td className="px-4 py-3 text-card-foreground">{typeof emp === "number" ? formatCurrency(emp) : emp}</td>
                  <td className="px-4 py-3 text-card-foreground">{typeof er === "number" ? formatCurrency(er) : er}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active === "leave" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              {["Department","Entitlement","Taken","Remaining"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}
            </tr></thead>
            <tbody>
              {Object.entries(leaveByDept).map(([dept, d]) => (
                <tr key={dept} className="border-b border-border/50">
                  <td className="px-4 py-3 font-medium text-card-foreground">{dept}</td>
                  <td className="px-4 py-3 text-card-foreground">{d.entitlement} days</td>
                  <td className="px-4 py-3 text-card-foreground">{d.taken} days</td>
                  <td className="px-4 py-3 text-primary font-semibold">{d.entitlement - d.taken} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active === "headcount" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              {["Branch","Total","Permanent","Contract","Active"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}
            </tr></thead>
            <tbody>
              {headcountByBranch.map((r) => (
                <tr key={r.branch} className="border-b border-border/50">
                  <td className="px-4 py-3 font-medium text-card-foreground">{r.branch}</td>
                  <td className="px-4 py-3 text-card-foreground">{r.total}</td>
                  <td className="px-4 py-3 text-card-foreground">{r.permanent}</td>
                  <td className="px-4 py-3 text-card-foreground">{r.contract}</td>
                  <td className="px-4 py-3 text-card-foreground">{r.active}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active === "expiry" && (
        expiringContracts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">No contracts expiring in the next 90 days.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50">
                {["Employee","Branch","Contract End","Days Left"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}
              </tr></thead>
              <tbody>
                {expiringContracts.map((e) => (
                  <tr key={e.id} className="border-b border-border/50">
                    <td className="px-4 py-3 font-medium text-card-foreground">{e.name}</td>
                    <td className="px-4 py-3 text-card-foreground">{e.branchName}</td>
                    <td className="px-4 py-3 text-card-foreground">{formatDate(e.contract_end)}</td>
                    <td className={`px-4 py-3 font-semibold ${e.daysLeft <= 30 ? "text-destructive" : "text-amber-600"}`}>{e.daysLeft} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {active === "p9" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              {["ID","Employee","KRA PIN","Annual Gross","Annual PAYE"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}
            </tr></thead>
            <tbody>
              {p9.map((e) => (
                <tr key={e.id} className="border-b border-border/50">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.id}</td>
                  <td className="px-4 py-3 font-medium text-card-foreground">{e.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-card-foreground">{e.kra_pin}</td>
                  <td className="px-4 py-3 text-card-foreground">{formatCurrency(e.annual_gross)}</td>
                  <td className="px-4 py-3 text-destructive">{formatCurrency(e.annual_paye)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
