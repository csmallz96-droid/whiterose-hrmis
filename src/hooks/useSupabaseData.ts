import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Branch = Tables<"branches">;
export type Employee = Tables<"employees">;
export type LeaveRequest = Tables<"leave_requests">;

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("branches")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) setBranches(data);
        setLoading(false);
      });
  }, []);

  return { branches, loading };
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("employees")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) setEmployees(data);
        setLoading(false);
      });
  }, []);

  return { employees, loading };
}

export function useLeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("leave_requests")
      .select("*")
      .order("applied_on", { ascending: false })
      .then(({ data }) => {
        if (data) setLeaveRequests(data);
        setLoading(false);
      });
  }, []);

  const updateStatus = async (id: string, status: "Approved" | "Rejected", approvedBy: string) => {
    const { error } = await supabase
      .from("leave_requests")
      .update({ status, approved_by: approvedBy })
      .eq("id", id);
    if (!error) {
      setLeaveRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, approved_by: approvedBy } : r))
      );
    }
  };

  return { leaveRequests, loading, updateStatus };
}
