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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          department: Database["public"]["Enums"]["gov_department"] | null
          full_name: string | null
          id: string
          onboarded_at: string | null
          phone: string | null
          preferred_language: string
          region_city: string | null
          region_district: string | null
          region_lat: number | null
          region_lng: number | null
          region_municipality: string | null
          region_pincode: string | null
          region_state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          department?: Database["public"]["Enums"]["gov_department"] | null
          full_name?: string | null
          id: string
          onboarded_at?: string | null
          phone?: string | null
          preferred_language?: string
          region_city?: string | null
          region_district?: string | null
          region_lat?: number | null
          region_lng?: number | null
          region_municipality?: string | null
          region_pincode?: string | null
          region_state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          department?: Database["public"]["Enums"]["gov_department"] | null
          full_name?: string | null
          id?: string
          onboarded_at?: string | null
          phone?: string | null
          preferred_language?: string
          region_city?: string | null
          region_district?: string | null
          region_lat?: number | null
          region_lng?: number | null
          region_municipality?: string | null
          region_pincode?: string | null
          region_state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      report_updates: {
        Row: {
          author_id: string
          created_at: string
          id: string
          message: string
          new_status: Database["public"]["Enums"]["report_status"] | null
          report_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          message: string
          new_status?: Database["public"]["Enums"]["report_status"] | null
          report_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          message?: string
          new_status?: Database["public"]["Enums"]["report_status"] | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_updates_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          ai_analysis: Json | null
          ai_confidence: number | null
          assigned_to: string | null
          category: Database["public"]["Enums"]["report_category"]
          created_at: string
          department: Database["public"]["Enums"]["gov_department"]
          description: string | null
          id: string
          latitude: number | null
          location_text: string | null
          longitude: number | null
          media_urls: string[]
          reporter_id: string
          severity: Database["public"]["Enums"]["report_severity"]
          status: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: Json | null
          ai_confidence?: number | null
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          department?: Database["public"]["Enums"]["gov_department"]
          description?: string | null
          id?: string
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          media_urls?: string[]
          reporter_id: string
          severity?: Database["public"]["Enums"]["report_severity"]
          status?: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: Json | null
          ai_confidence?: number | null
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          department?: Database["public"]["Enums"]["gov_department"]
          description?: string | null
          id?: string
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          media_urls?: string[]
          reporter_id?: string
          severity?: Database["public"]["Enums"]["report_severity"]
          status?: Database["public"]["Enums"]["report_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_department: {
        Args: never
        Returns: Database["public"]["Enums"]["gov_department"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "citizen" | "authority" | "admin"
      gov_department:
        | "public_works"
        | "sanitation"
        | "electricity"
        | "water"
        | "transportation"
        | "parks_recreation"
        | "public_safety"
        | "general"
      report_category:
        | "pothole"
        | "garbage"
        | "streetlight"
        | "water_leak"
        | "sewage"
        | "road_damage"
        | "illegal_dumping"
        | "graffiti"
        | "broken_sign"
        | "flooding"
        | "tree_hazard"
        | "other"
      report_severity: "low" | "medium" | "high" | "critical"
      report_status:
        | "pending"
        | "in_review"
        | "assigned"
        | "in_progress"
        | "resolved"
        | "rejected"
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
      app_role: ["citizen", "authority", "admin"],
      gov_department: [
        "public_works",
        "sanitation",
        "electricity",
        "water",
        "transportation",
        "parks_recreation",
        "public_safety",
        "general",
      ],
      report_category: [
        "pothole",
        "garbage",
        "streetlight",
        "water_leak",
        "sewage",
        "road_damage",
        "illegal_dumping",
        "graffiti",
        "broken_sign",
        "flooding",
        "tree_hazard",
        "other",
      ],
      report_severity: ["low", "medium", "high", "critical"],
      report_status: [
        "pending",
        "in_review",
        "assigned",
        "in_progress",
        "resolved",
        "rejected",
      ],
    },
  },
} as const
