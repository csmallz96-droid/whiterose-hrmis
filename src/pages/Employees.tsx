import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { useBranches, useEmployees } from "@/hooks/useSupabaseData";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Employees() {
  const { branches } = useBranches();
  const { employees, loading } = useEmployees();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

  const filtered = employees.filter((emp) => {
    const matchSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || emp.id.toLowerCase().includes(search.toLowerCase());
    const matchBranch = branchFilter === "all" || emp.branch_id === branchFilter;
    return matchSearch && matchBranch;
  });

  const statusColor = (status: string) => {
    if (status === "Active") return "bg-primary/10 text-primary border-primary/20";
    if (status === "On Leave") return "bg-warning/10 text-warning border-warning/20";
    return "bg-destructive/10 text-destructive border-destructive/20";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Employee Directory</h1>
        <p className="text-sm text-muted-foreground">{employees.length} employees across {branches.length} branches</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or ID..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}{b.sub_location ? ` - ${b.sub_location}` : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading employees…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Branch</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Job Title</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Basic Salary</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const branch = branches.find((b) => b.id === emp.branch_id);
                return (
                  <tr key={emp.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{emp.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-card-foreground">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.email}</p>
                    </td>
                    <td className="px-4 py-3 text-card-foreground">{branch?.name}{branch?.sub_location ? ` (${branch.sub_location})` : ""}</td>
                    <td className="px-4 py-3 text-card-foreground">{emp.job_title}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">{emp.employment_type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(emp.status)}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-card-foreground">KES {emp.basic_salary.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
