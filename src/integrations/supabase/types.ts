export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          created_at: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          id: string
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          id?: string
          month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          id?: string
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          account_id: string
          closing_day: number
          created_at: string
          deleted: boolean
          due_day: number
          id: string
          is_default: boolean
          limit_amount: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          closing_day: number
          created_at?: string
          deleted?: boolean
          due_day: number
          id?: string
          is_default?: boolean
          limit_amount?: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          closing_day?: number
          created_at?: string
          deleted?: boolean
          due_day?: number
          id?: string
          is_default?: boolean
          limit_amount?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          group_name: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_name?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_name?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      gamification: {
        Row: {
          created_at: string
          id: string
          level: number
          updated_at: string
          user_id: string
          xp: number
          xp_to_next_level: number
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          updated_at?: string
          user_id: string
          xp?: number
          xp_to_next_level?: number
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          updated_at?: string
          user_id?: string
          xp?: number
          xp_to_next_level?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          current_amount: number
          id: string
          name: string
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          id?: string
          name: string
          target_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          id?: string
          name?: string
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      installments: {
        Row: {
          amount: number
          created_at: string
          id: string
          installment_number: number
          paid: boolean
          paid_amount: number | null
          payment_date: string | null
          posting_date: string
          transaction_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          installment_number: number
          paid?: boolean
          paid_amount?: number | null
          payment_date?: string | null
          posting_date: string
          transaction_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          installment_number?: number
          paid?: boolean
          paid_amount?: number | null
          payment_date?: string | null
          posting_date?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_tracking: {
        Row: {
          created_at: string
          id: string
          reference_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reference_id: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reference_id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_items: {
        Row: {
          account_id: string
          amount: number
          card_id: string | null
          category_id: string | null
          created_at: string
          day: number
          description: string
          enabled: boolean
          id: string
          is_income: boolean
          last_run: string | null
          next_run: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          day: number
          description: string
          enabled?: boolean
          id?: string
          is_income?: boolean
          last_run?: string | null
          next_run: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          day?: number
          description?: string
          enabled?: boolean
          id?: string
          is_income?: boolean
          last_run?: string | null
          next_run?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string
          date: string
          description: string
          id: string
          time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description: string
          id?: string
          time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          id?: string
          time?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires: string | null
          id: string
          member_slots: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires?: string | null
          id?: string
          member_slots?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires?: string | null
          id?: string
          member_slots?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          card_id: string | null
          category_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          installments: number
          is_income: boolean
          paid: boolean
          person: string | null
          recurring_source_id: string | null
          reminder_days_before: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          date: string
          description: string
          id?: string
          installments?: number
          is_income?: boolean
          paid?: boolean
          person?: string | null
          recurring_source_id?: string | null
          reminder_days_before?: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          installments?: number
          is_income?: boolean
          paid?: boolean
          person?: string | null
          recurring_source_id?: string | null
          reminder_days_before?: number | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          amount: number
          created_at: string
          date: string
          from_account: string
          id: string
          to_account: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          from_account: string
          id?: string
          to_account: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          from_account?: string
          id?: string
          to_account?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_from_account_fkey"
            columns: ["from_account"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_account_fkey"
            columns: ["to_account"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      yara_usage: {
        Row: {
          count: number
          created_at: string
          id: string
          last_reset: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          last_reset?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          last_reset?: string
          updated_at?: string
          user_id?: string
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
      subscription_plan: "free" | "premium" | "family"
      transaction_type: "cash" | "card" | "prazo"
      user_role: "owner" | "member"
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
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
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
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
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
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      subscription_plan: ["free", "premium", "family"],
      transaction_type: ["cash", "card", "prazo"],
      user_role: ["owner", "member"],
    },
  },
} as const
