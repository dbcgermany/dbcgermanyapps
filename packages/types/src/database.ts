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
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
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
          created_at: string
          display_name: string | null
          id: string
          locale: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
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
          attendee_name: string
          buyer_id: string | null
          checked_in_at: string | null
          checked_in_by: string | null
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
          attendee_name: string
          buyer_id?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
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
          attendee_name?: string
          buyer_id?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
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
      redeem_coupon: { Args: { p_coupon_id: string }; Returns: boolean }
      release_tickets: {
        Args: { p_quantity: number; p_tier_id: string }
        Returns: boolean
      }
      reserve_tickets: {
        Args: { p_quantity: number; p_tier_id: string }
        Returns: boolean
      }
    }
    Enums: {
      acquisition_type: "purchased" | "invited" | "assigned" | "door_sale"
      discount_type: "percentage" | "fixed_amount"
      event_media_type: "photo" | "video" | "link"
      event_type: "conference" | "masterclass"
      order_status: "pending" | "paid" | "comped" | "refunded" | "cancelled"
      payment_method: "card" | "sepa" | "paypal" | "cash"
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
      order_status: ["pending", "paid", "comped", "refunded", "cancelled"],
      payment_method: ["card", "sepa", "paypal", "cash"],
      user_role: ["buyer", "team_member", "manager", "admin", "super_admin"],
    },
  },
} as const
