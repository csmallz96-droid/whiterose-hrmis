import { calculatePayroll } from "@/data/mockData";
import type { Employee } from "@/hooks/useSupabaseData";

interface Props {
  employee: Employee;
  branchName: string;
  period: string;
}

function numberToWords(n: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
    "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const convert = (num: number): string => {
    if (num === 0) return "";
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + convert(num % 100) : "");
    if (num < 1000000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + convert(num % 1000) : "");
    return convert(Math.floor(num / 1000000)) + " Million" + (num % 1000000 ? " " + convert(num % 1000000) : "");
  };
  const whole = Math.floor(n);
  const cents = Math.round((n - whole) * 100);
  let result = convert(whole) + " Shillings";
  if (cents > 0) result += " and " + convert(cents) + " Cents";
  return result + " Only";
}

export default function PayslipPrintTemplate({ employee, branchName, period }: Props) {
  const p = calculatePayroll(employee);
  const today = new Date().toLocaleDateString("en-KE", { day: "2-digit", month: "long", year: "numeric" });

  const s: Record<string, React.CSSProperties> = {
    page: { fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12, color: "#1a1a1a", backgroundColor: "#fff", padding: "0", margin: "0", width: "100%" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #2B3990", paddingBottom: 12, marginBottom: 14 },
    logo: { width: 72, height: "auto", borderRadius: 4 },
    companyName: { fontWeight: "bold", color: "#2B3990", fontSize: 15, margin: "0 0 2px 0" },
    companyMeta: { fontSize: 10, color: "#555", margin: "1px 0" },
    payslipTitle: { textAlign: "right" as const },
    payslipH: { fontWeight: "bold", color: "#2B3990", fontSize: 20, margin: "0 0 4px 0" },
    payslipPeriod: { fontSize: 11, color: "#555" },
    empBox: { backgroundColor: "#E8EBF5", borderRadius: 4, padding: "10px 14px", marginBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px" },
    empRow: { display: "flex", gap: 6, fontSize: 11, marginBottom: 3 },
    empLabel: { color: "#555", minWidth: 110 },
    empValue: { fontWeight: "bold", color: "#1a1a1a" },
    tableWrap: { marginBottom: 14 },
    tableTitle: { fontWeight: "bold", fontSize: 11, color: "#fff", backgroundColor: "#2B3990", padding: "5px 10px", borderRadius: "3px 3px 0 0" },
    table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 11 },
    th: { backgroundColor: "#2B3990", color: "#fff", padding: "5px 10px", textAlign: "left" as const, fontWeight: "bold" },
    thR: { backgroundColor: "#2B3990", color: "#fff", padding: "5px 10px", textAlign: "right" as const, fontWeight: "bold" },
    td: { padding: "5px 10px", borderBottom: "1px solid #e5e7eb" },
    tdR: { padding: "5px 10px", borderBottom: "1px solid #e5e7eb", textAlign: "right" as const },
    tdTotal: { padding: "5px 10px", fontWeight: "bold", color: "#2B3990", borderTop: "2px solid #2B3990" },
    tdTotalR: { padding: "5px 10px", fontWeight: "bold", color: "#2B3990", borderTop: "2px solid #2B3990", textAlign: "right" as const },
    netBox: { backgroundColor: "#2B3990", color: "#fff", borderRadius: 4, padding: "12px 20px", textAlign: "center" as const, marginBottom: 10 },
    netLabel: { fontSize: 11, marginBottom: 4 },
    netAmount: { fontWeight: "bold", fontSize: 18, margin: "0 0 4px 0" },
    netWords: { fontSize: 10, opacity: 0.85, fontStyle: "italic" },
    leaveBox: { border: "1px solid #e5e7eb", borderRadius: 4, padding: "6px 12px", fontSize: 10, color: "#555", marginBottom: 10 },
    footer: { borderTop: "2px solid #C8960C", paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 9, color: "#777" },
    footerCenter: { textAlign: "center" as const, fontSize: 9, color: "#999", fontStyle: "italic", marginTop: 4 },
  };

  const fmt = (v: number) => `KES ${v.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <img src="/logo.jpeg" alt="Whiterose" style={s.logo} />
          <div>
            <p style={s.companyName}>WHITEROSE VENYOU ENTERPRISES LIMITED</p>
            <p style={s.companyMeta}>P.O Box 514-80401, Mombasa, Kenya</p>
            <p style={s.companyMeta}>NSSF Employer No: 2446614X &nbsp;|&nbsp; Tel: +254 701 016 666</p>
          </div>
        </div>
        <div style={s.payslipTitle}>
          <p style={s.payslipH}>PAYSLIP</p>
          <p style={s.payslipPeriod}>Pay Period: {period}</p>
        </div>
      </div>

      {/* Employee Details */}
      <div style={s.empBox}>
        {[
          ["Employee Name", employee.name],
          ["Job Title", employee.job_title],
          ["Employee ID", employee.id],
          ["Employment Type", employee.employment_type],
          ["Department", employee.department],
          ["KRA PIN", employee.kra_pin],
          ["Branch", branchName],
          ["NSSF No.", employee.nssf_no],
        ].map(([label, val]) => (
          <div key={label} style={s.empRow}>
            <span style={s.empLabel}>{label}:</span>
            <span style={s.empValue}>{val ?? "—"}</span>
          </div>
        ))}
      </div>

      {/* Earnings & Deductions side-by-side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Earnings */}
        <div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Earnings</th>
                <th style={s.thR}>Amount (KES)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Basic Salary", employee.basic_salary],
                ["House Allowance", employee.house_allowance],
                ["Transport Allowance", employee.transport_allowance],
              ].map(([label, val]) => (
                <tr key={label as string}>
                  <td style={s.td}>{label}</td>
                  <td style={s.tdR}>{fmt(val as number)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={s.tdTotal}>GROSS PAY</td>
                <td style={s.tdTotalR}>{fmt(p.gross)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Deductions */}
        <div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Deductions</th>
                <th style={{ ...s.thR, width: 36 }}>Rate</th>
                <th style={s.thR}>Amount (KES)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["PAYE (Income Tax)", "KRA bands", fmt(p.paye)],
                ["NSSF Contribution", "Tiered 6%", fmt(p.nssf.employee)],
                ["SHA Contribution", "2.75%", fmt(p.sha)],
                ["Affordable Housing Levy", "1.5%", fmt(p.ahl.employee)],
                ["NITA Levy", "Statutory", fmt(p.nita.employee)],
              ].map(([label, rate, val]) => (
                <tr key={label as string}>
                  <td style={s.td}>{label}</td>
                  <td style={{ ...s.tdR, fontSize: 9, color: "#888" }}>{rate}</td>
                  <td style={s.tdR}>{val}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={s.tdTotal} colSpan={2}>TOTAL DEDUCTIONS</td>
                <td style={s.tdTotalR}>{fmt(p.totalDeductions)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Net Pay */}
      <div style={s.netBox}>
        <p style={s.netLabel}>NET PAY</p>
        <p style={s.netAmount}>{fmt(p.netPay)}</p>
        <p style={s.netWords}>Amount in words: {numberToWords(p.netPay)}</p>
      </div>

      {/* Leave Balance */}
      <div style={s.leaveBox}>
        Leave Balance: <strong>{employee.leave_balance} days</strong> remaining of 21 days annual entitlement
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <span>This payslip is computer generated and valid without signature.</span>
        <span>Generated by Whiterose HRMIS on {today}</span>
      </div>
      <div style={s.footerCenter}>
        Whiterose Venyou Enterprises Limited — Confidential
      </div>
    </div>
  );
}
