// Whiterose HRMIS — Payroll calculation functions
// Data is now served from Supabase. This file only contains calculation logic.

import type { Employee } from "@/hooks/useSupabaseData";
export type { Employee };

// Kenyan PAYE Tax Bands (Monthly) — Finance Act 2023/2024
// Bands: 10% on first 24,000 | 25% on next 8,333 | 30% on next 467,667 | 32.5% on next 300,000 | 35% above
export function calculatePAYE(grossIncome: number): number {
  const bands = [
    { limit: 24000, rate: 0.10 },
    { limit: 8333, rate: 0.25 },
    { limit: 467667, rate: 0.30 },
    { limit: 300000, rate: 0.325 },
    { limit: Infinity, rate: 0.35 },
  ];
  let tax = 0;
  let remaining = grossIncome;
  for (const band of bands) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, band.limit);
    tax += taxable * band.rate;
    remaining -= taxable;
  }
  const personalRelief = 2400;
  return Math.max(0, tax - personalRelief);
}

// NSSF: 6% of gross, employee portion capped at KES 1,080
export function calculateNSSF(grossSalary: number): { employee: number; employer: number } {
  const contribution = Math.min(grossSalary * 0.06, 1080);
  return { employee: contribution, employer: contribution };
}

// SHA (Social Health Authority): 2.75% of gross
export function calculateSHA(grossSalary: number): number {
  return grossSalary * 0.0275;
}

// Affordable Housing Levy: 1.5% of gross (employee + employer each)
export function calculateAHL(grossSalary: number): { employee: number; employer: number } {
  return { employee: grossSalary * 0.015, employer: grossSalary * 0.015 };
}

// NITA: flat KES 50 per employee per month
export function calculateNITA(): { employee: number; employer: number } {
  return { employee: 50, employer: 50 };
}

export function calculatePayroll(emp: Employee) {
  const gross = emp.basic_salary + emp.house_allowance + emp.transport_allowance;
  const nssf = calculateNSSF(gross);
  const sha = calculateSHA(gross);
  const ahl = calculateAHL(gross);
  const nita = calculateNITA();
  // PAYE is calculated on gross salary directly (not gross minus NSSF)
  const paye = calculatePAYE(gross);
  const totalDeductions = paye + nssf.employee + sha + ahl.employee + nita.employee;
  const netPay = gross - totalDeductions;

  return { gross, paye, nssf, sha, ahl, nita, totalDeductions, netPay };
}
