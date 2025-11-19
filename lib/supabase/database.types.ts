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
      games: {
        Row: {
          coming_soon: boolean | null
          created_at: string
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          screenshot_types: string | null
          updated_at: string
          usage_guide: string | null
        }
        Insert: {
          coming_soon?: boolean | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          screenshot_types?: string | null
          updated_at?: string
          usage_guide?: string | null
        }
        Update: {
          coming_soon?: boolean | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          screenshot_types?: string | null
          updated_at?: string
          usage_guide?: string | null
        }
        Relationships: []
      }
      gear_items: {
        Row: {
          base_value: number | null
          category: string
          created_at: string
          game: string | null
          id: string
          might_bonus: number | null
          name: string
          rarity: string | null
          stats: Json | null
          subcategory: string | null
          tier: number | null
          updated_at: string
        }
        Insert: {
          base_value?: number | null
          category: string
          created_at?: string
          game?: string | null
          id?: string
          might_bonus?: number | null
          name: string
          rarity?: string | null
          stats?: Json | null
          subcategory?: string | null
          tier?: number | null
          updated_at?: string
        }
        Update: {
          base_value?: number | null
          category?: string
          created_at?: string
          game?: string | null
          id?: string
          might_bonus?: number | null
          name?: string
          rarity?: string | null
          stats?: Json | null
          subcategory?: string | null
          tier?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      gear_sets: {
        Row: {
          created_at: string
          game: string | null
          id: string
          name: string
          pieces: Json | null
          set_bonus: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          game?: string | null
          id?: string
          name: string
          pieces?: Json | null
          set_bonus?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          game?: string | null
          id?: string
          name?: string
          pieces?: Json | null
          set_bonus?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      gear_valuation_rules: {
        Row: {
          created_at: string
          formula: string | null
          gear_item_id: string | null
          id: string
          multipliers: Json | null
          notes: string | null
          updated_at: string
          valuation_method: string
        }
        Insert: {
          created_at?: string
          formula?: string | null
          gear_item_id?: string | null
          id?: string
          multipliers?: Json | null
          notes?: string | null
          updated_at?: string
          valuation_method: string
        }
        Update: {
          created_at?: string
          formula?: string | null
          gear_item_id?: string | null
          id?: string
          multipliers?: Json | null
          notes?: string | null
          updated_at?: string
          valuation_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "gear_valuation_rules_gear_item_id_fkey"
            columns: ["gear_item_id"]
            isOneToOne: false
            referencedRelation: "gear_items"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_members: {
        Row: {
          guild_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          guild_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          guild_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_members_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guilds: {
        Row: {
          announcement: string | null
          created_at: string
          description: string | null
          game: string
          game_id: string | null
          id: string
          name: string
          promo_code: string | null
          updated_at: string
        }
        Insert: {
          announcement?: string | null
          created_at?: string
          description?: string | null
          game: string
          game_id?: string | null
          id?: string
          name: string
          promo_code?: string | null
          updated_at?: string
        }
        Update: {
          announcement?: string | null
          created_at?: string
          description?: string | null
          game?: string
          game_id?: string | null
          id?: string
          name?: string
          promo_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guilds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          display_name: string
          email: string
          id: string
          phone: string | null
          role: string
          updated_at: string
          username: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name: string
          email: string
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      scout_report_credibility: {
        Row: {
          accuracy_percentage: number | null
          accurate_entries: number | null
          created_at: string
          field_accuracy: string | null
          guild_id: string | null
          id: string
          last_calculated_at: string | null
          reliability_tier: string | null
          total_entries: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_percentage?: number | null
          accurate_entries?: number | null
          created_at?: string
          field_accuracy?: string | null
          guild_id?: string | null
          id?: string
          last_calculated_at?: string | null
          reliability_tier?: string | null
          total_entries?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_percentage?: number | null
          accurate_entries?: number | null
          created_at?: string
          field_accuracy?: string | null
          guild_id?: string | null
          id?: string
          last_calculated_at?: string | null
          reliability_tier?: string | null
          total_entries?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scout_report_credibility_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      scout_report_validations: {
        Row: {
          created_at: string
          fields_compared: string | null
          fields_that_differed: string[] | null
          id: string
          overall_match_percentage: number | null
          scout_report_id: string
          user_corrections: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          fields_compared?: string | null
          fields_that_differed?: string[] | null
          id?: string
          overall_match_percentage?: number | null
          scout_report_id: string
          user_corrections?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          fields_compared?: string | null
          fields_that_differed?: string[] | null
          id?: string
          overall_match_percentage?: number | null
          scout_report_id?: string
          user_corrections?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scout_report_validations_scout_report_id_fkey"
            columns: ["scout_report_id"]
            isOneToOne: false
            referencedRelation: "scout_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      scout_reports: {
        Row: {
          active_boosts: string | null
          anti_scout_active: boolean | null
          coalition_details: string | null
          coalition_inside: boolean | null
          coordinate_k: string | null
          coordinate_x: string | null
          coordinate_y: string | null
          coordinates: string | null
          created_at: string
          damaged_traps_count: number | null
          garrisons_count: number | null
          garrisons_details: string | null
          guild_id: string | null
          id: string
          leader_present: boolean | null
          might: number | null
          parsed_data: string | null
          reinforcements_count: number | null
          reinforcements_details: string | null
          resources_above_vault: string | null
          resources_food: number | null
          resources_gold: number | null
          resources_ore: number | null
          resources_stone: number | null
          resources_timber: number | null
          retrieve_traps_info: string | null
          screenshot_id: string
          target_guild: string | null
          target_name: string | null
          total_troops: number | null
          traps_total: number | null
          traps_types: string | null
          troop_breakdown: string | null
          updated_at: string
          user_id: string
          wall_familiars: string | null
          wall_heroes_count: number | null
          wall_heroes_details: string | null
          wall_hp: number | null
          worth_it_farming: boolean | null
          worth_it_kills: boolean | null
          wounded_in_infirmary: number | null
        }
        Insert: {
          active_boosts?: string | null
          anti_scout_active?: boolean | null
          coalition_details?: string | null
          coalition_inside?: boolean | null
          coordinate_k?: string | null
          coordinate_x?: string | null
          coordinate_y?: string | null
          coordinates?: string | null
          created_at?: string
          damaged_traps_count?: number | null
          garrisons_count?: number | null
          garrisons_details?: string | null
          guild_id?: string | null
          id?: string
          leader_present?: boolean | null
          might?: number | null
          parsed_data?: string | null
          reinforcements_count?: number | null
          reinforcements_details?: string | null
          resources_above_vault?: string | null
          resources_food?: number | null
          resources_gold?: number | null
          resources_ore?: number | null
          resources_stone?: number | null
          resources_timber?: number | null
          retrieve_traps_info?: string | null
          screenshot_id: string
          target_guild?: string | null
          target_name?: string | null
          total_troops?: number | null
          traps_total?: number | null
          traps_types?: string | null
          troop_breakdown?: string | null
          updated_at?: string
          user_id: string
          wall_familiars?: string | null
          wall_heroes_count?: number | null
          wall_heroes_details?: string | null
          wall_hp?: number | null
          worth_it_farming?: boolean | null
          worth_it_kills?: boolean | null
          wounded_in_infirmary?: number | null
        }
        Update: {
          active_boosts?: string | null
          anti_scout_active?: boolean | null
          coalition_details?: string | null
          coalition_inside?: boolean | null
          coordinate_k?: string | null
          coordinate_x?: string | null
          coordinate_y?: string | null
          coordinates?: string | null
          created_at?: string
          damaged_traps_count?: number | null
          garrisons_count?: number | null
          garrisons_details?: string | null
          guild_id?: string | null
          id?: string
          leader_present?: boolean | null
          might?: number | null
          parsed_data?: string | null
          reinforcements_count?: number | null
          reinforcements_details?: string | null
          resources_above_vault?: string | null
          resources_food?: number | null
          resources_gold?: number | null
          resources_ore?: number | null
          resources_stone?: number | null
          resources_timber?: number | null
          retrieve_traps_info?: string | null
          screenshot_id?: string
          target_guild?: string | null
          target_name?: string | null
          total_troops?: number | null
          traps_total?: number | null
          traps_types?: string | null
          troop_breakdown?: string | null
          updated_at?: string
          user_id?: string
          wall_familiars?: string | null
          wall_heroes_count?: number | null
          wall_heroes_details?: string | null
          wall_hp?: number | null
          worth_it_farming?: boolean | null
          worth_it_kills?: boolean | null
          wounded_in_infirmary?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scout_reports_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scout_reports_screenshot_id_fkey"
            columns: ["screenshot_id"]
            isOneToOne: false
            referencedRelation: "screenshots"
            referencedColumns: ["id"]
          },
        ]
      }
      screenshots: {
        Row: {
          created_at: string
          extracted_text: string | null
          file_path: string
          guild_id: string | null
          id: string
          label: string | null
          processed_at: string | null
          processing_status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          file_path: string
          guild_id?: string | null
          id?: string
          label?: string | null
          processed_at?: string | null
          processing_status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          file_path?: string
          guild_id?: string | null
          id?: string
          label?: string | null
          processed_at?: string | null
          processing_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screenshots_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_is_guild_member: {
        Args: { p_guild_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
