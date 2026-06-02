export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_price: number | null; child_seat_child: boolean; child_seat_infant: boolean
          child_seat_toddler: boolean; company_id: string; created_at: string; customer_id: string | null
          deposit_amount: number | null; deposit_paid: boolean; deposit_returned_at: string | null
          end_at: string; id: string
          insurance: Database["public"]["Enums"]["booking_insurance"]; is_longterm: boolean; is_maintenance: boolean; notes: string | null
          paid_at: string | null; renewal_period_days: number | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null; pickup_location: string | null
          return_location: string | null; start_at: string; status: Database["public"]["Enums"]["booking_status"]
          updated_at: string; vehicle_id: string
        }
        Insert: {
          booking_price?: number | null; child_seat_child?: boolean; child_seat_infant?: boolean
          child_seat_toddler?: boolean; company_id: string; created_at?: string; customer_id?: string | null
          deposit_amount?: number | null; deposit_paid?: boolean; deposit_returned_at?: string | null
          end_at: string; id?: string
          insurance?: Database["public"]["Enums"]["booking_insurance"]; is_longterm?: boolean; is_maintenance?: boolean; notes?: string | null
          paid_at?: string | null; renewal_period_days?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null; pickup_location?: string | null
          return_location?: string | null; start_at: string; status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string; vehicle_id: string
        }
        Update: {
          booking_price?: number | null; child_seat_child?: boolean; child_seat_infant?: boolean
          child_seat_toddler?: boolean; company_id?: string; created_at?: string; customer_id?: string | null
          deposit_amount?: number | null; deposit_paid?: boolean; deposit_returned_at?: string | null
          end_at?: string; id?: string
          insurance?: Database["public"]["Enums"]["booking_insurance"]; is_longterm?: boolean; is_maintenance?: boolean; notes?: string | null
          paid_at?: string | null; renewal_period_days?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null; pickup_location?: string | null
          return_location?: string | null; start_at?: string; status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string; vehicle_id?: string
        }
        Relationships: [
          { foreignKeyName: "bookings_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] },
          { foreignKeyName: "bookings_customer_id_fkey"; columns: ["customer_id"]; isOneToOne: false; referencedRelation: "customers"; referencedColumns: ["id"] },
          { foreignKeyName: "bookings_vehicle_id_fkey"; columns: ["vehicle_id"]; isOneToOne: false; referencedRelation: "vehicles"; referencedColumns: ["id"] },
        ]
      }
      claim_requests: {
        Row: { id: string; company_id: string; email: string; name: string | null; message: string | null; status: string; created_at: string; reviewed_at: string | null }
        Insert: { id?: string; company_id: string; email: string; name?: string | null; message?: string | null; status?: string; created_at?: string; reviewed_at?: string | null }
        Update: { id?: string; company_id?: string; email?: string; name?: string | null; message?: string | null; status?: string; created_at?: string; reviewed_at?: string | null }
        Relationships: [{ foreignKeyName: "claim_requests_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      claim_tokens: {
        Row: { company_id: string; created_at: string; expires_at: string; id: string; sent_at: string | null; sent_to_email: string | null; token: string; used_at: string | null }
        Insert: { company_id: string; created_at?: string; expires_at?: string; id?: string; sent_at?: string | null; sent_to_email?: string | null; token: string; used_at?: string | null }
        Update: { company_id?: string; created_at?: string; expires_at?: string; id?: string; sent_at?: string | null; sent_to_email?: string | null; token?: string; used_at?: string | null }
        Relationships: [{ foreignKeyName: "claim_tokens_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      companies: {
        Row: {
          address: string | null
          city: Database["public"]["Enums"]["city_slug"]; claimed_at: string | null; claimed_by_user_id: string | null
          contact_person: string | null
          country: Database["public"]["Enums"]["country_code"]; created_at: string; default_depreciation_rate: number | null; fleet_size: number | null
          description: string | null; email: string | null; founded_year: number | null
          google_rating: number | null; google_reviews: number | null; google_url: string | null
          id: string; last_active_at: string | null
          logo_url: string | null; name: string; next_followup_at: string | null; outreach_notes: string | null; phone: string | null
          pipeline_stage: Database["public"]["Enums"]["pipeline_stage"]; slug: string
          status: Database["public"]["Enums"]["company_status"]; updated_at: string; vehicle_types: string[]
          verified_at: string | null; website: string | null; whatsapp: string | null
          invoice_legal_name: string | null; invoice_reg_number: string | null; invoice_vat_number: string | null
          invoice_address: string | null; invoice_bank_name: string | null; invoice_iban: string | null; invoice_swift: string | null
          invoice_default_vat: number | null; invoice_prefix: string | null; invoice_payment_terms: string | null
          invoice_footer_notes: string | null; invoice_next_number: number | null
        }
        Insert: {
          address?: string | null
          city: Database["public"]["Enums"]["city_slug"]; claimed_at?: string | null; claimed_by_user_id?: string | null
          contact_person?: string | null
          country: Database["public"]["Enums"]["country_code"]; created_at?: string; default_depreciation_rate?: number | null; fleet_size?: number | null
          description?: string | null; email?: string | null; founded_year?: number | null
          google_rating?: number | null; google_reviews?: number | null; google_url?: string | null
          id?: string; last_active_at?: string | null
          logo_url?: string | null; name: string; next_followup_at?: string | null; outreach_notes?: string | null; phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]; slug: string
          status?: Database["public"]["Enums"]["company_status"]; updated_at?: string; vehicle_types?: string[]
          verified_at?: string | null; website?: string | null; whatsapp?: string | null
          invoice_legal_name?: string | null; invoice_reg_number?: string | null; invoice_vat_number?: string | null
          invoice_address?: string | null; invoice_bank_name?: string | null; invoice_iban?: string | null; invoice_swift?: string | null
          invoice_default_vat?: number | null; invoice_prefix?: string | null; invoice_payment_terms?: string | null
          invoice_footer_notes?: string | null; invoice_next_number?: number | null
        }
        Update: {
          address?: string | null
          city?: Database["public"]["Enums"]["city_slug"]; claimed_at?: string | null; claimed_by_user_id?: string | null
          contact_person?: string | null; default_depreciation_rate?: number | null; fleet_size?: number | null
          country?: Database["public"]["Enums"]["country_code"]; created_at?: string; description?: string | null
          email?: string | null; founded_year?: number | null; id?: string; last_active_at?: string | null
          google_rating?: number | null; google_reviews?: number | null; google_url?: string | null
          logo_url?: string | null; name?: string; next_followup_at?: string | null; outreach_notes?: string | null; phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]; slug?: string
          status?: Database["public"]["Enums"]["company_status"]; updated_at?: string; vehicle_types?: string[]
          verified_at?: string | null; website?: string | null; whatsapp?: string | null
          invoice_legal_name?: string | null; invoice_reg_number?: string | null; invoice_vat_number?: string | null
          invoice_address?: string | null; invoice_bank_name?: string | null; invoice_iban?: string | null; invoice_swift?: string | null
          invoice_default_vat?: number | null; invoice_prefix?: string | null; invoice_payment_terms?: string | null
          invoice_footer_notes?: string | null; invoice_next_number?: number | null
        }
        Relationships: []
      }
      outreach_logs: {
        Row: { channel: string; company_id: string; contacted_at: string; created_at: string; id: string; notes: string | null; outcome: string }
        Insert: { channel: string; company_id: string; contacted_at?: string; created_at?: string; id?: string; notes?: string | null; outcome: string }
        Update: { channel?: string; company_id?: string; contacted_at?: string; created_at?: string; id?: string; notes?: string | null; outcome?: string }
        Relationships: [{ foreignKeyName: "outreach_logs_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      company_amenities: {
        Row: { amenity_key: string; company_id: string; value: boolean }
        Insert: { amenity_key: string; company_id: string; value?: boolean }
        Update: { amenity_key?: string; company_id?: string; value?: boolean }
        Relationships: [{ foreignKeyName: "company_amenities_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      company_fleet_summary: {
        Row: { age_range: string | null; company_id: string; fleet_count_max: number | null; fleet_count_min: number | null; fleet_description: string | null; fuel_mix: string | null; transmission_mix: string | null }
        Insert: { age_range?: string | null; company_id: string; fleet_count_max?: number | null; fleet_count_min?: number | null; fleet_description?: string | null; fuel_mix?: string | null; transmission_mix?: string | null }
        Update: { age_range?: string | null; company_id?: string; fleet_count_max?: number | null; fleet_count_min?: number | null; fleet_description?: string | null; fuel_mix?: string | null; transmission_mix?: string | null }
        Relationships: [{ foreignKeyName: "company_fleet_summary_company_id_fkey"; columns: ["company_id"]; isOneToOne: true; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      company_members: {
        Row: { company_id: string; created_at: string; id: string; role: string; user_id: string }
        Insert: { company_id: string; created_at?: string; id?: string; role?: string; user_id: string }
        Update: { company_id?: string; created_at?: string; id?: string; role?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "company_members_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      customers: {
        Row: {
          address: string | null; blacklist_reason: string | null; blacklisted: boolean; company_id: string
          created_at: string; date_of_birth: string | null; driver_license_expiry: string | null
          driver_license_number: string | null; email: string | null; full_name: string; id: string
          id_expiry: string | null; id_number: string | null; passport_number: string | null; language: string | null; notes: string | null
          phone: string; updated_at: string
          customer_type: string | null; company_name: string | null; company_reg_number: string | null
          company_vat_number: string | null; billing_address: string | null
        }
        Insert: {
          address?: string | null; blacklist_reason?: string | null; blacklisted?: boolean; company_id: string
          created_at?: string; date_of_birth?: string | null; driver_license_expiry?: string | null
          driver_license_number?: string | null; email?: string | null; full_name: string; id?: string
          id_expiry?: string | null; id_number?: string | null; passport_number?: string | null; language?: string | null; notes?: string | null
          phone: string; updated_at?: string
          customer_type?: string | null; company_name?: string | null; company_reg_number?: string | null
          company_vat_number?: string | null; billing_address?: string | null
        }
        Update: {
          address?: string | null; blacklist_reason?: string | null; blacklisted?: boolean; company_id?: string
          created_at?: string; date_of_birth?: string | null; driver_license_expiry?: string | null
          driver_license_number?: string | null; email?: string | null; full_name?: string; id?: string
          id_expiry?: string | null; id_number?: string | null; passport_number?: string | null; language?: string | null; notes?: string | null
          phone?: string; updated_at?: string
          customer_type?: string | null; company_name?: string | null; company_reg_number?: string | null
          company_vat_number?: string | null; billing_address?: string | null
        }
        Relationships: [{ foreignKeyName: "customers_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      global_blacklist: {
        Row: {
          id: string; submitted_by_company_id: string; local_customer_id: string | null
          id_hash: string | null; license_hash: string | null; passport_hash: string | null; name_dob_hash: string | null
          reason_category: string; severity: number; country: string | null; notes_public: string | null
          status: string; reviewed_at: string | null; reviewed_by_user_id: string | null; reject_reason: string | null
          submitted_at: string; created_at: string
        }
        Insert: {
          id?: string; submitted_by_company_id: string; local_customer_id?: string | null
          id_hash?: string | null; license_hash?: string | null; passport_hash?: string | null; name_dob_hash?: string | null
          reason_category: string; severity?: number; country?: string | null; notes_public?: string | null
          status?: string; reviewed_at?: string | null; reviewed_by_user_id?: string | null; reject_reason?: string | null
          submitted_at?: string; created_at?: string
        }
        Update: {
          id?: string; submitted_by_company_id?: string; local_customer_id?: string | null
          id_hash?: string | null; license_hash?: string | null; passport_hash?: string | null; name_dob_hash?: string | null
          reason_category?: string; severity?: number; country?: string | null; notes_public?: string | null
          status?: string; reviewed_at?: string | null; reviewed_by_user_id?: string | null; reject_reason?: string | null
          submitted_at?: string; created_at?: string
        }
        Relationships: [
          { foreignKeyName: "global_blacklist_submitted_by_company_id_fkey"; columns: ["submitted_by_company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }
        ]
      }
      invoices: {
        Row: {
          id: string; company_id: string; booking_id: string | null; customer_id: string | null
          invoice_number: string; status: string; issue_date: string; due_date: string | null
          seller_name: string; seller_reg_number: string | null; seller_vat_number: string | null
          seller_address: string | null; seller_bank_name: string | null; seller_iban: string | null; seller_swift: string | null
          buyer_type: string; buyer_name: string; buyer_reg_number: string | null; buyer_vat_number: string | null
          buyer_address: string | null; buyer_email: string | null
          currency: string; subtotal: number; vat_amount: number; total: number
          payment_terms: string | null; notes: string | null
          sent_at: string | null; paid_at: string | null; cancelled_at: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; company_id: string; booking_id?: string | null; customer_id?: string | null
          invoice_number: string; status?: string; issue_date: string; due_date?: string | null
          seller_name: string; seller_reg_number?: string | null; seller_vat_number?: string | null
          seller_address?: string | null; seller_bank_name?: string | null; seller_iban?: string | null; seller_swift?: string | null
          buyer_type?: string; buyer_name: string; buyer_reg_number?: string | null; buyer_vat_number?: string | null
          buyer_address?: string | null; buyer_email?: string | null
          currency?: string; subtotal?: number; vat_amount?: number; total?: number
          payment_terms?: string | null; notes?: string | null
          sent_at?: string | null; paid_at?: string | null; cancelled_at?: string | null
          created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; company_id?: string; booking_id?: string | null; customer_id?: string | null
          invoice_number?: string; status?: string; issue_date?: string; due_date?: string | null
          seller_name?: string; seller_reg_number?: string | null; seller_vat_number?: string | null
          seller_address?: string | null; seller_bank_name?: string | null; seller_iban?: string | null; seller_swift?: string | null
          buyer_type?: string; buyer_name?: string; buyer_reg_number?: string | null; buyer_vat_number?: string | null
          buyer_address?: string | null; buyer_email?: string | null
          currency?: string; subtotal?: number; vat_amount?: number; total?: number
          payment_terms?: string | null; notes?: string | null
          sent_at?: string | null; paid_at?: string | null; cancelled_at?: string | null
          created_at?: string; updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "invoices_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] },
          { foreignKeyName: "invoices_booking_id_fkey"; columns: ["booking_id"]; isOneToOne: false; referencedRelation: "bookings"; referencedColumns: ["id"] },
        ]
      }
      invoice_items: {
        Row: {
          id: string; invoice_id: string; sort_order: number; description: string
          quantity: number; unit_price: number; vat_rate: number; line_total: number; created_at: string
        }
        Insert: {
          id?: string; invoice_id: string; sort_order?: number; description: string
          quantity?: number; unit_price?: number; vat_rate?: number; line_total?: number; created_at?: string
        }
        Update: {
          id?: string; invoice_id?: string; sort_order?: number; description?: string
          quantity?: number; unit_price?: number; vat_rate?: number; line_total?: number; created_at?: string
        }
        Relationships: [{ foreignKeyName: "invoice_items_invoice_id_fkey"; columns: ["invoice_id"]; isOneToOne: false; referencedRelation: "invoices"; referencedColumns: ["id"] }]
      }
      demo_requests: {
        Row: {
          city: string | null; company_name: string | null; contacted_at: string | null; created_at: string
          email: string; fleet_bucket: Database["public"]["Enums"]["demo_request_fleet_bucket"] | null; id: string
          ip_hash: string | null; message: string | null; name: string; notes: string | null; phone: string | null
          source: string; status: Database["public"]["Enums"]["demo_request_status"]; user_agent: string | null
        }
        Insert: {
          city?: string | null; company_name?: string | null; contacted_at?: string | null; created_at?: string
          email: string; fleet_bucket?: Database["public"]["Enums"]["demo_request_fleet_bucket"] | null; id?: string
          ip_hash?: string | null; message?: string | null; name: string; notes?: string | null; phone?: string | null
          source?: string; status?: Database["public"]["Enums"]["demo_request_status"]; user_agent?: string | null
        }
        Update: {
          city?: string | null; company_name?: string | null; contacted_at?: string | null; created_at?: string
          email?: string; fleet_bucket?: Database["public"]["Enums"]["demo_request_fleet_bucket"] | null; id?: string
          ip_hash?: string | null; message?: string | null; name?: string; notes?: string | null; phone?: string | null
          source?: string; status?: Database["public"]["Enums"]["demo_request_status"]; user_agent?: string | null
        }
        Relationships: []
      }
      expense_payees: {
        Row: { company_id: string; created_at: string; id: string; name: string; notes: string | null }
        Insert: { company_id: string; created_at?: string; id?: string; name: string; notes?: string | null }
        Update: { company_id?: string; created_at?: string; id?: string; name?: string; notes?: string | null }
        Relationships: [{ foreignKeyName: "expense_payees_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      company_expenses: {
        Row: { amount: number; category: Database["public"]["Enums"]["expense_category"]; company_id: string; covers_from: string | null; covers_until: string | null; created_at: string; date: string; description: string; id: string; invoice_number: string | null; is_recurring: boolean; notes: string | null; quantity: number | null; supplier: string | null; unit: string | null; vehicle_id: string | null }
        Insert: { amount?: number; category?: Database["public"]["Enums"]["expense_category"]; company_id: string; covers_from?: string | null; covers_until?: string | null; created_at?: string; date: string; description: string; id?: string; invoice_number?: string | null; is_recurring?: boolean; notes?: string | null; quantity?: number | null; supplier?: string | null; unit?: string | null; vehicle_id?: string | null }
        Update: { amount?: number; category?: Database["public"]["Enums"]["expense_category"]; company_id?: string; covers_from?: string | null; covers_until?: string | null; created_at?: string; date?: string; description?: string; id?: string; invoice_number?: string | null; is_recurring?: boolean; notes?: string | null; quantity?: number | null; supplier?: string | null; unit?: string | null; vehicle_id?: string | null }
        Relationships: [{ foreignKeyName: "company_expenses_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }, { foreignKeyName: "company_expenses_vehicle_id_fkey"; columns: ["vehicle_id"]; isOneToOne: false; referencedRelation: "vehicles"; referencedColumns: ["id"] }]
      }
      garage_presets: {
        Row: { company_id: string; created_at: string; id: string; name: string; notes: string | null; phone: string | null }
        Insert: { company_id: string; created_at?: string; id?: string; name: string; notes?: string | null; phone?: string | null }
        Update: { company_id?: string; created_at?: string; id?: string; name?: string; notes?: string | null; phone?: string | null }
        Relationships: [{ foreignKeyName: "garage_presets_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      odometer_readings: {
        Row: { company_id: string; created_at: string; id: string; odometer_km: number; recorded_at: string; source: string; vehicle_id: string }
        Insert: { company_id: string; created_at?: string; id?: string; odometer_km: number; recorded_at?: string; source?: string; vehicle_id: string }
        Update: { company_id?: string; created_at?: string; id?: string; odometer_km?: number; recorded_at?: string; source?: string; vehicle_id?: string }
        Relationships: [
          { foreignKeyName: "odometer_readings_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] },
          { foreignKeyName: "odometer_readings_vehicle_id_fkey"; columns: ["vehicle_id"]; isOneToOne: false; referencedRelation: "vehicles"; referencedColumns: ["id"] },
        ]
      }
      locations: {
        Row: { address: string; company_id: string; created_at: string; id: string; is_primary: boolean; lat: number | null; lng: number | null }
        Insert: { address: string; company_id: string; created_at?: string; id?: string; is_primary?: boolean; lat?: number | null; lng?: number | null }
        Update: { address?: string; company_id?: string; created_at?: string; id?: string; is_primary?: boolean; lat?: number | null; lng?: number | null }
        Relationships: [{ foreignKeyName: "locations_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      maintenance_logs: {
        Row: {
          company_id: string; cost: number; covers_from: string | null; covers_until: string | null
          created_at: string; date: string; description: string | null; id: string
          invoice_number: string | null; next_due_date: string | null; next_due_km: number | null
          next_due_label: string | null; notes: string | null; odometer_km: number | null; supplier: string | null
          type: Database["public"]["Enums"]["maintenance_type"]; vehicle_id: string
        }
        Insert: {
          company_id: string; cost?: number; covers_from?: string | null; covers_until?: string | null
          created_at?: string; date: string; description?: string | null; id?: string
          invoice_number?: string | null; next_due_date?: string | null; next_due_km?: number | null
          next_due_label?: string | null; notes?: string | null; odometer_km?: number | null; supplier?: string | null
          type?: Database["public"]["Enums"]["maintenance_type"]; vehicle_id: string
        }
        Update: {
          company_id?: string; cost?: number; covers_from?: string | null; covers_until?: string | null
          created_at?: string; date?: string; description?: string | null; id?: string
          invoice_number?: string | null; next_due_date?: string | null; next_due_km?: number | null
          next_due_label?: string | null; notes?: string | null; odometer_km?: number | null; supplier?: string | null
          type?: Database["public"]["Enums"]["maintenance_type"]; vehicle_id?: string
        }
        Relationships: [
          { foreignKeyName: "maintenance_logs_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] },
          { foreignKeyName: "maintenance_logs_vehicle_id_fkey"; columns: ["vehicle_id"]; isOneToOne: false; referencedRelation: "vehicles"; referencedColumns: ["id"] },
        ]
      }
      vehicles: {
        Row: {
          category: Database["public"]["Enums"]["vehicle_category"]; color: string | null; company_id: string
          created_at: string; depreciation_mode: string | null; depreciation_rate: number | null
          disposal_price: number | null; disposed_at: string | null
          fuel: Database["public"]["Enums"]["vehicle_fuel"] | null; gov_inspection_date: string | null
          gov_inspection_next: string | null; id: string; insurance_number: string | null; insurance_valid_until: string | null
          make: string; model: string; notes: string | null; odometer_km: number | null; plate: string
          purchase_date: string | null; purchase_price: number | null; registration_number: string | null
          residual_value: number | null; seats: number | null; service_date: string | null; service_next: string | null
          status: Database["public"]["Enums"]["vehicle_status"]; updated_at: string; vin: string | null; year: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["vehicle_category"]; color?: string | null; company_id: string
          created_at?: string; depreciation_mode?: string | null; depreciation_rate?: number | null
          disposal_price?: number | null; disposed_at?: string | null
          fuel?: Database["public"]["Enums"]["vehicle_fuel"] | null; gov_inspection_date?: string | null
          gov_inspection_next?: string | null; id?: string; insurance_number?: string | null; insurance_valid_until?: string | null
          make: string; model: string; notes?: string | null; odometer_km?: number | null; plate: string
          purchase_date?: string | null; purchase_price?: number | null; registration_number?: string | null
          residual_value?: number | null; seats?: number | null; service_date?: string | null; service_next?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]; updated_at?: string; vin?: string | null; year: number
        }
        Update: {
          category?: Database["public"]["Enums"]["vehicle_category"]; color?: string | null; company_id?: string
          created_at?: string; depreciation_mode?: string | null; depreciation_rate?: number | null
          disposal_price?: number | null; disposed_at?: string | null
          fuel?: Database["public"]["Enums"]["vehicle_fuel"] | null; gov_inspection_date?: string | null
          gov_inspection_next?: string | null; id?: string; insurance_number?: string | null; insurance_valid_until?: string | null
          make?: string; model?: string; notes?: string | null; odometer_km?: number | null; plate?: string
          purchase_date?: string | null; purchase_price?: number | null; registration_number?: string | null
          residual_value?: number | null; seats?: number | null; service_date?: string | null; service_next?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]; updated_at?: string; vin?: string | null; year?: number
        }
        Relationships: [{ foreignKeyName: "vehicles_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      booking_insurance: "none" | "partial" | "full"
      booking_status: "confirmed" | "active" | "returned" | "cancelled"
      city_slug: "riga" | "tallinn" | "vilnius" | "parnu" | "kaunas"
      company_status: "unclaimed" | "claimed" | "verified"
      pipeline_stage: "unclaimed" | "contacted" | "interested" | "trial" | "active" | "not_interested"
      country_code: "LV" | "EE" | "LT"
      demo_request_fleet_bucket: "fleet_1_10" | "fleet_11_30" | "fleet_31_100" | "fleet_100_plus"
      demo_request_status: "new" | "contacted" | "qualified" | "converted" | "rejected"
      expense_category: "car_insurance" | "gov_inspection" | "service_repair" | "fuel" | "salary" | "tax" | "rent" | "phone_internet" | "accounting_legal" | "supplies_stock" | "company_insurance" | "other"
      maintenance_type: "oil_change" | "tires" | "brakes" | "gov_inspection_fee" | "insurance_payment" | "bodywork" | "cleaning" | "other"
      payment_method: "cash" | "card" | "bank_transfer" | "other"
      vehicle_category: "economy" | "compact" | "midsize" | "suv" | "van" | "luxury" | "other"
      vehicle_fuel: "diesel" | "petrol" | "electric" | "hybrid" | "lpg"
      vehicle_status: "available" | "rented" | "maintenance" | "retired"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R } ? R : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R } ? R : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I } ? I : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I } ? I : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U } ? U : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U } ? U : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_insurance: ["none", "partial", "full"],
      booking_status: ["confirmed", "active", "returned", "cancelled"],
      city_slug: ["riga", "tallinn", "vilnius", "parnu", "kaunas"],
      company_status: ["unclaimed", "claimed", "verified"],
      pipeline_stage: ["unclaimed", "contacted", "interested", "trial", "active", "not_interested"],
      country_code: ["LV", "EE", "LT"],
      demo_request_fleet_bucket: ["fleet_1_10", "fleet_11_30", "fleet_31_100", "fleet_100_plus"],
      demo_request_status: ["new", "contacted", "qualified", "converted", "rejected"],
      maintenance_type: ["oil_change", "tires", "brakes", "gov_inspection_fee", "insurance_payment", "bodywork", "cleaning", "other"],
      payment_method: ["cash", "card", "bank_transfer", "other"],
      vehicle_category: ["economy", "compact", "midsize", "suv", "van", "luxury", "other"],
      vehicle_fuel: ["diesel", "petrol", "electric", "hybrid", "lpg"],
      vehicle_status: ["available", "rented", "maintenance", "retired"],
    },
  },
} as const
