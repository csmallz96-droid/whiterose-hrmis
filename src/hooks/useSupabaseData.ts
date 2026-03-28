import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Branch = Tables<"branches">;
export type Employee = Tables<"employees">;
export type LeaveRequest = Tables<"leave_requests">;

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("branches")
        .select("*")
        .order("name");
      if (err) throw err;
      setBranches(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  return { branches, loading, error, refetch: fetchBranches };
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("employees")
        .select("*")
        .order("name");
      if (err) throw err;
      setEmployees(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const addEmployee = async (emp: TablesInsert<"employees">): Promise<{ error: string | null }> => {
    try {
      const { error: err } = await supabase.from("employees").insert(emp);
      if (err) throw err;
      await fetchEmployees();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to add employee" };
    }
  };

  const updateEmployee = async (id: string, updates: TablesUpdate<"employees">): Promise<{ error: string | null }> => {
    try {
      const { error: err } = await supabase.from("employees").update(updates).eq("id", id);
      if (err) throw err;
      setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to update employee" };
    }
  };

  return { employees, loading, error, refetch: fetchEmployees, addEmployee, updateEmployee };
}

export function useLeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaveRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("leave_requests")
        .select("*")
        .order("applied_on", { ascending: false });
      if (err) throw err;
      setLeaveRequests(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeaveRequests(); }, [fetchLeaveRequests]);

  const updateStatus = async (
    id: string,
    status: "Approved" | "Rejected",
    approvedBy: string
  ): Promise<{ error: string | null }> => {
    try {
      const { error: err } = await supabase
        .from("leave_requests")
        .update({ status, approved_by: approvedBy })
        .eq("id", id);
      if (err) throw err;
      setLeaveRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, approved_by: approvedBy } : r))
      );
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to update status" };
    }
  };

  const addLeaveRequest = async (
    req: Omit<TablesInsert<"leave_requests">, "id">
  ): Promise<{ error: string | null }> => {
    try {
      const id = `LR${Date.now()}`;
      const { error: err } = await supabase
        .from("leave_requests")
        .insert({ ...req, id });
      if (err) throw err;
      await fetchLeaveRequests();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to submit leave request" };
    }
  };

  return { leaveRequests, loading, error, refetch: fetchLeaveRequests, updateStatus, addLeaveRequest };
}
