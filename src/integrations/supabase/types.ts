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
