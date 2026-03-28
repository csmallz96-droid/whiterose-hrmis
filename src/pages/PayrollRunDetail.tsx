import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useBranches, useEmployees } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { downloadPayrollReport, type PayrollReportEmployee } from "@/utils/downloadPayrollReport";

function periodLabel(periodMonth: number, periodYear: number) {
  return new Date(periodYear, periodMonth - 1, 1).toLocaleDateString("en-KE", { month: "long", year: "numeric" });
}

export default function PayrollRunDetail() {
  const { payrollRunId } = useParams();
  const { employees } = useEmployees();
  const { branches } = useBranches();

  const { data: run, isLoading } = useQuery({
    queryKey: ["payroll-run", payrollRunId],
    queryFn: async () => {
      const { data, error } = await supabase.from("payroll_runs").select("*").eq("id", payrollRunId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!payrollRunId,
  });

  const { data: slips } = useQuery({
    queryKey: ["payroll-slips", payrollRunId],
    queryFn: async () => {
      const { data, error } = await supabase.from("payslips").select("*").eq("payroll_run_id", payrollRunId).order("employee_id");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!payrollRunId,
  });

  const reportEmployees = useMemo<PayrollReportEmployee[]>(() => {
    return (slips ?? []).map((slip) => {
      const employee = employees.find((item) => item.id === slip.employee_id);
      const branch = branches.find((item) => item.id === employee?.branch_id)?.name ?? "-";
      return {
        id: slip.employee_id,
        name: employee?.name ?? slip.employee_id,
        branch,
        gross: slip.gross_salary,
        paye: slip.paye,
        nssf: slip.nssf,
        sha: slip.sha,
        ahl: slip.ahl,
        nita: slip.nita,
        net: slip.net_salary,
      };
    });
  }, [branches, employees, slips]);

  if (isLoading || !run) {
    return <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">Loading payroll report...</div>;
  }

  const label = periodLabel(run.period_month, run.period_year);

  const downloadPdf = () => {
    downloadPayrollReport(label, {
      gross: run.total_gross,
      paye: run.total_paye,
      nssf: run.total_nssf,
      sha: run.total_sha,
      ahl: run.total_ahl,
      nita: run.total_nita,
      net: run.total_net,
    }, reportEmployees);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Payroll Report - {label}</h1>
            <Badge className="capitalize bg-green-100 text-green-800 border-0">{run.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Whiterose Venyou Enterprises Limited | NSSF: 2446614X</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/payroll">Back to Payroll</Link>
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button onClick={downloadPdf}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ["Gross Pay", run.total_gross],
          ["PAYE", run.total_paye],
          ["NSSF", run.total_nssf],
          ["Net Pay", run.total_net],
        ].map(([title, value]) => (
          <div key={title as string} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-lg font-bold text-card-foreground">{formatCurrency(value as number)}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {['Employee', 'Branch', 'Gross', 'PAYE', 'NSSF', 'SHA', 'AHL', 'NITA', 'Net'].map((header) => (
                <th key={header} className={`px-4 py-3 font-medium text-muted-foreground ${header === 'Employee' || header === 'Branch' ? 'text-left' : 'text-right'}`}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportEmployees.map((employee) => (
              <tr key={employee.id} className="border-b border-border/50">
                <td className="px-4 py-3 font-medium text-card-foreground">{employee.name}</td>
                <td className="px-4 py-3 text-card-foreground">{employee.branch}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(employee.gross)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(employee.paye)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(employee.nssf)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(employee.sha)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(employee.ahl)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(employee.nita)}</td>
                <td className="px-4 py-3 text-right font-semibold text-primary">{formatCurrency(employee.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
