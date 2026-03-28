// Whiterose HRMIS — Payroll calculation functions
// Data is now served from Supabase. This file only contains calculation logic.

import type { Employee } from "@/hooks/useSupabaseData";
export type { Employee };

// Kenyan PAYE Tax Bands (Monthly) - 2024/2025
export function calculatePAYE(taxableIncome: number): number {
  const bands = [
    { limit: 24000, rate: 0.10 },
    { limit: 8333, rate: 0.25 },
    { limit: Infinity, rate: 0.30 },
  ];
  let tax = 0;
  let remaining = taxableIncome;
  for (const band of bands) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, band.limit);
    tax += taxable * band.rate;
    remaining -= taxable;
  }
  if (taxableIncome > 500000) {
    tax += (taxableIncome - 500000) * 0.05;
  }
  const personalRelief = 2400;
  return Math.max(0, tax - personalRelief);
}

export function calculateNSSF(pensionablePay: number): { employee: number; employer: number } {
  const tierILimit = 6000;
  const tierIILimit = 18000;
  const tierI = Math.min(pensionablePay, tierILimit) * 0.06;
  const tierII = Math.max(0, Math.min(pensionablePay, tierIILimit) - tierILimit) * 0.06;
  const total = tierI + tierII;
  return { employee: Math.min(total, 1080), employer: Math.min(total, 1080) };
}

export function calculateSHA(grossSalary: number): number {
  return grossSalary * 0.0275;
}

export function calculateAHL(grossSalary: number): { employee: number; employer: number } {
  return { employee: grossSalary * 0.015, employer: grossSalary * 0.015 };
}

export function calculateNITA(): { employee: number; employer: number } {
  return { employee: 50, employer: 50 };
}

export function calculatePayroll(emp: Employee) {
  const gross = emp.basic_salary + emp.house_allowance + emp.transport_allowance;
  const nssf = calculateNSSF(emp.basic_salary);
  const sha = calculateSHA(gross);
  const ahl = calculateAHL(gross);
  const nita = calculateNITA();
  const taxableIncome = gross - nssf.employee;
  const paye = calculatePAYE(taxableIncome);
  const totalDeductions = paye + nssf.employee + sha + ahl.employee + nita.employee;
  const netPay = gross - totalDeductions;

  return { gross, paye, nssf, sha, ahl, nita, totalDeductions, netPay, taxableIncome };
}
