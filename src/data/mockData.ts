// Whiterose HRMIS — Payroll calculation functions
// Data is now served from Supabase. This file only contains calculation logic.

import type { Employee } from "@/hooks/useSupabaseData";
export type { Employee };

// Kenyan PAYE Tax Bands (Monthly) — Finance Act 2023/2024
// Cumulative band calculation with KES 2,400 personal relief
export function calculatePAYE(taxableIncome: number): number {
  let tax = 0;
  if (taxableIncome <= 24000) {
    tax = taxableIncome * 0.10;
  } else if (taxableIncome <= 32333) {
    tax = 2400 + (taxableIncome - 24000) * 0.25;
  } else if (taxableIncome <= 500000) {
    tax = 4483.25 + (taxableIncome - 32333) * 0.30;
  } else if (taxableIncome <= 800000) {
    tax = 144483.25 + (taxableIncome - 500000) * 0.325;
  } else {
    tax = 241983.25 + (taxableIncome - 800000) * 0.35;
  }
  return Math.max(0, tax - 2400);
}

// NSSF: Tiered — Tier I: 6% of first 7,000 (capped KES 420); Tier II: 6% of 7,001–18,000 (capped KES 660); total max KES 1,080
export function calculateNSSF(grossSalary: number): { employee: number; employer: number } {
  const tier1 = Math.min(grossSalary, 7000) * 0.06;         // max 420
  const tier2 = Math.max(0, Math.min(grossSalary, 18000) - 7000) * 0.06; // max 660
  const contribution = tier1 + tier2;                        // max 1,080
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
