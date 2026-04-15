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
      company_info: {
        Row: {
          account_holder: string | null
          bank_name: string | null
          bic: string | null
          brand_name: string
          brand_tagline_de: string | null
          brand_tagline_en: string | null
          brand_tagline_fr: string | null
          facebook_url: string | null
          favicon_url: string | null
          fr_legal_name: string | null
          fr_registered_address: string | null
          fr_siren: string | null
          hrb_court: string | null
          hrb_number: string | null
          iban: string | null
          id: number
          instagram_url: string | null
          legal_form: string | null
          legal_name: string
          linkedin_url: string | null
          logo_dark_url: string | null
          logo_light_url: string | null
          logo_wordmark_url: string | null
          managing_directors: string | null
          office_address: string | null
          office_hours: string | null
          og_default_image_url: string | null
          phone: string | null
          press_email: string
          primary_color: string | null
          primary_email: string
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
          support_email: string
          tax_id: string | null
          twitter_url: string | null
          updated_at: string
          updated_by: string | null
          vat_id: string | null
          whatsapp_url: string | null
          youtube_url: string | null
        }
        Insert: {
          account_holder?: string | null
          bank_name?: string | null
          bic?: string | null
          brand_name?: string
          brand_tagline_de?: string | null
          brand_tagline_en?: string | null
          brand_tagline_fr?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          fr_legal_name?: string | null
          fr_registered_address?: string | null
          fr_siren?: string | null
          hrb_court?: string | null
          hrb_number?: string | null
          iban?: string | null
          id?: number
          instagram_url?: string | null
          legal_form?: string | null
          legal_name?: string
          linkedin_url?: string | null
          logo_dark_url?: string | null
          logo_light_url?: string | null
          logo_wordmark_url?: string | null
          managing_directors?: string | null
          office_address?: string | null
          office_hours?: string | null
          og_default_image_url?: string | null
          phone?: string | null
          press_email?: string
          primary_color?: string | null
          primary_email?: string
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
          support_email?: string
          tax_id?: string | null
          twitter_url?: string | null
          updated_at?: string
          updated_by?: string | null
          vat_id?: string | null
          whatsapp_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          account_holder?: string | null
          bank_name?: string | null
          bic?: string | null
          brand_name?: string
          brand_tagline_de?: string | null
          brand_tagline_en?: string | null
          brand_tagline_fr?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          fr_legal_name?: string | null
          fr_registered_address?: string | null
          fr_siren?: string | null
          hrb_court?: string | null
          hrb_number?: string | null
          iban?: string | null
          id?: number
          instagram_url?: string | null
          legal_form?: string | null
          legal_name?: string
          linkedin_url?: string | null
          logo_dark_url?: string | null
          logo_light_url?: string | null
          logo_wordmark_url?: string | null
          managing_directors?: string | null
          office_address?: string | null
          office_hours?: string | null
          og_default_image_url?: string | null
          phone?: string | null
          press_email?: string
          primary_color?: string | null
          primary_email?: string
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
          support_email?: string
          tax_id?: string | null
          twitter_url?: string | null
          updated_at?: string
          updated_by?: string | null
          vat_id?: string | null
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
      contact_messages: {
        Row: {
          body_md: string
          contact_id: string
          id: string
          reply_to: string | null
          resend_message_id: string | null
          sent_at: string
          sent_by: string | null
          subject: string
        }
        Insert: {
          body_md: string
          contact_id: string
          id?: string
          reply_to?: string | null
          resend_message_id?: string | null
          sent_at?: string
          sent_by?: string | null
          subject: string
        }
        Update: {
          body_md?: string
          contact_id?: string
          id?: string
          reply_to?: string | null
          resend_message_id?: string | null
          sent_at?: string
          sent_by?: string | null
          subject?: string
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
      contacts: {
        Row: {
          admin_notes: string | null
          birthday: string | null
          country: string | null
          created_at: string
          email: string
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          marketing_consent: boolean
          marketing_consent_confirmed_at: string | null
          marketing_consent_ip: unknown
          marketing_consent_requested_at: string | null
          marketing_consent_source: string | null
          marketing_consent_token: string | null
          occupation: string | null
          phone: string | null
          resend_contact_id: string | null
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          marketing_consent?: boolean
          marketing_consent_confirmed_at?: string | null
          marketing_consent_ip?: unknown
          marketing_consent_requested_at?: string | null
          marketing_consent_source?: string | null
          marketing_consent_token?: string | null
          occupation?: string | null
          phone?: string | null
          resend_contact_id?: string | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          marketing_consent?: boolean
          marketing_consent_confirmed_at?: string | null
          marketing_consent_ip?: unknown
          marketing_consent_requested_at?: string | null
          marketing_consent_source?: string | null
          marketing_consent_token?: string | null
          occupation?: string | null
          phone?: string | null
          resend_contact_id?: string | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
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
          max_uses: number | null
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
          max_uses?: number | null
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
          max_uses?: number | null
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
        ]
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
      event_schedule_items: {
        Row: {
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          ends_at: string
          event_id: string
          id: string
          sort_order: number
          speaker_image_url: string | null
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
          speaker_image_url?: string | null
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
          speaker_image_url?: string | null
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
        ]
      }
      events: {
        Row: {
          capacity: number
          city: string | null
          country: string
          cover_image_url: string | null
          created_at: string
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          enabled_payment_methods: string[]
          ends_at: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          is_published: boolean
          max_tickets_per_order: number
          slug: string
          starts_at: string
          timezone: string
          title_de: string
          title_en: string
          title_fr: string
          updated_at: string
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          capacity: number
          city?: string | null
          country?: string
          cover_image_url?: string | null
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          enabled_payment_methods?: string[]
          ends_at: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          is_published?: boolean
          max_tickets_per_order?: number
          slug: string
          starts_at: string
          timezone?: string
          title_de: string
          title_en: string
          title_fr: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          capacity?: number
          city?: string | null
          country?: string
          cover_image_url?: string | null
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          enabled_payment_methods?: string[]
          ends_at?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_published?: boolean
          max_tickets_per_order?: number
          slug?: string
          starts_at?: string
          timezone?: string
          title_de?: string
          title_en?: string
          title_fr?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: []
      }
      incubation_applications: {
        Row: {
          company_name: string | null
          company_stage: string | null
          company_website: string | null
          country: string | null
          created_at: string
          founder_email: string
          founder_name: string
          founder_phone: string | null
          funding_needed_cents: number | null
          id: string
          locale: string
          pitch: string
          reviewer_id: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["incubation_application_status"]
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          company_stage?: string | null
          company_website?: string | null
          country?: string | null
          created_at?: string
          founder_email: string
          founder_name: string
          founder_phone?: string | null
          funding_needed_cents?: number | null
          id?: string
          locale?: string
          pitch: string
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["incubation_application_status"]
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          company_stage?: string | null
          company_website?: string | null
          country?: string | null
          created_at?: string
          founder_email?: string
          founder_name?: string
          founder_phone?: string | null
          funding_needed_cents?: number | null
          id?: string
          locale?: string
          pitch?: string
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["incubation_application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incubation_applications_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      news_posts: {
        Row: {
          author_name: string | null
          body_de: string
          body_en: string
          body_fr: string
          cover_image_url: string | null
          created_at: string
          excerpt_de: string | null
          excerpt_en: string | null
          excerpt_fr: string | null
          id: string
          is_published: boolean
          published_at: string | null
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
          cover_image_url?: string | null
          created_at?: string
          excerpt_de?: string | null
          excerpt_en?: string | null
          excerpt_fr?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
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
          cover_image_url?: string | null
          created_at?: string
          excerpt_de?: string | null
          excerpt_en?: string | null
          excerpt_fr?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title_de?: string
          title_en?: string
          title_fr?: string
          updated_at?: string
        }
        Relationships: []
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
          status: string
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
          status?: string
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
          status?: string
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
          status: string
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
          status?: string
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
          status?: string
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
          recipient_name: string
          reservation_expires_at: string | null
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
          recipient_name: string
          reservation_expires_at?: string | null
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
          recipient_name?: string
          reservation_expires_at?: string | null
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
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email_notifications: boolean
          id: string
          locale: string
          role: Database["public"]["Enums"]["user_role"]
          theme: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email_notifications?: boolean
          id: string
          locale?: string
          role?: Database["public"]["Enums"]["user_role"]
          theme?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email_notifications?: boolean
          id?: string
          locale?: string
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
          created_at: string
          email: string | null
          id: string
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
        }
        Insert: {
          bio_de?: string | null
          bio_en?: string | null
          bio_fr?: string | null
          created_at?: string
          email?: string | null
          id?: string
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
        }
        Update: {
          bio_de?: string | null
          bio_en?: string | null
          bio_fr?: string | null
          created_at?: string
          email?: string | null
          id?: string
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
      ticket_tiers: {
        Row: {
          created_at: string
          currency: string
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          event_id: string
          id: string
          is_public: boolean
          max_quantity: number | null
          name_de: string
          name_en: string
          name_fr: string
          price_cents: number
          quantity_sold: number
          sales_end_at: string | null
          sales_start_at: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          currency?: string
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          event_id: string
          id?: string
          is_public?: boolean
          max_quantity?: number | null
          name_de: string
          name_en: string
          name_fr: string
          price_cents: number
          quantity_sold?: number
          sales_end_at?: string | null
          sales_start_at?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          currency?: string
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          event_id?: string
          id?: string
          is_public?: boolean
          max_quantity?: number | null
          name_de?: string
          name_en?: string
          name_fr?: string
          price_cents?: number
          quantity_sold?: number
          sales_end_at?: string | null
          sales_start_at?: string | null
          slug?: string
          sort_order?: number
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
          attendee_email: string
          attendee_first_name: string | null
          attendee_last_name: string | null
          attendee_name: string
          buyer_id: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          contact_id: string | null
          created_at: string
          email_message_id: string | null
          event_id: string
          id: string
          is_transferred: boolean
          notes: string | null
          order_id: string
          pdf_url: string | null
          ticket_token: string
          tier_id: string
        }
        Insert: {
          attendee_email: string
          attendee_first_name?: string | null
          attendee_last_name?: string | null
          attendee_name: string
          buyer_id?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          contact_id?: string | null
          created_at?: string
          email_message_id?: string | null
          event_id: string
          id?: string
          is_transferred?: boolean
          notes?: string | null
          order_id: string
          pdf_url?: string | null
          ticket_token?: string
          tier_id: string
        }
        Update: {
          attendee_email?: string
          attendee_first_name?: string | null
          attendee_last_name?: string | null
          attendee_name?: string
          buyer_id?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          contact_id?: string | null
          created_at?: string
          email_message_id?: string | null
          event_id?: string
          id?: string
          is_transferred?: boolean
          notes?: string | null
          order_id?: string
          pdf_url?: string | null
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
      [_ in never]: never
    }
    Functions: {
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
      redeem_coupon: { Args: { p_coupon_id: string }; Returns: boolean }
      release_tickets: {
        Args: { p_quantity: number; p_tier_id: string }
        Returns: undefined
      }
      reserve_tickets: {
        Args: { p_quantity: number; p_tier_id: string }
        Returns: boolean
      }
      upsert_contact_from_checkout:
        | {
            Args: {
              p_auto_category_slug?: string
              p_birthday?: string
              p_country?: string
              p_email: string
              p_first_name?: string
              p_gender?: string
              p_last_name?: string
              p_occupation?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_auto_category_slug?: string
              p_birthday?: string
              p_country?: string
              p_email: string
              p_extra_category_slugs?: string[]
              p_first_name?: string
              p_gender?: string
              p_last_name?: string
              p_occupation?: string
            }
            Returns: string
          }
    }
    Enums: {
      acquisition_type: "purchased" | "invited" | "assigned" | "door_sale"
      discount_type: "percentage" | "fixed_amount"
      event_media_type: "photo" | "video" | "link"
      event_type: "conference" | "masterclass"
      incubation_application_status:
        | "new"
        | "reviewing"
        | "shortlisted"
        | "rejected"
        | "accepted"
      order_status: "pending" | "paid" | "comped" | "refunded" | "cancelled"
      payment_method: "card" | "sepa" | "paypal" | "cash"
      team_member_visibility: "public" | "internal" | "hidden"
      user_role: "buyer" | "team_member" | "manager" | "admin" | "super_admin"
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
      discount_type: ["percentage", "fixed_amount"],
      event_media_type: ["photo", "video", "link"],
      event_type: ["conference", "masterclass"],
      incubation_application_status: [
        "new",
        "reviewing",
        "shortlisted",
        "rejected",
        "accepted",
      ],
      order_status: ["pending", "paid", "comped", "refunded", "cancelled"],
      payment_method: ["card", "sepa", "paypal", "cash"],
      team_member_visibility: ["public", "internal", "hidden"],
      user_role: ["buyer", "team_member", "manager", "admin", "super_admin"],
    },
  },
} as const
