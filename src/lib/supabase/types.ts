export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: "mother" | "doctor"
          full_name: string | null
          phone: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at"> & { created_at?: string }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
      }
      doctors: {
        Row: {
          user_id: string
          invite_code: string
          specialty: string | null
          clinic_name: string | null
        }
        Insert: Database["public"]["Tables"]["doctors"]["Row"]
        Update: Partial<Database["public"]["Tables"]["doctors"]["Row"]>
      }
      pregnancies: {
        Row: {
          id: string
          mother_id: string
          due_date: string
          status: "active" | "delivered" | "ended"
          ended_at: string | null
          linked_doctor_id: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["pregnancies"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["pregnancies"]["Insert"]>
      }
      children: {
        Row: {
          id: string
          mother_id: string
          name: string
          birth_date: string
          gender: string | null
          linked_doctor_id: string | null
          archived_at: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["children"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["children"]["Insert"]>
      }
      checkins: {
        Row: {
          id: string
          mother_id: string
          subject_type: "pregnancy" | "child"
          subject_id: string
          payload: Json
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["checkins"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["checkins"]["Insert"]>
      }
      flags: {
        Row: {
          id: string
          mother_id: string
          checkin_id: string
          subject_type: string
          subject_id: string
          rule_id: string
          severity: "red" | "yellow" | "green"
          message: string
          resolved_at: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["flags"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["flags"]["Insert"]>
      }
      appointments: {
        Row: {
          id: string
          mother_id: string
          doctor_id: string | null
          subject_type: string | null
          subject_id: string | null
          title: string
          scheduled_at: string
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["appointments"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>
      }
    }
  }
}

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Doctor = Database["public"]["Tables"]["doctors"]["Row"]
export type Pregnancy = Database["public"]["Tables"]["pregnancies"]["Row"]
export type Child = Database["public"]["Tables"]["children"]["Row"]
export type Checkin = Database["public"]["Tables"]["checkins"]["Row"]
export type Flag = Database["public"]["Tables"]["flags"]["Row"]
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"]
