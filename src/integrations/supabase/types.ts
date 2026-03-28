export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      branches: {
        Row: {
          id: string
          name: string
          sub_location: string | null
          staff_count: number
          region: string
        }
        Insert: {
          id: string
          name: string
          sub_location?: string | null
          staff_count?: number
          region: string
        }
        Update: {
          id?: string
          name?: string
          sub_location?: string | null
          staff_count?: number
          region?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          branch_id: string
          department: string
          job_title: string
          employment_type: string
          basic_salary: number
          house_allowance: number
          transport_allowance: number
          join_date: string
          contract_end: string | null
          national_id: string
          nhif_no: string
          nssf_no: string
          kra_pin: string
          leave_balance: number
          status: string
          mpesa_no: string | null
          bank_name: string | null
          bank_account: string | null
          next_of_kin_name: string | null
          next_of_kin_phone: string | null
          avatar_url: string | null
          role: string
        }
        Insert: {
          id: string
          name: string
          email: string
          phone: string
          branch_id: string
          department: string
          job_title: string
          employment_type: string
          basic_salary: number
          house_allowance?: number
          transport_allowance?: number
          join_date: string
          contract_end?: string | null
          national_id: string
          nhif_no: string
          nssf_no: string
          kra_pin: string
          leave_balance?: number
          status?: string
          mpesa_no?: string | null
          bank_name?: string | null
          bank_account?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          avatar_url?: string | null
          role?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          branch_id?: string
          department?: string
          job_title?: string
          employment_type?: string
          basic_salary?: number
          house_allowance?: number
          transport_allowance?: number
          join_date?: string
          contract_end?: string | null
          national_id?: string
          nhif_no?: string
          nssf_no?: string
          kra_pin?: string
          leave_balance?: number
          status?: string
          mpesa_no?: string | null
          bank_name?: string | null
          bank_account?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          avatar_url?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            referencedRelation: "branches"
            referencedColumns: ["id"]
          }
        ]
      }
      leave_requests: {
        Row: {
          id: string
          employee_id: string
          type: string
          start_date: string
          end_date: string
          days: number
          reason: string
          status: string
          applied_on: string
          approved_by: string | null
        }
        Insert: {
          id: string
          employee_id: string
          type: string
          start_date: string
          end_date: string
          days: number
          reason: string
          status?: string
          applied_on: string
          approved_by?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          type?: string
          start_date?: string
          end_date?: string
          days?: number
          reason?: string
          status?: string
          applied_on?: string
          approved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      payroll_runs: {
        Row: {
          id: string
          period_month: number
          period_year: number
          status: string
          approved_by: string | null
          approved_at: string | null
          total_gross: number
          total_net: number
          total_paye: number
          total_nssf: number
          total_sha: number
          total_ahl: number
          total_nita: number
          created_at: string
        }
        Insert: {
          id?: string
          period_month: number
          period_year: number
          status?: string
          approved_by?: string | null
          approved_at?: string | null
          total_gross?: number
          total_net?: number
          total_paye?: number
          total_nssf?: number
          total_sha?: number
          total_ahl?: number
          total_nita?: number
          created_at?: string
        }
        Update: {
          id?: string
          period_month?: number
          period_year?: number
          status?: string
          approved_by?: string | null
          approved_at?: string | null
          total_gross?: number
          total_net?: number
          total_paye?: number
          total_nssf?: number
          total_sha?: number
          total_ahl?: number
          total_nita?: number
        }
        Relationships: []
      }
      payslips: {
        Row: {
          id: string
          payroll_run_id: string | null
          employee_id: string
          period_month: number
          period_year: number
          gross_salary: number
          basic_salary: number
          house_allowance: number
          transport_allowance: number
          paye: number
          nssf: number
          sha: number
          ahl: number
          nita: number
          other_deductions: number
          net_salary: number
          created_at: string
        }
        Insert: {
          id?: string
          payroll_run_id?: string | null
          employee_id: string
          period_month: number
          period_year: number
          gross_salary?: number
          basic_salary?: number
          house_allowance?: number
          transport_allowance?: number
          paye?: number
          nssf?: number
          sha?: number
          ahl?: number
          nita?: number
          other_deductions?: number
          net_salary?: number
          created_at?: string
        }
        Update: {
          id?: string
          payroll_run_id?: string | null
          employee_id?: string
          period_month?: number
          period_year?: number
          gross_salary?: number
          basic_salary?: number
          house_allowance?: number
          transport_allowance?: number
          paye?: number
          nssf?: number
          sha?: number
          ahl?: number
          nita?: number
          other_deductions?: number
          net_salary?: number
        }
        Relationships: [
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      contracts: {
        Row: {
          id: string
          employee_id: string
          contract_type: string
          start_date: string
          end_date: string | null
          probation_end_date: string | null
          position: string | null
          department: string | null
          salary: number | null
          signed_by_employee: boolean
          signed_at: string | null
          status: string
          document_url: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          contract_type: string
          start_date: string
          end_date?: string | null
          probation_end_date?: string | null
          position?: string | null
          department?: string | null
          salary?: number | null
          signed_by_employee?: boolean
          signed_at?: string | null
          status?: string
          document_url?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          contract_type?: string
          start_date?: string
          end_date?: string | null
          probation_end_date?: string | null
          position?: string | null
          department?: string | null
          salary?: number | null
          signed_by_employee?: boolean
          signed_at?: string | null
          status?: string
          document_url?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      appraisals: {
        Row: {
          id: string
          employee_id: string
          appraiser_id: string | null
          period: string
          appraisal_type: string
          status: string
          self_score: number | null
          manager_score: number | null
          final_score: number | null
          rating: string | null
          comments: string | null
          objectives: Json
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          appraiser_id?: string | null
          period: string
          appraisal_type?: string
          status?: string
          self_score?: number | null
          manager_score?: number | null
          final_score?: number | null
          rating?: string | null
          comments?: string | null
          objectives?: Json
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          appraiser_id?: string | null
          period?: string
          appraisal_type?: string
          status?: string
          self_score?: number | null
          manager_score?: number | null
          final_score?: number | null
          rating?: string | null
          comments?: string | null
          objectives?: Json
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          employee_id: string
          category: string
          amount: number
          description: string | null
          receipt_url: string | null
          expense_date: string
          status: string
          approved_by: string | null
          approved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          category: string
          amount: number
          description?: string | null
          receipt_url?: string | null
          expense_date: string
          status?: string
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          category?: string
          amount?: number
          description?: string | null
          receipt_url?: string | null
          expense_date?: string
          status?: string
          approved_by?: string | null
          approved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      onboarding_tasks: {
        Row: {
          id: string
          employee_id: string
          task_name: string
          category: string | null
          is_completed: boolean
          completed_at: string | null
          due_date: string | null
          assigned_to: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          task_name: string
          category?: string | null
          is_completed?: boolean
          completed_at?: string | null
          due_date?: string | null
          assigned_to?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          task_name?: string
          category?: string | null
          is_completed?: boolean
          completed_at?: string | null
          due_date?: string | null
          assigned_to?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          employee_id: string
          title: string
          message: string
          type: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          title: string
          message: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          title?: string
          message?: string
          type?: string
          is_read?: boolean
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          employee_id: string | null
          role: string
          created_at: string
        }
        Insert: {
          id: string
          employee_id?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DefaultSchemaTableNameOrOptions["schema"] extends keyof DatabaseWithoutInternals
      ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]
      : never)[TableName] extends { Row: infer R }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U }
    ? U
    : never
  : never
