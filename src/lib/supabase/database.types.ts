// =============================================================================
// Generated types from the live `carrentdesk-dev` Supabase project.
// Re-generate with:
//   npx supabase gen types typescript --project-id ivvqapgwrqndmiwiwyzg
// or via the Supabase MCP:
//   mcp call generate_typescript_types
//
// Do not edit by hand. If the schema changes, re-run the generator.
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      claim_tokens: {
        Row: {
          company_id: string;
          created_at: string;
          expires_at: string;
          id: string;
          sent_at: string | null;
          sent_to_email: string | null;
          token: string;
          used_at: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          sent_at?: string | null;
          sent_to_email?: string | null;
          token: string;
          used_at?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          sent_at?: string | null;
          sent_to_email?: string | null;
          token?: string;
          used_at?: string | null;
        };
      };
      companies: {
        Row: {
          city: Database["public"]["Enums"]["city_slug"];
          claimed_at: string | null;
          claimed_by_user_id: string | null;
          country: Database["public"]["Enums"]["country_code"];
          created_at: string;
          description: string | null;
          email: string | null;
          id: string;
          last_active_at: string | null;
          name: string;
          phone: string | null;
          slug: string;
          status: Database["public"]["Enums"]["company_status"];
          updated_at: string;
          verified_at: string | null;
          vehicle_types: string[];
          website: string | null;
          whatsapp: string | null;
        };
        Insert: {
          city: Database["public"]["Enums"]["city_slug"];
          claimed_at?: string | null;
          claimed_by_user_id?: string | null;
          country: Database["public"]["Enums"]["country_code"];
          created_at?: string;
          description?: string | null;
          email?: string | null;
          id?: string;
          last_active_at?: string | null;
          name: string;
          phone?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["company_status"];
          updated_at?: string;
          verified_at?: string | null;
          vehicle_types?: string[];
          website?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          city?: Database["public"]["Enums"]["city_slug"];
          claimed_at?: string | null;
          claimed_by_user_id?: string | null;
          country?: Database["public"]["Enums"]["country_code"];
          created_at?: string;
          description?: string | null;
          email?: string | null;
          id?: string;
          last_active_at?: string | null;
          name?: string;
          phone?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["company_status"];
          updated_at?: string;
          verified_at?: string | null;
          vehicle_types?: string[];
          website?: string | null;
          whatsapp?: string | null;
        };
      };
      company_amenities: {
        Row: {
          amenity_key: string;
          company_id: string;
          value: boolean;
        };
        Insert: {
          amenity_key: string;
          company_id: string;
          value?: boolean;
        };
        Update: {
          amenity_key?: string;
          company_id?: string;
          value?: boolean;
        };
      };
      company_fleet_summary: {
        Row: {
          age_range: string | null;
          company_id: string;
          fleet_count_max: number | null;
          fleet_count_min: number | null;
          fleet_description: string | null;
          fuel_mix: string | null;
          transmission_mix: string | null;
        };
        Insert: {
          age_range?: string | null;
          company_id: string;
          fleet_count_max?: number | null;
          fleet_count_min?: number | null;
          fleet_description?: string | null;
          fuel_mix?: string | null;
          transmission_mix?: string | null;
        };
        Update: {
          age_range?: string | null;
          company_id?: string;
          fleet_count_max?: number | null;
          fleet_count_min?: number | null;
          fleet_description?: string | null;
          fuel_mix?: string | null;
          transmission_mix?: string | null;
        };
      };
      demo_requests: {
        Row: {
          city: string | null;
          company_name: string | null;
          contacted_at: string | null;
          created_at: string;
          email: string;
          fleet_bucket: Database["public"]["Enums"]["demo_request_fleet_bucket"] | null;
          id: string;
          ip_hash: string | null;
          message: string | null;
          name: string;
          notes: string | null;
          phone: string | null;
          source: string;
          status: Database["public"]["Enums"]["demo_request_status"];
          user_agent: string | null;
        };
        Insert: {
          city?: string | null;
          company_name?: string | null;
          contacted_at?: string | null;
          created_at?: string;
          email: string;
          fleet_bucket?: Database["public"]["Enums"]["demo_request_fleet_bucket"] | null;
          id?: string;
          ip_hash?: string | null;
          message?: string | null;
          name: string;
          notes?: string | null;
          phone?: string | null;
          source?: string;
          status?: Database["public"]["Enums"]["demo_request_status"];
          user_agent?: string | null;
        };
        Update: {
          city?: string | null;
          company_name?: string | null;
          contacted_at?: string | null;
          created_at?: string;
          email?: string;
          fleet_bucket?: Database["public"]["Enums"]["demo_request_fleet_bucket"] | null;
          id?: string;
          ip_hash?: string | null;
          message?: string | null;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          source?: string;
          status?: Database["public"]["Enums"]["demo_request_status"];
          user_agent?: string | null;
        };
      };
      locations: {
        Row: {
          address: string;
          company_id: string;
          created_at: string;
          id: string;
          is_primary: boolean;
          lat: number | null;
          lng: number | null;
        };
        Insert: {
          address: string;
          company_id: string;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          lat?: number | null;
          lng?: number | null;
        };
        Update: {
          address?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          lat?: number | null;
          lng?: number | null;
        };
      };
    };
    Enums: {
      city_slug: "riga" | "tallinn" | "vilnius";
      company_status: "unclaimed" | "claimed" | "verified";
      country_code: "LV" | "EE" | "LT";
      demo_request_fleet_bucket:
        | "fleet_1_10"
        | "fleet_11_30"
        | "fleet_31_100"
        | "fleet_100_plus";
      demo_request_status:
        | "new"
        | "contacted"
        | "qualified"
        | "converted"
        | "rejected";
    };
  };
};
