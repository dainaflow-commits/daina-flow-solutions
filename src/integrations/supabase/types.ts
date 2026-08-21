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
      ai_quote_status_history: {
        Row: {
          changed_by: string | null
          changed_by_email: string | null
          created_at: string
          from_status: string | null
          id: string
          quote_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          changed_by_email?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          quote_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          changed_by_email?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          quote_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_quote_status_history_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "ai_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_quotes: {
        Row: {
          client_profile: string | null
          complexity: string | null
          created_at: string
          deadline: string | null
          description: string
          id: string
          notes: string | null
          pricing_style: string | null
          result: Json
          status: string
          updated_at: string
          urgency: string | null
          user_id: string
        }
        Insert: {
          client_profile?: string | null
          complexity?: string | null
          created_at?: string
          deadline?: string | null
          description: string
          id?: string
          notes?: string | null
          pricing_style?: string | null
          result: Json
          status?: string
          updated_at?: string
          urgency?: string | null
          user_id: string
        }
        Update: {
          client_profile?: string | null
          complexity?: string | null
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          notes?: string | null
          pricing_style?: string | null
          result?: Json
          status?: string
          updated_at?: string
          urgency?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          company: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          body: string
          client_id: string
          created_at: string
          id: string
          project_id: string | null
          proposal_id: string | null
          sent_at: string | null
          sign_token: string | null
          signature_data: string | null
          signed_at: string | null
          signer_email: string | null
          signer_ip: string | null
          signer_name: string | null
          status: string
          title: string
          total: number
          updated_at: string
        }
        Insert: {
          body?: string
          client_id: string
          created_at?: string
          id?: string
          project_id?: string | null
          proposal_id?: string | null
          sent_at?: string | null
          sign_token?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_ip?: string | null
          signer_name?: string | null
          status?: string
          title: string
          total?: number
          updated_at?: string
        }
        Update: {
          body?: string
          client_id?: string
          created_at?: string
          id?: string
          project_id?: string | null
          proposal_id?: string | null
          sent_at?: string | null
          sign_token?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_ip?: string | null
          signer_name?: string | null
          status?: string
          title?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          service_interest: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          service_interest?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          service_interest?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      legal_consent_tracking: {
        Row: {
          accepted_at: string
          created_at: string
          id: string
          ip_address: string | null
          slug: string
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          slug: string
          user_agent?: string | null
          user_id: string
          version?: string
        }
        Update: {
          accepted_at?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          slug?: string
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          content_markdown: string
          slug: string
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          content_markdown?: string
          slug: string
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          content_markdown?: string
          slug?: string
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          email_messages: boolean
          email_project_status: boolean
          email_proposals: boolean
          inapp_messages: boolean
          inapp_project_status: boolean
          inapp_proposals: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          email_messages?: boolean
          email_project_status?: boolean
          email_proposals?: boolean
          inapp_messages?: boolean
          inapp_project_status?: boolean
          inapp_proposals?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          email_messages?: boolean
          email_project_status?: boolean
          email_proposals?: boolean
          inapp_messages?: boolean
          inapp_project_status?: boolean
          inapp_proposals?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          project_id: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          project_id?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          project_id?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          active: boolean
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          link_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          link_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          link_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          sender_id: string
          sender_role: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          column_key: string
          created_at: string
          description: string | null
          id: string
          position: number
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          column_key?: string
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          column_key?: string
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          client_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_items: {
        Row: {
          description: string
          id: string
          position: number
          proposal_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          position?: number
          proposal_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          description?: string
          id?: string
          position?: number
          proposal_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          ai_insights: Json | null
          body_markdown: string | null
          client_id: string
          created_at: string
          id: string
          intro: string | null
          project_id: string | null
          signature_data: string | null
          signed_at: string | null
          signer_name: string | null
          status: string
          title: string
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          ai_insights?: Json | null
          body_markdown?: string | null
          client_id: string
          created_at?: string
          id?: string
          intro?: string | null
          project_id?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signer_name?: string | null
          status?: string
          title: string
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          ai_insights?: Json | null
          body_markdown?: string | null
          client_id?: string
          created_at?: string
          id?: string
          intro?: string | null
          project_id?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signer_name?: string | null
          status?: string
          title?: string
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      results_stats: {
        Row: {
          active: boolean
          display_order: number
          icon: string | null
          id: string
          label: string
          suffix: string | null
          updated_at: string
          value: string
        }
        Insert: {
          active?: boolean
          display_order?: number
          icon?: string | null
          id?: string
          label: string
          suffix?: string | null
          updated_at?: string
          value: string
        }
        Update: {
          active?: boolean
          display_order?: number
          icon?: string | null
          id?: string
          label?: string
          suffix?: string | null
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          created_at: string
          deliverables: Json | null
          description: string
          display_order: number
          duration_estimate: string | null
          faq: Json | null
          gallery_urls: Json | null
          hero_image_url: string | null
          icon: string
          id: string
          long_description: string | null
          price_text: string | null
          slug: string
          tags: Json | null
          target_audience: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deliverables?: Json | null
          description: string
          display_order?: number
          duration_estimate?: string | null
          faq?: Json | null
          gallery_urls?: Json | null
          hero_image_url?: string | null
          icon?: string
          id?: string
          long_description?: string | null
          price_text?: string | null
          slug: string
          tags?: Json | null
          target_audience?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deliverables?: Json | null
          description?: string
          display_order?: number
          duration_estimate?: string | null
          faq?: Json | null
          gallery_urls?: Json | null
          hero_image_url?: string | null
          icon?: string
          id?: string
          long_description?: string | null
          price_text?: string | null
          slug?: string
          tags?: Json | null
          target_audience?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          active: boolean
          author_name: string
          author_role: string | null
          avatar_url: string | null
          content: string
          created_at: string
          display_order: number
          id: string
          rating: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          author_name: string
          author_role?: string | null
          avatar_url?: string | null
          content: string
          created_at?: string
          display_order?: number
          id?: string
          rating?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          author_name?: string
          author_role?: string | null
          avatar_url?: string | null
          content?: string
          created_at?: string
          display_order?: number
          id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string | null
          sender_role: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          description: string
          guest_email: string | null
          guest_name: string | null
          id: string
          priority: string
          source: string
          status: string
          subject: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          priority?: string
          source?: string
          status?: string
          subject: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          priority?: string
          source?: string
          status?: string
          subject?: string
          type?: string
          updated_at?: string
          user_id?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      slugify: { Args: { v: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "client"
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
      app_role: ["admin", "client"],
    },
  },
} as const
