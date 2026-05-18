// =============================================================================
// Generated types from the live `carrentdesk-dev` Supabase project.
// Re-generate with:
//   npx supabase gen types typescript --project-id ivvqapgwrqndmiwiwyzg
// or via the Supabase MCP.
//
// Do not edit by hand. If the schema changes, re-run the generator.
// =============================================================================

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
      claim_tokens: {
        Row: {
          company_id: string
          created_at: string
          expires_at: string
          id: string
          sent_at: string | null
          sent_to_email: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          expires_at?: string
          id?: string
          sent_at?: string | null
          sent_to_email?: string | null
          token: string
          used_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          sent_at?: string | null
          sent_to_email?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          city: Database["public"]["Enums"]["city_slug"]
          claimed_at: string | null
          claimed_by_user_id: string | null
          country: Database["public"]["Enums"]["country_code"]
          created_at: string
          description: string | null
          email: string | null
          founded_year: number | null
          id: string
          last_active_at: string | null
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          status: Database["public"]["Enums"]["company_status"]
          updated_at: string
          vehicle_types: string[]
          verified_at: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          city: Database["public"]["Enums"]["city_slug"]
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          country: Database["public"]["Enums"]["country_code"]
          created_at?: string
          description?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          last_active_at?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
          vehicle_types?: string[]
          verified_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          city?: Database["public"]["Enums"]["city_slug"]
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          country?: Database["public"]["Enums"]["country_code"]
          created_at?: string
          description?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          last_active_at?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
          vehicle_types?: string[]
          verified_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          company_id: string
          full_name: string
          phone: string
          email: string | null
          language: "en" | "lv" | "ru" | "other" | null
          address: string | null
          date_of_birth: string | null
          id_number: string | null
          id_expiry: string | null
          driver_license_number: string | null
          driver_license_expiry: string | null
          blacklisted: boolean
          blacklist_reason: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          full_name: string
          phone: string
          email?: string | null
          language?: "en" | "lv" | "ru" | "other" | null
          address?: string | null
          date_of_birth?: string | null
          id_number?: string | null
          id_expiry?: string | null
          driver_license_number?: string | null
          driver_license_expiry?: string | null
          blacklisted?: boolean
          blacklist_reason?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          full_name?: string
          phone?: string
          email?: string | null
          language?: "en" | "lv" | "ru" | "other" | null
          address?: string | null
          date_of_birth?: string | null
          id_number?: string | null
          id_expiry?: string | null
          driver_license_number?: string | null
          driver_license_expiry?: string | null
          blacklisted?: boolean
          blacklist_reason?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      company_amenities: {
        Row: {
          amenity_key: string
          company_id: string
          value: boolean
        }
        Insert: {
          amenity_key: string
          company_id: string
          value?: boolean
        }
        Update: {
          amenity_key?: string
          company_id?: string
          value?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "company_amenities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_fleet_summary: {
        Row: {
          age_range: string | null
          company_id: string
          fleet_count_max: number | null
          fleet_count_min: number | null
          fleet_description: string | null
          fuel_mix: string | null
          transmission_mix: string | null
        }
        Insert: {
          age_range?: string | null
          company_id: string
          fleet_count_max?: number | null
          fleet_count_min?: number | null
          fleet_description?: string | null
          fuel_mix?: string | null
          transmission_mix?: string | null
        }
        Update: {
          age_range?: string | null
          company_id?: string
          fleet_count_max?: number | null
          fleet_count_min?: number | null
          fleet_description?: string | null
          fuel_mix?: string | null
          transmission_mix?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_fleet_summary_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          city: string | null
          company_name: string | null
          contacted_at: string | null
          created_at: string
          email: string
          fleet_bucket:
            | Database["public"]["Enums"]["demo_request_fleet_bucket"]
            | null
          id: string
          ip_hash: string | null
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          source: string
          status: Database["public"]["Enums"]["demo_request_status"]
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          contacted_at?: string | null
          created_at?: string
          email: string
          fleet_bucket?:
            | Database["public"]["Enums"]["demo_request_fleet_bucket"]
            | null
          id?: string
          ip_hash?: string | null
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: string
          status?: Database["public"]["Enums"]["demo_request_status"]
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string | null
          contacted_at?: string | null
          created_at?: string
          email?: string
          fleet_bucket?:
            | Database["public"]["Enums"]["demo_request_fleet_bucket"]
            | null
          id?: string
          ip_hash?: string | null
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string
          status?: Database["public"]["Enums"]["demo_request_status"]
          user_agent?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          category: Database["public"]["Enums"]["vehicle_category"]
          color: string | null
          company_id: string
          created_at: string
          fuel: Database["public"]["Enums"]["vehicle_fuel"] | null
          gov_inspection_date: string | null
          gov_inspection_next: string | null
          id: string
          insurance_number: string | null
          insurance_valid_until: string | null
          make: string
          model: string
          notes: string | null
          odometer_km: number | null
          plate: string
          registration_number: string | null
          seats: number | null
          service_date: string | null
          service_next: string | null
          status: Database["public"]["Enums"]["vehicle_status"]
          updated_at: string
          vin: string | null
          year: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["vehicle_category"]
          color?: string | null
          company_id: string
          created_at?: string
          fuel?: Database["public"]["Enums"]["vehicle_fuel"] | null
          gov_inspection_date?: string | null
          gov_inspection_next?: string | null
          id?: string
          insurance_number?: string | null
          insurance_valid_until?: string | null
          make: string
          model: string
          notes?: string | null
          odometer_km?: number | null
          plate: string
          registration_number?: string | null
          seats?: number | null
          service_date?: string | null
          service_next?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          updated_at?: string
          vin?: string | null
          year: number
        }
        Update: {
          category?: Database["public"]["Enums"]["vehicle_category"]
          color?: string | null
          company_id?: string
          created_at?: string
          fuel?: Database["public"]["Enums"]["vehicle_fuel"] | null
          gov_inspection_date?: string | null
          gov_inspection_next?: string | null
          id?: string
          insurance_number?: string | null
          insurance_valid_until?: string | null
          make?: string
          model?: string
          notes?: string | null
          odometer_km?: number | null
          plate?: string
          registration_number?: string | null
          seats?: number | null
          service_date?: string | null
          service_next?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          updated_at?: string
          vin?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          company_id: string
          created_at: string
          id: string
          is_primary: boolean
          lat: number | null
          lng: number | null
        }
        Insert: {
          address: string
          company_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          lat?: number | null
          lng?: number | null
        }
        Update: {
          address?: string
          company_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          lat?: number | null
          lng?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
      city_slug: "riga" | "tallinn" | "vilnius"
      company_status: "unclaimed" | "claimed" | "verified"
      country_code: "LV" | "EE" | "LT"
      demo_request_fleet_bucket:
        | "fleet_1_10"
        | "fleet_11_30"
        | "fleet_31_100"
        | "fleet_100_plus"
      demo_request_status:
        | "new"
        | "contacted"
        | "qualified"
        | "converted"
        | "rejected"
      vehicle_category:
        | "economy"
        | "compact"
        | "midsize"
        | "suv"
        | "van"
        | "luxury"
        | "other"
      vehicle_fuel: "diesel" | "petrol" | "electric" | "hybrid" | "lpg"
      vehicle_status: "available" | "rented" | "maintenance" | "retired"
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
      city_slug: ["riga", "tallinn", "vilnius"],
      company_status: ["unclaimed", "claimed", "verified"],
      country_code: ["LV", "EE", "LT"],
      demo_request_fleet_bucket: [
        "fleet_1_10",
        "fleet_11_30",
        "fleet_31_100",
        "fleet_100_plus",
      ],
      demo_request_status: [
        "new",
        "contacted",
        "qualified",
        "converted",
        "rejected",
      ],
    },
  },
} as const
