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
      _event_schedule_items_legacy: {
        Row: {
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          ends_at: string
          event_id: string
          id: string
          sort_order: number
          speaker_first_name: string | null
          speaker_id: string | null
          speaker_image_url: string | null
          speaker_last_name: string | null
          speaker_name: string | null
          speaker_title: string | null
          starts_at: string
          title_de: string
          title_en: string
          title_fr: string
        }
        Insert: {
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          ends_at: string
          event_id: string
          id?: string
          sort_order?: number
          speaker_first_name?: string | null
          speaker_id?: string | null
          speaker_image_url?: string | null
          speaker_last_name?: string | null
          speaker_name?: string | null
          speaker_title?: string | null
          starts_at: string
          title_de: string
          title_en: string
          title_fr: string
        }
        Update: {
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          ends_at?: string
          event_id?: string
          id?: string
          sort_order?: number
          speaker_first_name?: string | null
          speaker_id?: string | null
          speaker_image_url?: string | null
          speaker_last_name?: string | null
          speaker_name?: string | null
          speaker_title?: string | null
          starts_at?: string
          title_de?: string
          title_en?: string
          title_fr?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_schedule_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_schedule_items_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      abuse_events: {
        Row: {
          id: number
          ip: unknown
          key: string
          occurred_at: string
          scope: string
        }
        Insert: {
          id?: never
          ip?: unknown
          key: string
          occurred_at?: string
          scope: string
        }
        Update: {
          id?: never
          ip?: unknown
          key?: string
          occurred_at?: string
          scope?: string
        }
        Relationships: []
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          commission_cents: number
          cooldown_until: string
          created_at: string
          currency: string
          event_affiliate_id: string
          id: string
          order_id: string
          payout_id: string | null
          reversal_reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          commission_cents: number
          cooldown_until: string
          created_at?: string
          currency?: string
          event_affiliate_id: string
          id?: string
          order_id: string
          payout_id?: string | null
          reversal_reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          commission_cents?: number
          cooldown_until?: string
          created_at?: string
          currency?: string
          event_affiliate_id?: string
          id?: string
          order_id?: string
          payout_id?: string | null
          reversal_reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_event_affiliate_id_fkey"
            columns: ["event_affiliate_id"]
            isOneToOne: false
            referencedRelation: "event_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "affiliate_payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          amount_cents: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_reference: string | null
          period_ends_at: string | null
          period_starts_at: string | null
          statement_storage_path: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          period_ends_at?: string | null
          period_starts_at?: string | null
          statement_storage_path?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          period_ends_at?: string | null
          period_starts_at?: string | null
          statement_storage_path?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          created_at: string
          event_affiliate_id: string
          id: string
          order_id: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          event_affiliate_id: string
          id?: string
          order_id: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          event_affiliate_id?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_event_affiliate_id_fkey"
            columns: ["event_affiliate_id"]
            isOneToOne: false
            referencedRelation: "event_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          contact_email: string
          contact_id: string | null
          country: string | null
          created_at: string
          display_name: string
          first_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          preferred_locale: string
          profile_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contact_email: string
          contact_id?: string | null
          country?: string | null
          created_at?: string
          display_name: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          preferred_locale?: string
          profile_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string
          contact_id?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          preferred_locale?: string
          profile_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: number
          page_url: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: never
          page_url?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: never
          page_url?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_secrets: {
        Row: {
          key: string
          note: string | null
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          note?: string | null
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          note?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: number
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: never
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: never
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      authors: {
        Row: {
          bio_de: string | null
          bio_en: string | null
          bio_fr: string | null
          contact_id: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          instagram_url: string | null
          is_org_default: boolean
          is_public: boolean
          linkedin_url: string | null
          photo_url: string | null
          role_title_de: string | null
          role_title_en: string | null
          role_title_fr: string | null
          slug: string
          sort_order: number
          team_member_id: string | null
          type: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          bio_de?: string | null
          bio_en?: string | null
          bio_fr?: string | null
          contact_id?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          instagram_url?: string | null
          is_org_default?: boolean
          is_public?: boolean
          linkedin_url?: string | null
          photo_url?: string | null
          role_title_de?: string | null
          role_title_en?: string | null
          role_title_fr?: string | null
          slug: string
          sort_order?: number
          team_member_id?: string | null
          type?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          bio_de?: string | null
          bio_en?: string | null
          bio_fr?: string | null
          contact_id?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          instagram_url?: string | null
          is_org_default?: boolean
          is_public?: boolean
          linkedin_url?: string | null
          photo_url?: string | null
          role_title_de?: string | null
          role_title_en?: string | null
          role_title_fr?: string | null
          slug?: string
          sort_order?: number
          team_member_id?: string | null
          type?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authors_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authors_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      catering_menu_items: {
        Row: {
          allergens: string[] | null
          category: Database["public"]["Enums"]["catering_category"]
          created_at: string | null
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          event_id: string
          id: string
          is_active: boolean
          is_halal: boolean | null
          is_vegan: boolean | null
          is_vegetarian: boolean | null
          max_selections_per_event: number | null
          name_de: string
          name_en: string
          name_fr: string
          selections_count: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          allergens?: string[] | null
          category: Database["public"]["Enums"]["catering_category"]
          created_at?: string | null
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          is_halal?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          max_selections_per_event?: number | null
          name_de: string
          name_en: string
          name_fr: string
          selections_count?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          allergens?: string[] | null
          category?: Database["public"]["Enums"]["catering_category"]
          created_at?: string | null
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          is_halal?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          max_selections_per_event?: number | null
          name_de?: string
          name_en?: string
          name_fr?: string
          selections_count?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catering_menu_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      company_info: {
        Row: {
          about_sections_de: Json
          about_sections_en: Json
          about_sections_fr: Json
          account_holder: string | null
          bank_name: string | null
          bic: string | null
          bing_site_verification: string | null
          brand_name: string
          brand_tagline_de: string | null
          brand_tagline_en: string | null
          brand_tagline_fr: string | null
          careers_email: string | null
          chamber_of_commerce: string | null
          contact_form_url: string | null
          default_tax_rate_pct: number | null
          dpo_email: string | null
          dpo_name: string | null
          dpo_required: boolean | null
          eu_odr_link: string | null
          eu_representative_address: string | null
          eu_representative_name: string | null
          facebook_url: string | null
          favicon_url: string | null
          fr_city: string | null
          fr_country: string | null
          fr_director: string | null
          fr_legal_form: string | null
          fr_legal_name: string | null
          fr_line1: string | null
          fr_line2: string | null
          fr_postal_code: string | null
          fr_registered_address: string | null
          fr_siren: string | null
          google_site_verification: string | null
          home_hero_darkening_strength: number
          home_hero_image_url: string | null
          home_hero_overlay_image_url: string | null
          home_hero_overlay_text_de: string | null
          home_hero_overlay_text_en: string | null
          home_hero_overlay_text_fr: string | null
          home_hero_video_url: string | null
          hrb_court: string | null
          hrb_number: string | null
          iban: string | null
          id: number
          instagram_url: string | null
          legal_email: string | null
          legal_form: string | null
          legal_name: string
          linkedin_url: string | null
          logo_dark_url: string | null
          logo_light_url: string | null
          logo_wordmark_url: string | null
          managing_directors: string | null
          ndpr_dpco_email: string | null
          ndpr_dpco_name: string | null
          office_address: string | null
          office_city: string | null
          office_country: string | null
          office_hours: string | null
          office_line1: string | null
          office_line2: string | null
          office_postal_code: string | null
          og_default_image_url: string | null
          parent_company_address: string | null
          parent_company_city: string | null
          parent_company_country: string | null
          parent_company_name: string | null
          phone: string | null
          popia_info_officer_email: string | null
          popia_info_officer_name: string | null
          press_email: string
          primary_color: string | null
          primary_email: string
          privacy_email: string | null
          professional_liability_insurance: string | null
          registered_address: string | null
          registered_city: string | null
          registered_country: string | null
          registered_postal_code: string | null
          responsible_person: string | null
          seo_description_de: string | null
          seo_description_en: string | null
          seo_description_fr: string | null
          seo_title_de: string | null
          seo_title_en: string | null
          seo_title_fr: string | null
          supervisory_authority: string | null
          support_email: string
          tax_id: string | null
          trade_name: string | null
          twitter_url: string | null
          uk_representative_address: string | null
          uk_representative_name: string | null
          updated_at: string
          updated_by: string | null
          vat_id: string | null
          vsbg_statement: string | null
          whatsapp_url: string | null
          youtube_url: string | null
        }
        Insert: {
          about_sections_de?: Json
          about_sections_en?: Json
          about_sections_fr?: Json
          account_holder?: string | null
          bank_name?: string | null
          bic?: string | null
          bing_site_verification?: string | null
          brand_name?: string
          brand_tagline_de?: string | null
          brand_tagline_en?: string | null
          brand_tagline_fr?: string | null
          careers_email?: string | null
          chamber_of_commerce?: string | null
          contact_form_url?: string | null
          default_tax_rate_pct?: number | null
          dpo_email?: string | null
          dpo_name?: string | null
          dpo_required?: boolean | null
          eu_odr_link?: string | null
          eu_representative_address?: string | null
          eu_representative_name?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          fr_city?: string | null
          fr_country?: string | null
          fr_director?: string | null
          fr_legal_form?: string | null
          fr_legal_name?: string | null
          fr_line1?: string | null
          fr_line2?: string | null
          fr_postal_code?: string | null
          fr_registered_address?: string | null
          fr_siren?: string | null
          google_site_verification?: string | null
          home_hero_darkening_strength?: number
          home_hero_image_url?: string | null
          home_hero_overlay_image_url?: string | null
          home_hero_overlay_text_de?: string | null
          home_hero_overlay_text_en?: string | null
          home_hero_overlay_text_fr?: string | null
          home_hero_video_url?: string | null
          hrb_court?: string | null
          hrb_number?: string | null
          iban?: string | null
          id?: number
          instagram_url?: string | null
          legal_email?: string | null
          legal_form?: string | null
          legal_name?: string
          linkedin_url?: string | null
          logo_dark_url?: string | null
          logo_light_url?: string | null
          logo_wordmark_url?: string | null
          managing_directors?: string | null
          ndpr_dpco_email?: string | null
          ndpr_dpco_name?: string | null
          office_address?: string | null
          office_city?: string | null
          office_country?: string | null
          office_hours?: string | null
          office_line1?: string | null
          office_line2?: string | null
          office_postal_code?: string | null
          og_default_image_url?: string | null
          parent_company_address?: string | null
          parent_company_city?: string | null
          parent_company_country?: string | null
          parent_company_name?: string | null
          phone?: string | null
          popia_info_officer_email?: string | null
          popia_info_officer_name?: string | null
          press_email?: string
          primary_color?: string | null
          primary_email?: string
          privacy_email?: string | null
          professional_liability_insurance?: string | null
          registered_address?: string | null
          registered_city?: string | null
          registered_country?: string | null
          registered_postal_code?: string | null
          responsible_person?: string | null
          seo_description_de?: string | null
          seo_description_en?: string | null
          seo_description_fr?: string | null
          seo_title_de?: string | null
          seo_title_en?: string | null
          seo_title_fr?: string | null
          supervisory_authority?: string | null
          support_email?: string
          tax_id?: string | null
          trade_name?: string | null
          twitter_url?: string | null
          uk_representative_address?: string | null
          uk_representative_name?: string | null
          updated_at?: string
          updated_by?: string | null
          vat_id?: string | null
          vsbg_statement?: string | null
          whatsapp_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          about_sections_de?: Json
          about_sections_en?: Json
          about_sections_fr?: Json
          account_holder?: string | null
          bank_name?: string | null
          bic?: string | null
          bing_site_verification?: string | null
          brand_name?: string
          brand_tagline_de?: string | null
          brand_tagline_en?: string | null
          brand_tagline_fr?: string | null
          careers_email?: string | null
          chamber_of_commerce?: string | null
          contact_form_url?: string | null
          default_tax_rate_pct?: number | null
          dpo_email?: string | null
          dpo_name?: string | null
          dpo_required?: boolean | null
          eu_odr_link?: string | null
          eu_representative_address?: string | null
          eu_representative_name?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          fr_city?: string | null
          fr_country?: string | null
          fr_director?: string | null
          fr_legal_form?: string | null
          fr_legal_name?: string | null
          fr_line1?: string | null
          fr_line2?: string | null
          fr_postal_code?: string | null
          fr_registered_address?: string | null
          fr_siren?: string | null
          google_site_verification?: string | null
          home_hero_darkening_strength?: number
          home_hero_image_url?: string | null
          home_hero_overlay_image_url?: string | null
          home_hero_overlay_text_de?: string | null
          home_hero_overlay_text_en?: string | null
          home_hero_overlay_text_fr?: string | null
          home_hero_video_url?: string | null
          hrb_court?: string | null
          hrb_number?: string | null
          iban?: string | null
          id?: number
          instagram_url?: string | null
          legal_email?: string | null
          legal_form?: string | null
          legal_name?: string
          linkedin_url?: string | null
          logo_dark_url?: string | null
          logo_light_url?: string | null
          logo_wordmark_url?: string | null
          managing_directors?: string | null
          ndpr_dpco_email?: string | null
          ndpr_dpco_name?: string | null
          office_address?: string | null
          office_city?: string | null
          office_country?: string | null
          office_hours?: string | null
          office_line1?: string | null
          office_line2?: string | null
          office_postal_code?: string | null
          og_default_image_url?: string | null
          parent_company_address?: string | null
          parent_company_city?: string | null
          parent_company_country?: string | null
          parent_company_name?: string | null
          phone?: string | null
          popia_info_officer_email?: string | null
          popia_info_officer_name?: string | null
          press_email?: string
          primary_color?: string | null
          primary_email?: string
          privacy_email?: string | null
          professional_liability_insurance?: string | null
          registered_address?: string | null
          registered_city?: string | null
          registered_country?: string | null
          registered_postal_code?: string | null
          responsible_person?: string | null
          seo_description_de?: string | null
          seo_description_en?: string | null
          seo_description_fr?: string | null
          seo_title_de?: string | null
          seo_title_en?: string | null
          seo_title_fr?: string | null
          supervisory_authority?: string | null
          support_email?: string
          tax_id?: string | null
          trade_name?: string | null
          twitter_url?: string | null
          uk_representative_address?: string | null
          uk_representative_name?: string | null
          updated_at?: string
          updated_by?: string | null
          vat_id?: string | null
          vsbg_statement?: string | null
          whatsapp_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_info_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_categories: {
        Row: {
          color: string | null
          created_at: string
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          id: string
          is_system: boolean
          name_de: string | null
          name_en: string
          name_fr: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_system?: boolean
          name_de?: string | null
          name_en: string
          name_fr?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_system?: boolean
          name_de?: string | null
          name_en?: string
          name_fr?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      contact_category_links: {
        Row: {
          added_at: string
          added_by: string | null
          category_id: string
          contact_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          category_id: string
          contact_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          category_id?: string
          contact_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_category_links_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_category_links_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "contact_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_category_links_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_event_involvements: {
        Row: {
          added_by: string | null
          chapter_country: string | null
          chapter_lead_email: string | null
          chapter_lead_name: string | null
          chapter_position: string | null
          companion_contact_id: string | null
          contact_id: string
          created_at: string
          event_id: string
          id: string
          notes: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role: Database["public"]["Enums"]["involvement_role"]
          status: string
          submission_ip: string | null
          submission_metadata: Json | null
        }
        Insert: {
          added_by?: string | null
          chapter_country?: string | null
          chapter_lead_email?: string | null
          chapter_lead_name?: string | null
          chapter_position?: string | null
          companion_contact_id?: string | null
          contact_id: string
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role: Database["public"]["Enums"]["involvement_role"]
          status?: string
          submission_ip?: string | null
          submission_metadata?: Json | null
        }
        Update: {
          added_by?: string | null
          chapter_country?: string | null
          chapter_lead_email?: string | null
          chapter_lead_name?: string | null
          chapter_position?: string | null
          companion_contact_id?: string | null
          contact_id?: string
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: Database["public"]["Enums"]["involvement_role"]
          status?: string
          submission_ip?: string | null
          submission_metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_event_involvements_companion_contact_id_fkey"
            columns: ["companion_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_event_involvements_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_event_involvements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_event_involvements_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          attachments: Json
          body_md: string
          contact_id: string
          id: string
          reply_to: string | null
          resend_message_id: string | null
          sent_at: string
          sent_by: string | null
          subject: string
          template_slug: string | null
        }
        Insert: {
          attachments?: Json
          body_md: string
          contact_id: string
          id?: string
          reply_to?: string | null
          resend_message_id?: string | null
          sent_at?: string
          sent_by?: string | null
          subject: string
          template_slug?: string | null
        }
        Update: {
          attachments?: Json
          body_md?: string
          contact_id?: string
          id?: string
          reply_to?: string | null
          resend_message_id?: string | null
          sent_at?: string
          sent_by?: string | null
          subject?: string
          template_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_user_state: {
        Row: {
          contact_id: string
          pipeline_status: Database["public"]["Enums"]["pipeline_status"] | null
          private_notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id: string
          pipeline_status?:
            | Database["public"]["Enums"]["pipeline_status"]
            | null
          private_notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          pipeline_status?:
            | Database["public"]["Enums"]["pipeline_status"]
            | null
          private_notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_user_state_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          admin_notes: string | null
          best_contact_method: string | null
          birthday: string | null
          bounced_at: string | null
          bounced_reason: string | null
          city: string | null
          complained_at: string | null
          confidence: number | null
          country: string | null
          created_at: string
          email: string
          email_status: Database["public"]["Enums"]["email_status"]
          email_verified: boolean
          first_name: string | null
          gender: Database["public"]["Enums"]["gender_identity"] | null
          hq_country: string | null
          id: string
          last_name: string | null
          linkedin_url: string | null
          locale: string | null
          marketing_consent: boolean
          marketing_consent_confirmed_at: string | null
          marketing_consent_ip: unknown
          marketing_consent_requested_at: string | null
          marketing_consent_source: string | null
          marketing_consent_token: string | null
          marketing_consent_token_expires_at: string | null
          occupation: string | null
          organization: string | null
          phone: string | null
          pitch_tier: string | null
          postal_code: string | null
          resend_contact_id: string | null
          sector: string | null
          state_region: string | null
          tier: string | null
          title: string | null
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          admin_notes?: string | null
          best_contact_method?: string | null
          birthday?: string | null
          bounced_at?: string | null
          bounced_reason?: string | null
          city?: string | null
          complained_at?: string | null
          confidence?: number | null
          country?: string | null
          created_at?: string
          email: string
          email_status?: Database["public"]["Enums"]["email_status"]
          email_verified?: boolean
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender_identity"] | null
          hq_country?: string | null
          id?: string
          last_name?: string | null
          linkedin_url?: string | null
          locale?: string | null
          marketing_consent?: boolean
          marketing_consent_confirmed_at?: string | null
          marketing_consent_ip?: unknown
          marketing_consent_requested_at?: string | null
          marketing_consent_source?: string | null
          marketing_consent_token?: string | null
          marketing_consent_token_expires_at?: string | null
          occupation?: string | null
          organization?: string | null
          phone?: string | null
          pitch_tier?: string | null
          postal_code?: string | null
          resend_contact_id?: string | null
          sector?: string | null
          state_region?: string | null
          tier?: string | null
          title?: string | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          admin_notes?: string | null
          best_contact_method?: string | null
          birthday?: string | null
          bounced_at?: string | null
          bounced_reason?: string | null
          city?: string | null
          complained_at?: string | null
          confidence?: number | null
          country?: string | null
          created_at?: string
          email?: string
          email_status?: Database["public"]["Enums"]["email_status"]
          email_verified?: boolean
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender_identity"] | null
          hq_country?: string | null
          id?: string
          last_name?: string | null
          linkedin_url?: string | null
          locale?: string | null
          marketing_consent?: boolean
          marketing_consent_confirmed_at?: string | null
          marketing_consent_ip?: unknown
          marketing_consent_requested_at?: string | null
          marketing_consent_source?: string | null
          marketing_consent_token?: string | null
          marketing_consent_token_expires_at?: string | null
          occupation?: string | null
          organization?: string | null
          phone?: string | null
          pitch_tier?: string | null
          postal_code?: string | null
          resend_contact_id?: string | null
          sector?: string | null
          state_region?: string | null
          tier?: string | null
          title?: string | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          applicable_tier_ids: string[] | null
          code: string
          created_at: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          event_id: string | null
          id: string
          is_active: boolean
          issued_to_profile_id: string | null
          max_uses: number | null
          purpose: string | null
          stripe_coupon_id: string | null
          stripe_promotion_code_id: string | null
          times_used: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_tier_ids?: string[] | null
          code: string
          created_at?: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          event_id?: string | null
          id?: string
          is_active?: boolean
          issued_to_profile_id?: string | null
          max_uses?: number | null
          purpose?: string | null
          stripe_coupon_id?: string | null
          stripe_promotion_code_id?: string | null
          times_used?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_tier_ids?: string[] | null
          code?: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          event_id?: string | null
          id?: string
          is_active?: boolean
          issued_to_profile_id?: string | null
          max_uses?: number | null
          purpose?: string | null
          stripe_coupon_id?: string | null
          stripe_promotion_code_id?: string | null
          times_used?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_issued_to_profile_id_fkey"
            columns: ["issued_to_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_ads: {
        Row: {
          accent_color: string | null
          created_at: string
          created_by: string | null
          cta_label_de: string | null
          cta_label_en: string | null
          cta_label_fr: string | null
          cta_url: string | null
          ends_at: string | null
          id: string
          image_url: string
          is_active: boolean
          sort_order: number
          starts_at: string | null
          subtitle_de: string | null
          subtitle_en: string | null
          subtitle_fr: string | null
          title_de: string | null
          title_en: string
          title_fr: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          created_by?: string | null
          cta_label_de?: string | null
          cta_label_en?: string | null
          cta_label_fr?: string | null
          cta_url?: string | null
          ends_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          sort_order?: number
          starts_at?: string | null
          subtitle_de?: string | null
          subtitle_en?: string | null
          subtitle_fr?: string | null
          title_de?: string | null
          title_en: string
          title_fr?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          created_by?: string | null
          cta_label_de?: string | null
          cta_label_en?: string | null
          cta_label_fr?: string | null
          cta_url?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
          starts_at?: string | null
          subtitle_de?: string | null
          subtitle_en?: string | null
          subtitle_fr?: string | null
          title_de?: string | null
          title_en?: string
          title_fr?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_ads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_affiliate_tier_goals: {
        Row: {
          created_at: string
          event_affiliate_id: string
          fulfilled_at: string | null
          fulfilled_notes: string | null
          id: string
          reward_count: number
          reward_tier_id: string
          target_count: number
          tier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_affiliate_id: string
          fulfilled_at?: string | null
          fulfilled_notes?: string | null
          id?: string
          reward_count?: number
          reward_tier_id: string
          target_count: number
          tier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_affiliate_id?: string
          fulfilled_at?: string | null
          fulfilled_notes?: string | null
          id?: string
          reward_count?: number
          reward_tier_id?: string
          target_count?: number
          tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_affiliate_tier_goals_event_affiliate_id_fkey"
            columns: ["event_affiliate_id"]
            isOneToOne: false
            referencedRelation: "event_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_affiliate_tier_goals_reward_tier_id_fkey"
            columns: ["reward_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_affiliate_tier_goals_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      event_affiliates: {
        Row: {
          affiliate_id: string
          commission_pct: number
          coupon_id: string | null
          created_at: string
          dashboard_token: string
          event_id: string
          id: string
          status: string
          token_expires_at: string
          token_revoked_at: string | null
          tracking_tag: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          commission_pct: number
          coupon_id?: string | null
          created_at?: string
          dashboard_token: string
          event_id: string
          id?: string
          status?: string
          token_expires_at: string
          token_revoked_at?: string | null
          tracking_tag: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          commission_pct?: number
          coupon_id?: string | null
          created_at?: string
          dashboard_token?: string
          event_id?: string
          id?: string
          status?: string
          token_expires_at?: string
          token_revoked_at?: string | null
          tracking_tag?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_affiliates_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_affiliates_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_affiliates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checklist_items: {
        Row: {
          actual_cost_cents: number | null
          assigned_to: string | null
          category: string
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          estimated_cost_cents: number | null
          event_id: string
          id: string
          notes: string | null
          runsheet_item_id: string | null
          sort_order: number | null
          status: string
          title: string
        }
        Insert: {
          actual_cost_cents?: number | null
          assigned_to?: string | null
          category: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_cost_cents?: number | null
          event_id: string
          id?: string
          notes?: string | null
          runsheet_item_id?: string | null
          sort_order?: number | null
          status?: string
          title: string
        }
        Update: {
          actual_cost_cents?: number | null
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_cost_cents?: number | null
          event_id?: string
          id?: string
          notes?: string | null
          runsheet_item_id?: string | null
          sort_order?: number | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_checklist_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklist_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklist_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklist_items_runsheet_item_id_fkey"
            columns: ["runsheet_item_id"]
            isOneToOne: false
            referencedRelation: "event_runsheet_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checklist_items_runsheet_item_id_fkey"
            columns: ["runsheet_item_id"]
            isOneToOne: false
            referencedRelation: "event_schedule_items"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checklist_templates: {
        Row: {
          category: string
          default_offset_days: number
          description: string | null
          estimated_cost_cents: number | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          title: string
        }
        Insert: {
          category: string
          default_offset_days: number
          description?: string | null
          estimated_cost_cents?: number | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title: string
        }
        Update: {
          category?: string
          default_offset_days?: number
          description?: string | null
          estimated_cost_cents?: number | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      event_email_sequences: {
        Row: {
          body_de: string
          body_en: string
          body_fr: string
          delay_days: number
          event_id: string
          id: string
          is_active: boolean
          sent_at: string | null
          sort_order: number
          subject_de: string
          subject_en: string
          subject_fr: string
        }
        Insert: {
          body_de: string
          body_en: string
          body_fr: string
          delay_days: number
          event_id: string
          id?: string
          is_active?: boolean
          sent_at?: string | null
          sort_order?: number
          subject_de: string
          subject_en: string
          subject_fr: string
        }
        Update: {
          body_de?: string
          body_en?: string
          body_fr?: string
          delay_days?: number
          event_id?: string
          id?: string
          is_active?: boolean
          sent_at?: string | null
          sort_order?: number
          subject_de?: string
          subject_en?: string
          subject_fr?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_email_sequences_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_expenses: {
        Row: {
          amount_cents: number
          category: string
          created_at: string | null
          created_by: string | null
          currency: string
          description: string
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          due_date: string | null
          event_id: string
          id: string
          notes: string | null
          paid_at: string | null
          provider_contact_id: string | null
          receipt_url: string | null
          runsheet_item_id: string | null
          updated_at: string | null
          vendor_contact: string | null
          vendor_name: string | null
        }
        Insert: {
          amount_cents: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          description: string
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          due_date?: string | null
          event_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          provider_contact_id?: string | null
          receipt_url?: string | null
          runsheet_item_id?: string | null
          updated_at?: string | null
          vendor_contact?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount_cents?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          description?: string
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          due_date?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          provider_contact_id?: string | null
          receipt_url?: string | null
          runsheet_item_id?: string | null
          updated_at?: string | null
          vendor_contact?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_expenses_provider_contact_id_fkey"
            columns: ["provider_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_expenses_runsheet_item_id_fkey"
            columns: ["runsheet_item_id"]
            isOneToOne: false
            referencedRelation: "event_runsheet_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_expenses_runsheet_item_id_fkey"
            columns: ["runsheet_item_id"]
            isOneToOne: false
            referencedRelation: "event_schedule_items"
            referencedColumns: ["id"]
          },
        ]
      }
      event_faqs: {
        Row: {
          answer_de: string | null
          answer_en: string
          answer_fr: string | null
          created_at: string
          event_id: string
          id: string
          question_de: string | null
          question_en: string
          question_fr: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer_de?: string | null
          answer_en: string
          answer_fr?: string | null
          created_at?: string
          event_id: string
          id?: string
          question_de?: string | null
          question_en: string
          question_fr?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer_de?: string | null
          answer_en?: string
          answer_fr?: string | null
          created_at?: string
          event_id?: string
          id?: string
          question_de?: string | null
          question_en?: string
          question_fr?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_faqs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_media: {
        Row: {
          created_at: string
          event_id: string
          id: string
          sort_order: number
          title: string | null
          type: Database["public"]["Enums"]["event_media_type"]
          url: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          sort_order?: number
          title?: string | null
          type: Database["public"]["Enums"]["event_media_type"]
          url: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          sort_order?: number
          title?: string | null
          type?: Database["public"]["Enums"]["event_media_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_pillars: {
        Row: {
          created_at: string
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          event_id: string
          icon: string | null
          id: string
          sort_order: number
          title_de: string | null
          title_en: string
          title_fr: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          event_id: string
          icon?: string | null
          id?: string
          sort_order?: number
          title_de?: string | null
          title_en: string
          title_fr?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          event_id?: string
          icon?: string | null
          id?: string
          sort_order?: number
          title_de?: string | null
          title_en?: string
          title_fr?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_pillars_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_runsheet_items: {
        Row: {
          assigned_to: string | null
          contact_id: string | null
          created_at: string | null
          default_duration_minutes: number | null
          description: string | null
          description_de: string | null
          description_fr: string | null
          ends_at: string | null
          event_id: string
          id: string
          is_public: boolean
          location_note: string | null
          notes: string | null
          responsible_person: string | null
          sort_order: number
          speaker_first_name: string | null
          speaker_id: string | null
          speaker_image_url: string | null
          speaker_last_name: string | null
          speaker_name: string | null
          speaker_title: string | null
          starts_at: string
          status: string
          team_member_id: string | null
          title: string
          title_de: string | null
          title_fr: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string | null
          default_duration_minutes?: number | null
          description?: string | null
          description_de?: string | null
          description_fr?: string | null
          ends_at?: string | null
          event_id: string
          id?: string
          is_public?: boolean
          location_note?: string | null
          notes?: string | null
          responsible_person?: string | null
          sort_order?: number
          speaker_first_name?: string | null
          speaker_id?: string | null
          speaker_image_url?: string | null
          speaker_last_name?: string | null
          speaker_name?: string | null
          speaker_title?: string | null
          starts_at: string
          status?: string
          team_member_id?: string | null
          title: string
          title_de?: string | null
          title_fr?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string | null
          default_duration_minutes?: number | null
          description?: string | null
          description_de?: string | null
          description_fr?: string | null
          ends_at?: string | null
          event_id?: string
          id?: string
          is_public?: boolean
          location_note?: string | null
          notes?: string | null
          responsible_person?: string | null
          sort_order?: number
          speaker_first_name?: string | null
          speaker_id?: string | null
          speaker_image_url?: string | null
          speaker_last_name?: string | null
          speaker_name?: string | null
          speaker_title?: string | null
          starts_at?: string
          status?: string
          team_member_id?: string | null
          title?: string
          title_de?: string | null
          title_fr?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_runsheet_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_runsheet_items_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_runsheet_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_runsheet_items_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_runsheet_items_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      event_runsheet_templates: {
        Row: {
          default_duration_minutes: number | null
          default_offset_minutes: number
          description: string | null
          id: string
          is_active: boolean | null
          location_note: string | null
          responsible_role: string | null
          sort_order: number | null
          title: string
        }
        Insert: {
          default_duration_minutes?: number | null
          default_offset_minutes: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          location_note?: string | null
          responsible_role?: string | null
          sort_order?: number | null
          title: string
        }
        Update: {
          default_duration_minutes?: number | null
          default_offset_minutes?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          location_note?: string | null
          responsible_role?: string | null
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      event_speakers: {
        Row: {
          created_at: string
          event_id: string
          is_featured: boolean
          role_label_de: string | null
          role_label_en: string | null
          role_label_fr: string | null
          sort_order: number
          speaker_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          is_featured?: boolean
          role_label_de?: string | null
          role_label_en?: string | null
          role_label_fr?: string | null
          sort_order?: number
          speaker_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          is_featured?: boolean
          role_label_de?: string | null
          role_label_en?: string | null
          role_label_fr?: string | null
          sort_order?: number
          speaker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_speakers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_speakers_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sponsors: {
        Row: {
          company_name: string
          contact_email: string | null
          contact_first_name: string | null
          contact_id: string | null
          contact_last_name: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          currency: string
          deal_value_cents: number | null
          deliverables: string | null
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          event_id: string
          id: string
          logo_url: string | null
          notes: string | null
          sector: string | null
          sort_order: number
          status: Database["public"]["Enums"]["sponsor_status"]
          tier: Database["public"]["Enums"]["sponsor_tier"]
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          contact_first_name?: string | null
          contact_id?: string | null
          contact_last_name?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          deal_value_cents?: number | null
          deliverables?: string | null
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          event_id: string
          id?: string
          logo_url?: string | null
          notes?: string | null
          sector?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["sponsor_status"]
          tier?: Database["public"]["Enums"]["sponsor_tier"]
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          contact_first_name?: string | null
          contact_id?: string | null
          contact_last_name?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          deal_value_cents?: number | null
          deliverables?: string | null
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          event_id?: string
          id?: string
          logo_url?: string | null
          notes?: string | null
          sector?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["sponsor_status"]
          tier?: Database["public"]["Enums"]["sponsor_tier"]
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sponsors_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sponsors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sponsors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_team_member_quota_overrides: {
        Row: {
          created_at: string | null
          created_by: string | null
          discount_type: string | null
          discount_value: number | null
          event_id: string
          profile_id: string
          quota: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          discount_type?: string | null
          discount_value?: number | null
          event_id: string
          profile_id: string
          quota: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          discount_type?: string | null
          discount_value?: number | null
          event_id?: string
          profile_id?: string
          quota?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_team_member_quota_overrides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_team_member_quota_overrides_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_team_member_quota_overrides_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_testimonials: {
        Row: {
          author_name: string
          author_photo_url: string | null
          author_role_de: string | null
          author_role_en: string | null
          author_role_fr: string | null
          created_at: string
          event_id: string
          id: string
          is_featured: boolean
          quote_de: string | null
          quote_en: string
          quote_fr: string | null
          rating: number | null
          sort_order: number
          source_label: string | null
          source_url: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_name: string
          author_photo_url?: string | null
          author_role_de?: string | null
          author_role_en?: string | null
          author_role_fr?: string | null
          created_at?: string
          event_id: string
          id?: string
          is_featured?: boolean
          quote_de?: string | null
          quote_en: string
          quote_fr?: string | null
          rating?: number | null
          sort_order?: number
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_name?: string
          author_photo_url?: string | null
          author_role_de?: string | null
          author_role_en?: string | null
          author_role_fr?: string | null
          created_at?: string
          event_id?: string
          id?: string
          is_featured?: boolean
          quote_de?: string | null
          quote_en?: string
          quote_fr?: string | null
          rating?: number | null
          sort_order?: number
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_testimonials_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          aftercare_emails_enabled: boolean
          catering_eligible_roles: Database["public"]["Enums"]["involvement_role"][]
          catering_enabled: boolean
          chapter_companion_tier_id: string | null
          chapter_companion_value_tier_id: string | null
          chapter_delegate_program_enabled: boolean
          chapter_delegate_tier_id: string | null
          check_in_closes_minutes_after: number
          check_in_opens_minutes_before: number
          city: string | null
          country: string
          coupons_enabled: boolean
          cover_image_url: string | null
          created_at: string
          delegate_review_notify_email: string | null
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          door_sale_enabled: boolean
          enabled_payment_methods: string[]
          ends_at: string
          event_branch: string
          event_type: Database["public"]["Enums"]["event_type"]
          external_url: string | null
          feedback_survey_url: string | null
          funnel_brand_accent_hex: string | null
          funnel_closing_de: string | null
          funnel_closing_en: string | null
          funnel_closing_fr: string | null
          funnel_intro_de: string | null
          funnel_intro_en: string | null
          funnel_intro_fr: string | null
          funnel_tagline_de: string | null
          funnel_tagline_en: string | null
          funnel_tagline_fr: string | null
          hero_darkening_strength: number
          hero_overlay_image_url: string | null
          hero_overlay_text_de: string | null
          hero_overlay_text_en: string | null
          hero_overlay_text_fr: string | null
          hero_video_url: string | null
          id: string
          is_published: boolean
          max_tickets_per_order: number
          max_total_tickets: number | null
          og_image_url: string | null
          photo_consent_text_de: string | null
          photo_consent_text_en: string | null
          photo_consent_text_fr: string | null
          poster_config: Json | null
          refund_policy_days: number
          refund_policy_text_de: string | null
          refund_policy_text_en: string | null
          refund_policy_text_fr: string | null
          reminder_emails_offsets_hours: number[]
          requires_photo_consent: boolean
          sales_target_revenue_cents: number | null
          sales_target_tickets: number | null
          scarcity_threshold: number
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          starts_at: string
          team_invite_applicable_tier_ids: string[]
          team_invite_discount_type: string
          team_invite_discount_value: number
          team_invite_quota: number
          team_invite_tier_id: string | null
          team_member_tier_id: string | null
          ticket_pdf_hero_url: string | null
          ticket_transfer_cutoff_hours: number
          ticket_transfer_enabled: boolean
          timezone: string
          title_de: string
          title_en: string
          title_fr: string
          updated_at: string
          venue_address: string | null
          venue_name: string | null
          waitlist_enabled: boolean
        }
        Insert: {
          aftercare_emails_enabled?: boolean
          catering_eligible_roles?: Database["public"]["Enums"]["involvement_role"][]
          catering_enabled?: boolean
          chapter_companion_tier_id?: string | null
          chapter_companion_value_tier_id?: string | null
          chapter_delegate_program_enabled?: boolean
          chapter_delegate_tier_id?: string | null
          check_in_closes_minutes_after?: number
          check_in_opens_minutes_before?: number
          city?: string | null
          country?: string
          coupons_enabled?: boolean
          cover_image_url?: string | null
          created_at?: string
          delegate_review_notify_email?: string | null
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          door_sale_enabled?: boolean
          enabled_payment_methods?: string[]
          ends_at: string
          event_branch?: string
          event_type: Database["public"]["Enums"]["event_type"]
          external_url?: string | null
          feedback_survey_url?: string | null
          funnel_brand_accent_hex?: string | null
          funnel_closing_de?: string | null
          funnel_closing_en?: string | null
          funnel_closing_fr?: string | null
          funnel_intro_de?: string | null
          funnel_intro_en?: string | null
          funnel_intro_fr?: string | null
          funnel_tagline_de?: string | null
          funnel_tagline_en?: string | null
          funnel_tagline_fr?: string | null
          hero_darkening_strength?: number
          hero_overlay_image_url?: string | null
          hero_overlay_text_de?: string | null
          hero_overlay_text_en?: string | null
          hero_overlay_text_fr?: string | null
          hero_video_url?: string | null
          id?: string
          is_published?: boolean
          max_tickets_per_order?: number
          max_total_tickets?: number | null
          og_image_url?: string | null
          photo_consent_text_de?: string | null
          photo_consent_text_en?: string | null
          photo_consent_text_fr?: string | null
          poster_config?: Json | null
          refund_policy_days?: number
          refund_policy_text_de?: string | null
          refund_policy_text_en?: string | null
          refund_policy_text_fr?: string | null
          reminder_emails_offsets_hours?: number[]
          requires_photo_consent?: boolean
          sales_target_revenue_cents?: number | null
          sales_target_tickets?: number | null
          scarcity_threshold?: number
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          starts_at: string
          team_invite_applicable_tier_ids?: string[]
          team_invite_discount_type?: string
          team_invite_discount_value?: number
          team_invite_quota?: number
          team_invite_tier_id?: string | null
          team_member_tier_id?: string | null
          ticket_pdf_hero_url?: string | null
          ticket_transfer_cutoff_hours?: number
          ticket_transfer_enabled?: boolean
          timezone?: string
          title_de: string
          title_en: string
          title_fr: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
          waitlist_enabled?: boolean
        }
        Update: {
          aftercare_emails_enabled?: boolean
          catering_eligible_roles?: Database["public"]["Enums"]["involvement_role"][]
          catering_enabled?: boolean
          chapter_companion_tier_id?: string | null
          chapter_companion_value_tier_id?: string | null
          chapter_delegate_program_enabled?: boolean
          chapter_delegate_tier_id?: string | null
          check_in_closes_minutes_after?: number
          check_in_opens_minutes_before?: number
          city?: string | null
          country?: string
          coupons_enabled?: boolean
          cover_image_url?: string | null
          created_at?: string
          delegate_review_notify_email?: string | null
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          door_sale_enabled?: boolean
          enabled_payment_methods?: string[]
          ends_at?: string
          event_branch?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          external_url?: string | null
          feedback_survey_url?: string | null
          funnel_brand_accent_hex?: string | null
          funnel_closing_de?: string | null
          funnel_closing_en?: string | null
          funnel_closing_fr?: string | null
          funnel_intro_de?: string | null
          funnel_intro_en?: string | null
          funnel_intro_fr?: string | null
          funnel_tagline_de?: string | null
          funnel_tagline_en?: string | null
          funnel_tagline_fr?: string | null
          hero_darkening_strength?: number
          hero_overlay_image_url?: string | null
          hero_overlay_text_de?: string | null
          hero_overlay_text_en?: string | null
          hero_overlay_text_fr?: string | null
          hero_video_url?: string | null
          id?: string
          is_published?: boolean
          max_tickets_per_order?: number
          max_total_tickets?: number | null
          og_image_url?: string | null
          photo_consent_text_de?: string | null
          photo_consent_text_en?: string | null
          photo_consent_text_fr?: string | null
          poster_config?: Json | null
          refund_policy_days?: number
          refund_policy_text_de?: string | null
          refund_policy_text_en?: string | null
          refund_policy_text_fr?: string | null
          reminder_emails_offsets_hours?: number[]
          requires_photo_consent?: boolean
          sales_target_revenue_cents?: number | null
          sales_target_tickets?: number | null
          scarcity_threshold?: number
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          starts_at?: string
          team_invite_applicable_tier_ids?: string[]
          team_invite_discount_type?: string
          team_invite_discount_value?: number
          team_invite_quota?: number
          team_invite_tier_id?: string | null
          team_member_tier_id?: string | null
          ticket_pdf_hero_url?: string | null
          ticket_transfer_cutoff_hours?: number
          ticket_transfer_enabled?: boolean
          timezone?: string
          title_de?: string
          title_en?: string
          title_fr?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
          waitlist_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "events_chapter_companion_tier_id_fkey"
            columns: ["chapter_companion_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_chapter_companion_value_tier_id_fkey"
            columns: ["chapter_companion_value_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_chapter_delegate_tier_id_fkey"
            columns: ["chapter_delegate_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_team_invite_tier_id_fkey"
            columns: ["team_invite_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_team_member_tier_id_fkey"
            columns: ["team_member_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_events: {
        Row: {
          event_type: string
          funnel_id: string
          happened_at: string
          id: number
          locale: string | null
          referrer: string | null
          session_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          event_type: string
          funnel_id: string
          happened_at?: string
          id?: never
          locale?: string | null
          referrer?: string | null
          session_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          event_type?: string
          funnel_id?: string
          happened_at?: string
          id?: never
          locale?: string | null
          referrer?: string | null
          session_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_events_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          content_de: Json
          content_en: Json
          content_fr: Json
          created_at: string
          created_by: string | null
          cta_href: string | null
          cta_type: string
          hero_image_url: string | null
          id: string
          linked_event_id: string | null
          og_image_url: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          content_de?: Json
          content_en?: Json
          content_fr?: Json
          created_at?: string
          created_by?: string | null
          cta_href?: string | null
          cta_type: string
          hero_image_url?: string | null
          id?: string
          linked_event_id?: string | null
          og_image_url?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          content_de?: Json
          content_en?: Json
          content_fr?: Json
          created_at?: string
          created_by?: string | null
          cta_href?: string | null
          cta_type?: string
          hero_image_url?: string | null
          id?: string
          linked_event_id?: string | null
          og_image_url?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnels_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      incubation_applications: {
        Row: {
          company_name: string | null
          company_stage: string | null
          company_website: string | null
          contact_id: string | null
          country: string | null
          created_at: string
          diaspora_link: boolean | null
          diaspora_origin_country: string | null
          founder_age: number | null
          founder_birthday: string | null
          founder_email: string
          founder_first_name: string
          founder_gender: Database["public"]["Enums"]["gender_identity"] | null
          founder_last_name: string | null
          founder_name: string
          founder_phone: string | null
          funding_needed_cents: number | null
          has_idea: boolean | null
          has_prior_accompaniment: boolean | null
          heard_about_us: string | null
          heard_about_us_other: string | null
          id: string
          idea_ambitions: string | null
          idea_audience: string | null
          idea_development_stage: string | null
          idea_problem: string | null
          industry_sectors: string[]
          industry_sectors_other: string | null
          locale: string
          pitch: string | null
          profile_type: string | null
          profile_type_other: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          services_wanted: string[]
          services_wanted_other: string | null
          status: Database["public"]["Enums"]["incubation_application_status"]
          updated_at: string
          why_join: string | null
        }
        Insert: {
          company_name?: string | null
          company_stage?: string | null
          company_website?: string | null
          contact_id?: string | null
          country?: string | null
          created_at?: string
          diaspora_link?: boolean | null
          diaspora_origin_country?: string | null
          founder_age?: number | null
          founder_birthday?: string | null
          founder_email: string
          founder_first_name: string
          founder_gender?: Database["public"]["Enums"]["gender_identity"] | null
          founder_last_name?: string | null
          founder_name: string
          founder_phone?: string | null
          funding_needed_cents?: number | null
          has_idea?: boolean | null
          has_prior_accompaniment?: boolean | null
          heard_about_us?: string | null
          heard_about_us_other?: string | null
          id?: string
          idea_ambitions?: string | null
          idea_audience?: string | null
          idea_development_stage?: string | null
          idea_problem?: string | null
          industry_sectors?: string[]
          industry_sectors_other?: string | null
          locale?: string
          pitch?: string | null
          profile_type?: string | null
          profile_type_other?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          services_wanted?: string[]
          services_wanted_other?: string | null
          status?: Database["public"]["Enums"]["incubation_application_status"]
          updated_at?: string
          why_join?: string | null
        }
        Update: {
          company_name?: string | null
          company_stage?: string | null
          company_website?: string | null
          contact_id?: string | null
          country?: string | null
          created_at?: string
          diaspora_link?: boolean | null
          diaspora_origin_country?: string | null
          founder_age?: number | null
          founder_birthday?: string | null
          founder_email?: string
          founder_first_name?: string
          founder_gender?: Database["public"]["Enums"]["gender_identity"] | null
          founder_last_name?: string | null
          founder_name?: string
          founder_phone?: string | null
          funding_needed_cents?: number | null
          has_idea?: boolean | null
          has_prior_accompaniment?: boolean | null
          heard_about_us?: string | null
          heard_about_us_other?: string | null
          id?: string
          idea_ambitions?: string | null
          idea_audience?: string | null
          idea_development_stage?: string | null
          idea_problem?: string | null
          industry_sectors?: string[]
          industry_sectors_other?: string | null
          locale?: string
          pitch?: string | null
          profile_type?: string | null
          profile_type_other?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          services_wanted?: string[]
          services_wanted_other?: string | null
          status?: Database["public"]["Enums"]["incubation_application_status"]
          updated_at?: string
          why_join?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incubation_applications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incubation_applications_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_birthday: string | null
          applicant_country: string | null
          applicant_email: string
          applicant_first_name: string
          applicant_gender:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          applicant_last_name: string | null
          applicant_name: string
          applicant_phone: string | null
          cover_letter: string | null
          created_at: string | null
          id: string
          job_offer_id: string | null
          linkedin_url: string | null
          locale: string | null
          portfolio_url: string | null
          resume_url: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["job_application_status"] | null
          updated_at: string | null
        }
        Insert: {
          applicant_birthday?: string | null
          applicant_country?: string | null
          applicant_email: string
          applicant_first_name: string
          applicant_gender?:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          applicant_last_name?: string | null
          applicant_name: string
          applicant_phone?: string | null
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          job_offer_id?: string | null
          linkedin_url?: string | null
          locale?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["job_application_status"] | null
          updated_at?: string | null
        }
        Update: {
          applicant_birthday?: string | null
          applicant_country?: string | null
          applicant_email?: string
          applicant_first_name?: string
          applicant_gender?:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          applicant_last_name?: string | null
          applicant_name?: string
          applicant_phone?: string | null
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          job_offer_id?: string | null
          linkedin_url?: string | null
          locale?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["job_application_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_offer_id_fkey"
            columns: ["job_offer_id"]
            isOneToOne: false
            referencedRelation: "job_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      job_offers: {
        Row: {
          created_at: string | null
          department: string | null
          description_de: string | null
          description_en: string
          description_fr: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          id: string
          is_published: boolean | null
          location: string
          requirements_de: string | null
          requirements_en: string | null
          requirements_fr: string | null
          sort_order: number | null
          title_de: string | null
          title_en: string
          title_fr: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          description_de?: string | null
          description_en: string
          description_fr?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          is_published?: boolean | null
          location?: string
          requirements_de?: string | null
          requirements_en?: string | null
          requirements_fr?: string | null
          sort_order?: number | null
          title_de?: string | null
          title_en: string
          title_fr?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          description_de?: string | null
          description_en?: string
          description_fr?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          is_published?: boolean | null
          location?: string
          requirements_de?: string | null
          requirements_en?: string | null
          requirements_fr?: string | null
          sort_order?: number | null
          title_de?: string | null
          title_en?: string
          title_fr?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kpi_snapshots: {
        Row: {
          check_ins: number
          created_at: string
          event_id: string | null
          id: number
          revenue_cents: number
          snapshot_date: string
          tickets_sold: number
          unique_visitors: number
        }
        Insert: {
          check_ins?: number
          created_at?: string
          event_id?: string | null
          id?: never
          revenue_cents?: number
          snapshot_date: string
          tickets_sold?: number
          unique_visitors?: number
        }
        Update: {
          check_ins?: number
          created_at?: string
          event_id?: string | null
          id?: never
          revenue_cents?: number
          snapshot_date?: string
          tickets_sold?: number
          unique_visitors?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_snapshots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_pages: {
        Row: {
          body_markdown: string
          document_type: string
          draft_updated_at: string
          draft_updated_by: string | null
          locale: string
          published_at: string | null
          published_body_markdown: string | null
          published_by: string | null
          published_title: string | null
          title: string
        }
        Insert: {
          body_markdown?: string
          document_type: string
          draft_updated_at?: string
          draft_updated_by?: string | null
          locale: string
          published_at?: string | null
          published_body_markdown?: string | null
          published_by?: string | null
          published_title?: string | null
          title?: string
        }
        Update: {
          body_markdown?: string
          document_type?: string
          draft_updated_at?: string
          draft_updated_by?: string | null
          locale?: string
          published_at?: string | null
          published_body_markdown?: string | null
          published_by?: string | null
          published_title?: string | null
          title?: string
        }
        Relationships: []
      }
      mfa_backup_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      news_categories: {
        Row: {
          color: string | null
          created_at: string
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          id: string
          image_url: string | null
          name_de: string | null
          name_en: string
          name_fr: string | null
          seo_description_de: string | null
          seo_description_en: string | null
          seo_description_fr: string | null
          seo_title_de: string | null
          seo_title_en: string | null
          seo_title_fr: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          image_url?: string | null
          name_de?: string | null
          name_en: string
          name_fr?: string | null
          seo_description_de?: string | null
          seo_description_en?: string | null
          seo_description_fr?: string | null
          seo_title_de?: string | null
          seo_title_en?: string | null
          seo_title_fr?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          image_url?: string | null
          name_de?: string | null
          name_en?: string
          name_fr?: string | null
          seo_description_de?: string | null
          seo_description_en?: string | null
          seo_description_fr?: string | null
          seo_title_de?: string | null
          seo_title_en?: string | null
          seo_title_fr?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      news_category_links: {
        Row: {
          added_at: string
          added_by: string | null
          category_id: string
          is_primary: boolean
          post_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          category_id: string
          is_primary?: boolean
          post_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          category_id?: string
          is_primary?: boolean
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_category_links_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_category_links_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "news_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_category_links_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "news_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      news_posts: {
        Row: {
          author_name: string | null
          body_de: string
          body_en: string
          body_fr: string
          canonical_url: string | null
          cover_image_url: string | null
          created_at: string
          excerpt_de: string | null
          excerpt_en: string | null
          excerpt_fr: string | null
          focus_keyword_de: string | null
          focus_keyword_en: string | null
          focus_keyword_fr: string | null
          id: string
          is_pillar: boolean
          is_published: boolean
          og_description_de: string | null
          og_description_en: string | null
          og_description_fr: string | null
          og_image_url: string | null
          og_title_de: string | null
          og_title_en: string | null
          og_title_fr: string | null
          pillar_id: string | null
          published_at: string | null
          robots_nofollow: boolean
          robots_noindex: boolean
          schema_type: string
          seo_description: string | null
          seo_description_de: string | null
          seo_description_en: string | null
          seo_description_fr: string | null
          seo_keywords: string | null
          seo_title: string | null
          seo_title_de: string | null
          seo_title_en: string | null
          seo_title_fr: string | null
          slug: string
          title_de: string
          title_en: string
          title_fr: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          body_de: string
          body_en: string
          body_fr: string
          canonical_url?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt_de?: string | null
          excerpt_en?: string | null
          excerpt_fr?: string | null
          focus_keyword_de?: string | null
          focus_keyword_en?: string | null
          focus_keyword_fr?: string | null
          id?: string
          is_pillar?: boolean
          is_published?: boolean
          og_description_de?: string | null
          og_description_en?: string | null
          og_description_fr?: string | null
          og_image_url?: string | null
          og_title_de?: string | null
          og_title_en?: string | null
          og_title_fr?: string | null
          pillar_id?: string | null
          published_at?: string | null
          robots_nofollow?: boolean
          robots_noindex?: boolean
          schema_type?: string
          seo_description?: string | null
          seo_description_de?: string | null
          seo_description_en?: string | null
          seo_description_fr?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          seo_title_de?: string | null
          seo_title_en?: string | null
          seo_title_fr?: string | null
          slug: string
          title_de: string
          title_en: string
          title_fr: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          body_de?: string
          body_en?: string
          body_fr?: string
          canonical_url?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt_de?: string | null
          excerpt_en?: string | null
          excerpt_fr?: string | null
          focus_keyword_de?: string | null
          focus_keyword_en?: string | null
          focus_keyword_fr?: string | null
          id?: string
          is_pillar?: boolean
          is_published?: boolean
          og_description_de?: string | null
          og_description_en?: string | null
          og_description_fr?: string | null
          og_image_url?: string | null
          og_title_de?: string | null
          og_title_en?: string | null
          og_title_fr?: string | null
          pillar_id?: string | null
          published_at?: string | null
          robots_nofollow?: boolean
          robots_noindex?: boolean
          schema_type?: string
          seo_description?: string | null
          seo_description_de?: string | null
          seo_description_en?: string | null
          seo_description_fr?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          seo_title_de?: string | null
          seo_title_en?: string | null
          seo_title_fr?: string | null
          slug?: string
          title_de?: string
          title_en?: string
          title_fr?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_posts_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "news_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      news_slug_history: {
        Row: {
          created_at: string
          id: string
          old_slug: string
          post_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          old_slug: string
          post_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          old_slug?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_slug_history_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "news_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_sends: {
        Row: {
          clicked_at: string | null
          contact_id: string | null
          email: string
          error: string | null
          id: string
          newsletter_id: string
          opened_at: string | null
          resend_message_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["newsletter_send_status"]
          unsubscribed_at: string | null
        }
        Insert: {
          clicked_at?: string | null
          contact_id?: string | null
          email: string
          error?: string | null
          id?: string
          newsletter_id: string
          opened_at?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["newsletter_send_status"]
          unsubscribed_at?: string | null
        }
        Update: {
          clicked_at?: string | null
          contact_id?: string | null
          email?: string
          error?: string | null
          id?: string
          newsletter_id?: string
          opened_at?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["newsletter_send_status"]
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_sends_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_sends_newsletter_id_fkey"
            columns: ["newsletter_id"]
            isOneToOne: false
            referencedRelation: "newsletters"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletters: {
        Row: {
          body_mdx: string
          bounces_count: number
          clicks_count: number
          created_at: string
          created_by: string | null
          exclude_category_slugs: string[]
          from_email: string
          from_name: string
          id: string
          locale: string
          opens_count: number
          preheader: string | null
          recipients_count: number | null
          reply_to: string | null
          resend_broadcast_id: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["newsletter_status"]
          subject: string
          target_category_slugs: string[]
          unsubscribes_count: number
          updated_at: string
        }
        Insert: {
          body_mdx?: string
          bounces_count?: number
          clicks_count?: number
          created_at?: string
          created_by?: string | null
          exclude_category_slugs?: string[]
          from_email?: string
          from_name?: string
          id?: string
          locale?: string
          opens_count?: number
          preheader?: string | null
          recipients_count?: number | null
          reply_to?: string | null
          resend_broadcast_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["newsletter_status"]
          subject: string
          target_category_slugs?: string[]
          unsubscribes_count?: number
          updated_at?: string
        }
        Update: {
          body_mdx?: string
          bounces_count?: number
          clicks_count?: number
          created_at?: string
          created_by?: string | null
          exclude_category_slugs?: string[]
          from_email?: string
          from_name?: string
          id?: string
          locale?: string
          opens_count?: number
          preheader?: string | null
          recipients_count?: number | null
          reply_to?: string | null
          resend_broadcast_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["newsletter_status"]
          subject?: string
          target_category_slugs?: string[]
          unsubscribes_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          email: boolean
          in_app: boolean
          notification_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          email?: boolean
          in_app?: boolean
          notification_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          email?: boolean
          in_app?: boolean
          notification_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          acquisition_type: Database["public"]["Enums"]["acquisition_type"]
          amount_refunded_cents: number
          ask_speaker_email_sent_at: string | null
          buyer_id: string | null
          contact_id: string | null
          coupon_id: string | null
          created_at: string
          currency: string
          discount_cents: number
          email_sent_at: string | null
          event_id: string
          id: string
          locale: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          receipt_email_message_id: string | null
          recipient_email: string
          recipient_first_name: string
          recipient_gender:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          recipient_last_name: string | null
          recipient_name: string
          recipient_title: string | null
          reminder_sent_at: string | null
          reservation_expires_at: string | null
          revocation_waived: boolean
          revocation_waived_at: string | null
          revocation_waived_ip: unknown
          sold_by: string | null
          source: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          acquisition_type?: Database["public"]["Enums"]["acquisition_type"]
          amount_refunded_cents?: number
          ask_speaker_email_sent_at?: string | null
          buyer_id?: string | null
          contact_id?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          discount_cents?: number
          email_sent_at?: string | null
          event_id: string
          id?: string
          locale?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          receipt_email_message_id?: string | null
          recipient_email: string
          recipient_first_name: string
          recipient_gender?:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          recipient_last_name?: string | null
          recipient_name: string
          recipient_title?: string | null
          reminder_sent_at?: string | null
          reservation_expires_at?: string | null
          revocation_waived?: boolean
          revocation_waived_at?: string | null
          revocation_waived_ip?: unknown
          sold_by?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents: number
          total_cents: number
          updated_at?: string
        }
        Update: {
          acquisition_type?: Database["public"]["Enums"]["acquisition_type"]
          amount_refunded_cents?: number
          ask_speaker_email_sent_at?: string | null
          buyer_id?: string | null
          contact_id?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          discount_cents?: number
          email_sent_at?: string | null
          event_id?: string
          id?: string
          locale?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          receipt_email_message_id?: string | null
          recipient_email?: string
          recipient_first_name?: string
          recipient_gender?:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          recipient_last_name?: string | null
          recipient_name?: string
          recipient_title?: string | null
          reminder_sent_at?: string | null
          reservation_expires_at?: string | null
          revocation_waived?: boolean
          revocation_waived_at?: string | null
          revocation_waived_ip?: unknown
          sold_by?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_templates: {
        Row: {
          body_de: string
          body_en: string
          body_fr: string
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          reply_to: string
          slug: string
          sort_order: number
          subject_de: string
          subject_en: string
          subject_fr: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body_de: string
          body_en: string
          body_fr: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          reply_to: string
          slug: string
          sort_order?: number
          subject_de: string
          subject_en: string
          subject_fr: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body_de?: string
          body_en?: string
          body_fr?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          reply_to?: string
          slug?: string
          sort_order?: number
          subject_de?: string
          subject_en?: string
          subject_fr?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_authors: {
        Row: {
          author_id: string
          post_id: string
          role: string
          sort_order: number
        }
        Insert: {
          author_id: string
          post_id: string
          role?: string
          sort_order?: number
        }
        Update: {
          author_id?: string
          post_id?: string
          role?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_authors_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_authors_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "news_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_webhooks: {
        Row: {
          id: string
          processed_at: string
          source: string
        }
        Insert: {
          id: string
          processed_at?: string
          source?: string
        }
        Update: {
          id?: string
          processed_at?: string
          source?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_line1: string | null
          address_line2: string | null
          address_postal_code: string | null
          address_state: string | null
          avatar_url: string | null
          birthday: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email_notifications: boolean
          first_name: string | null
          gender: Database["public"]["Enums"]["gender_identity"] | null
          id: string
          last_name: string | null
          locale: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          theme: string
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_line1?: string | null
          address_line2?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          avatar_url?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email_notifications?: boolean
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender_identity"] | null
          id: string
          last_name?: string | null
          locale?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          theme?: string
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_line1?: string | null
          address_line2?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          avatar_url?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email_notifications?: boolean
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender_identity"] | null
          id?: string
          last_name?: string | null
          locale?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          theme?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          default_currency: string
          id: number
          maintenance_message_de: string
          maintenance_message_en: string
          maintenance_message_fr: string
          maintenance_mode: boolean
          press_email: string
          support_email: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          default_currency?: string
          id?: number
          maintenance_message_de?: string
          maintenance_message_en?: string
          maintenance_message_fr?: string
          maintenance_mode?: boolean
          press_email?: string
          support_email?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          default_currency?: string
          id?: number
          maintenance_message_de?: string
          maintenance_message_en?: string
          maintenance_message_fr?: string
          maintenance_mode?: boolean
          press_email?: string
          support_email?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_testimonials: {
        Row: {
          author_name: string
          author_photo_url: string | null
          author_role_de: string | null
          author_role_en: string | null
          author_role_fr: string | null
          created_at: string
          id: string
          is_featured: boolean
          quote_de: string | null
          quote_en: string
          quote_fr: string | null
          rating: number | null
          sort_order: number
          source_label: string | null
          source_url: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_name: string
          author_photo_url?: string | null
          author_role_de?: string | null
          author_role_en?: string | null
          author_role_fr?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          quote_de?: string | null
          quote_en: string
          quote_fr?: string | null
          rating?: number | null
          sort_order?: number
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_name?: string
          author_photo_url?: string | null
          author_role_de?: string | null
          author_role_en?: string | null
          author_role_fr?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          quote_de?: string | null
          quote_en?: string
          quote_fr?: string | null
          rating?: number | null
          sort_order?: number
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      speaker_questions: {
        Row: {
          admin_notes: string | null
          attendee_email: string
          attendee_name: string
          created_at: string
          event_id: string
          id: string
          locale: string
          order_id: string
          question: string
          speaker_id: string
          status: Database["public"]["Enums"]["speaker_question_status"]
          ticket_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          attendee_email: string
          attendee_name: string
          created_at?: string
          event_id: string
          id?: string
          locale: string
          order_id: string
          question: string
          speaker_id: string
          status?: Database["public"]["Enums"]["speaker_question_status"]
          ticket_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          attendee_email?: string
          attendee_name?: string
          created_at?: string
          event_id?: string
          id?: string
          locale?: string
          order_id?: string
          question?: string
          speaker_id?: string
          status?: Database["public"]["Enums"]["speaker_question_status"]
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "speaker_questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaker_questions_event_speaker_fk"
            columns: ["event_id", "speaker_id"]
            isOneToOne: false
            referencedRelation: "event_speakers"
            referencedColumns: ["event_id", "speaker_id"]
          },
          {
            foreignKeyName: "speaker_questions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaker_questions_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaker_questions_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      speakers: {
        Row: {
          bio_de: string | null
          bio_en: string | null
          bio_fr: string | null
          company_de: string | null
          company_en: string | null
          company_fr: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          linkedin_url: string | null
          photo_url: string | null
          slug: string
          team_member_id: string | null
          title_de: string | null
          title_en: string | null
          title_fr: string | null
          twitter_url: string | null
          updated_at: string
          updated_by: string | null
          visibility: Database["public"]["Enums"]["team_member_visibility"]
          website_url: string | null
        }
        Insert: {
          bio_de?: string | null
          bio_en?: string | null
          bio_fr?: string | null
          company_de?: string | null
          company_en?: string | null
          company_fr?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          linkedin_url?: string | null
          photo_url?: string | null
          slug: string
          team_member_id?: string | null
          title_de?: string | null
          title_en?: string | null
          title_fr?: string | null
          twitter_url?: string | null
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["team_member_visibility"]
          website_url?: string | null
        }
        Update: {
          bio_de?: string | null
          bio_en?: string | null
          bio_fr?: string | null
          company_de?: string | null
          company_en?: string | null
          company_fr?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          linkedin_url?: string | null
          photo_url?: string | null
          slug?: string
          team_member_id?: string | null
          title_de?: string | null
          title_en?: string | null
          title_fr?: string | null
          twitter_url?: string | null
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["team_member_visibility"]
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "speakers_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speakers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_event_assignments: {
        Row: {
          event_id: string
          staff_id: string
        }
        Insert: {
          event_id: string
          staff_id: string
        }
        Update: {
          event_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_event_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_event_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          bio_de: string | null
          bio_en: string | null
          bio_fr: string | null
          birthday: string | null
          country: string | null
          created_at: string
          email: string | null
          featured_on_about: boolean
          first_name: string
          gender: Database["public"]["Enums"]["gender_identity"] | null
          id: string
          last_name: string | null
          linkedin_url: string | null
          name: string
          photo_url: string | null
          profile_id: string | null
          role_de: string | null
          role_en: string
          role_fr: string | null
          slug: string
          sort_order: number
          updated_at: string
          updated_by: string | null
          visibility: Database["public"]["Enums"]["team_member_visibility"]
          website_url: string | null
        }
        Insert: {
          bio_de?: string | null
          bio_en?: string | null
          bio_fr?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          featured_on_about?: boolean
          first_name: string
          gender?: Database["public"]["Enums"]["gender_identity"] | null
          id?: string
          last_name?: string | null
          linkedin_url?: string | null
          name: string
          photo_url?: string | null
          profile_id?: string | null
          role_de?: string | null
          role_en: string
          role_fr?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["team_member_visibility"]
          website_url?: string | null
        }
        Update: {
          bio_de?: string | null
          bio_en?: string | null
          bio_fr?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          featured_on_about?: boolean
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_identity"] | null
          id?: string
          last_name?: string | null
          linkedin_url?: string | null
          name?: string
          photo_url?: string | null
          profile_id?: string | null
          role_de?: string | null
          role_en?: string
          role_fr?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["team_member_visibility"]
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_catering_selections: {
        Row: {
          created_at: string | null
          id: string
          menu_item_id: string
          notes: string | null
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          menu_item_id: string
          notes?: string | null
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          menu_item_id?: string
          notes?: string | null
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_catering_selections_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "catering_menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_catering_selections_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_tiers: {
        Row: {
          catering_included: boolean
          counts_as_sold: boolean
          created_at: string
          currency: string
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          event_id: string
          headline_de: string | null
          headline_en: string | null
          headline_fr: string | null
          id: string
          is_companion: boolean
          is_public: boolean
          is_team: boolean
          low_stock_threshold_pct: number
          max_quantity: number | null
          name_de: string
          name_en: string
          name_fr: string
          original_price_cents: number | null
          perks: Json
          price_cents: number
          purpose: string
          quantity_sold: number
          sales_end_at: string | null
          sales_start_at: string | null
          scanner_badge_label: string | null
          slug: string
          sort_order: number
          stripe_price_archived_ids: string[]
          stripe_price_id: string | null
          stripe_product_id: string | null
        }
        Insert: {
          catering_included?: boolean
          counts_as_sold?: boolean
          created_at?: string
          currency?: string
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          event_id: string
          headline_de?: string | null
          headline_en?: string | null
          headline_fr?: string | null
          id?: string
          is_companion?: boolean
          is_public?: boolean
          is_team?: boolean
          low_stock_threshold_pct?: number
          max_quantity?: number | null
          name_de: string
          name_en: string
          name_fr: string
          original_price_cents?: number | null
          perks?: Json
          price_cents: number
          purpose?: string
          quantity_sold?: number
          sales_end_at?: string | null
          sales_start_at?: string | null
          scanner_badge_label?: string | null
          slug: string
          sort_order?: number
          stripe_price_archived_ids?: string[]
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Update: {
          catering_included?: boolean
          counts_as_sold?: boolean
          created_at?: string
          currency?: string
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          event_id?: string
          headline_de?: string | null
          headline_en?: string | null
          headline_fr?: string | null
          id?: string
          is_companion?: boolean
          is_public?: boolean
          is_team?: boolean
          low_stock_threshold_pct?: number
          max_quantity?: number | null
          name_de?: string
          name_en?: string
          name_fr?: string
          original_price_cents?: number | null
          perks?: Json
          price_cents?: number
          purpose?: string
          quantity_sold?: number
          sales_end_at?: string | null
          sales_start_at?: string | null
          scanner_badge_label?: string | null
          slug?: string
          sort_order?: number
          stripe_price_archived_ids?: string[]
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          attendee_birthday: string | null
          attendee_email: string
          attendee_first_name: string
          attendee_gender: Database["public"]["Enums"]["gender_identity"] | null
          attendee_last_name: string | null
          attendee_name: string
          attendee_title: string | null
          buyer_id: string | null
          catering_eligible_override: boolean | null
          certificate_sent_at: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          contact_id: string | null
          created_at: string
          email_message_id: string | null
          email_sent_at: string | null
          event_id: string
          id: string
          is_transferred: boolean
          notes: string | null
          order_id: string
          pdf_url: string | null
          reminder_sent_at: string | null
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          ticket_token: string
          tier_id: string
        }
        Insert: {
          attendee_birthday?: string | null
          attendee_email: string
          attendee_first_name: string
          attendee_gender?:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          attendee_last_name?: string | null
          attendee_name: string
          attendee_title?: string | null
          buyer_id?: string | null
          catering_eligible_override?: boolean | null
          certificate_sent_at?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          contact_id?: string | null
          created_at?: string
          email_message_id?: string | null
          email_sent_at?: string | null
          event_id: string
          id?: string
          is_transferred?: boolean
          notes?: string | null
          order_id: string
          pdf_url?: string | null
          reminder_sent_at?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          ticket_token?: string
          tier_id: string
        }
        Update: {
          attendee_birthday?: string | null
          attendee_email?: string
          attendee_first_name?: string
          attendee_gender?:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          attendee_last_name?: string | null
          attendee_name?: string
          attendee_title?: string | null
          buyer_id?: string | null
          catering_eligible_override?: boolean | null
          certificate_sent_at?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          contact_id?: string | null
          created_at?: string
          email_message_id?: string | null
          email_sent_at?: string | null
          event_id?: string
          id?: string
          is_transferred?: boolean
          notes?: string | null
          order_id?: string
          pdf_url?: string | null
          reminder_sent_at?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          ticket_token?: string
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_entries: {
        Row: {
          created_at: string
          email: string
          event_id: string
          expires_at: string | null
          id: string
          notified_at: string | null
          purchased: boolean
          tier_id: string
        }
        Insert: {
          created_at?: string
          email: string
          event_id: string
          expires_at?: string | null
          id?: string
          notified_at?: string | null
          purchased?: boolean
          tier_id: string
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          notified_at?: string | null
          purchased?: boolean
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      event_schedule_items: {
        Row: {
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          ends_at: string | null
          event_id: string | null
          id: string | null
          sort_order: number | null
          speaker_first_name: string | null
          speaker_id: string | null
          speaker_image_url: string | null
          speaker_last_name: string | null
          speaker_name: string | null
          speaker_title: string | null
          starts_at: string | null
          title_de: string | null
          title_en: string | null
          title_fr: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_runsheet_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_runsheet_items_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _first_from_name: { Args: { full_name: string }; Returns: string }
      _last_from_name: { Args: { full_name: string }; Returns: string }
      check_in_ticket: {
        Args: { p_event_id: string; p_staff_id: string; p_ticket_token: string }
        Returns: {
          already_checked_in_at: string
          already_checked_in_by: string
          attendee_email: string
          attendee_name: string
          success: boolean
          ticket_id: string
          tier_name: string
        }[]
      }
      count_newsletter_recipients: {
        Args: { p_exclude_slugs?: string[]; p_target_slugs: string[] }
        Returns: number
      }
      count_unread_notifications: { Args: never; Returns: number }
      get_funnel_kpis: {
        Args: { p_funnel_id: string; p_since?: string }
        Returns: Json
      }
      has_role: {
        Args: { p_min: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      insert_funnel_event: {
        Args: {
          p_event_type: string
          p_funnel_id: string
          p_locale: string
          p_referrer: string
          p_session_id: string
          p_utm_campaign: string
          p_utm_medium: string
          p_utm_source: string
        }
        Returns: undefined
      }
      list_my_sessions: {
        Args: never
        Returns: {
          aal: string
          created_at: string
          id: string
          ip: string
          not_after: string
          updated_at: string
          user_agent: string
        }[]
      }
      mfa_insert_backup_code: { Args: { p_code: string }; Returns: string }
      mfa_redeem_backup_code: { Args: { p_code: string }; Returns: boolean }
      mfa_seed_backup_codes: { Args: { p_codes: string[] }; Returns: number }
      mfa_unused_backup_codes: { Args: never; Returns: number }
      prune_abuse_events: { Args: never; Returns: number }
      redeem_coupon: { Args: { p_coupon_id: string }; Returns: boolean }
      release_tickets: {
        Args: { p_quantity: number; p_tier_id: string }
        Returns: undefined
      }
      reserve_tickets: {
        Args: { p_quantity: number; p_tier_id: string }
        Returns: boolean
      }
      revoke_my_session: { Args: { p_session_id: string }; Returns: boolean }
      upsert_contact_from_checkout: {
        Args: {
          p_auto_category_slug?: string
          p_birthday?: string
          p_country?: string
          p_email: string
          p_extra_category_slugs?: string[]
          p_first_name?: string
          p_gender?: string
          p_last_name?: string
          p_locale?: string
          p_occupation?: string
        }
        Returns: string
      }
    }
    Enums: {
      acquisition_type: "purchased" | "invited" | "assigned" | "door_sale"
      catering_category:
        | "starter"
        | "main"
        | "dessert"
        | "drink_non_alcoholic"
        | "drink_alcoholic"
        | "snack"
      discount_type: "percentage" | "fixed_amount"
      email_status: "active" | "bounced" | "complained" | "unsubscribed"
      employment_type: "full_time" | "part_time" | "freelance" | "internship"
      event_media_type: "photo" | "video" | "link"
      event_type: "conference" | "masterclass"
      gender_identity: "female" | "male" | "non_binary" | "prefer_not_to_say"
      incubation_application_status:
        | "new"
        | "reviewing"
        | "shortlisted"
        | "rejected"
        | "accepted"
      involvement_role:
        | "attendee"
        | "invited_guest"
        | "sponsor"
        | "partner"
        | "contractor"
        | "speaker"
        | "moderator"
        | "volunteer"
        | "staff"
        | "press"
        | "vip"
        | "chapter_delegate"
        | "delegate_companion"
        | "team_member_de"
        | "team_member_external"
        | "institutional_guest"
      job_application_status:
        | "new"
        | "reviewing"
        | "shortlisted"
        | "rejected"
        | "accepted"
      newsletter_send_status:
        | "queued"
        | "sent"
        | "delivered"
        | "bounced"
        | "opened"
        | "clicked"
        | "unsubscribed"
        | "failed"
      newsletter_status:
        | "draft"
        | "scheduled"
        | "queued"
        | "sending"
        | "sent"
        | "failed"
      order_status: "pending" | "paid" | "comped" | "refunded" | "cancelled"
      payment_method:
        | "card"
        | "sepa"
        | "paypal"
        | "cash"
        | "sepa_debit"
        | "klarna"
        | "link"
        | "bancontact"
        | "eps"
        | "pix"
        | "amazon_pay"
        | "ideal"
        | "giropay"
        | "p24"
        | "cartes_bancaires"
      pipeline_status: "new" | "engaged" | "considering" | "declined"
      speaker_question_status: "new" | "shortlisted" | "answered" | "declined"
      sponsor_status: "lead" | "proposal" | "confirmed" | "active" | "completed"
      sponsor_tier:
        | "title"
        | "platinum"
        | "gold"
        | "silver"
        | "bronze"
        | "partner"
        | "media"
      team_member_visibility: "public" | "internal" | "hidden"
      user_role:
        | "buyer"
        | "scanner"
        | "door_sales"
        | "team_member"
        | "manager"
        | "admin"
        | "super_admin"
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
      acquisition_type: ["purchased", "invited", "assigned", "door_sale"],
      catering_category: [
        "starter",
        "main",
        "dessert",
        "drink_non_alcoholic",
        "drink_alcoholic",
        "snack",
      ],
      discount_type: ["percentage", "fixed_amount"],
      email_status: ["active", "bounced", "complained", "unsubscribed"],
      employment_type: ["full_time", "part_time", "freelance", "internship"],
      event_media_type: ["photo", "video", "link"],
      event_type: ["conference", "masterclass"],
      gender_identity: ["female", "male", "non_binary", "prefer_not_to_say"],
      incubation_application_status: [
        "new",
        "reviewing",
        "shortlisted",
        "rejected",
        "accepted",
      ],
      involvement_role: [
        "attendee",
        "invited_guest",
        "sponsor",
        "partner",
        "contractor",
        "speaker",
        "moderator",
        "volunteer",
        "staff",
        "press",
        "vip",
        "chapter_delegate",
        "delegate_companion",
        "team_member_de",
        "team_member_external",
        "institutional_guest",
      ],
      job_application_status: [
        "new",
        "reviewing",
        "shortlisted",
        "rejected",
        "accepted",
      ],
      newsletter_send_status: [
        "queued",
        "sent",
        "delivered",
        "bounced",
        "opened",
        "clicked",
        "unsubscribed",
        "failed",
      ],
      newsletter_status: [
        "draft",
        "scheduled",
        "queued",
        "sending",
        "sent",
        "failed",
      ],
      order_status: ["pending", "paid", "comped", "refunded", "cancelled"],
      payment_method: [
        "card",
        "sepa",
        "paypal",
        "cash",
        "sepa_debit",
        "klarna",
        "link",
        "bancontact",
        "eps",
        "pix",
        "amazon_pay",
        "ideal",
        "giropay",
        "p24",
        "cartes_bancaires",
      ],
      pipeline_status: ["new", "engaged", "considering", "declined"],
      speaker_question_status: ["new", "shortlisted", "answered", "declined"],
      sponsor_status: ["lead", "proposal", "confirmed", "active", "completed"],
      sponsor_tier: [
        "title",
        "platinum",
        "gold",
        "silver",
        "bronze",
        "partner",
        "media",
      ],
      team_member_visibility: ["public", "internal", "hidden"],
      user_role: [
        "buyer",
        "scanner",
        "door_sales",
        "team_member",
        "manager",
        "admin",
        "super_admin",
      ],
    },
  },
} as const
