export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string
          role: 'admin' | 'super_admin' | 'nutritionist'
          permissions: string[]
          created_at: string
        }
        Insert: {
          id: string
          role: 'admin' | 'super_admin' | 'nutritionist'
          permissions?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'super_admin' | 'nutritionist'
          permissions?: string[]
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          birth_date: string
          phone: string | null
          is_active: boolean
          created_at: string
          nutritionist_id: string | null
          last_visit: string | null
          next_appointment: string | null
          is_profile_completed: boolean
        }
        Insert: {
          id: string
          full_name: string
          email: string
          birth_date: string
          phone?: string | null
          is_active?: boolean
          created_at?: string
          nutritionist_id?: string | null
          last_visit?: string | null
          next_appointment?: string | null
          is_profile_completed?: boolean
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          birth_date?: string
          phone?: string | null
          is_active?: boolean
          created_at?: string
          nutritionist_id?: string | null
          last_visit?: string | null
          next_appointment?: string | null
          is_profile_completed?: boolean
        }
      }
      meal_plans: {
        Row: {
          id: string
          patient_id: string
          nutritionist_id: string
          title: string
          content: Json
          created_at: string
          updated_at: string
          status: 'draft' | 'published'
        }
        Insert: {
          id?: string
          patient_id: string
          nutritionist_id: string
          title: string
          content: Json
          created_at?: string
          updated_at?: string
          status?: 'draft' | 'published'
        }
        Update: {
          id?: string
          patient_id?: string
          nutritionist_id?: string
          title?: string
          content?: Json
          created_at?: string
          updated_at?: string
          status?: 'draft' | 'published'
        }
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
  }
}
