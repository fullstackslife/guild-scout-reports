export type Role = 'admin' | 'member';
export type ProcessingStatus = 'pending' | 'completed' | 'failed';
export type GuildRole = 'owner' | 'admin' | 'member';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          username: string | null;
          phone: string | null;
          role: Role;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          username?: string | null;
          phone?: string | null;
          role?: Role;
          active?: boolean;
        };
        Update: {
          email?: string;
          display_name?: string;
          username?: string | null;
          phone?: string | null;
          role?: Role;
          active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      games: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          screenshot_types: string | null;
          usage_guide: string | null;
          display_order: number;
          coming_soon: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          screenshot_types?: string | null;
          usage_guide?: string | null;
          display_order?: number;
          coming_soon?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          icon?: string | null;
          screenshot_types?: string | null;
          usage_guide?: string | null;
          display_order?: number;
          coming_soon?: boolean;
        };
        Relationships: [];
      };
      guilds: {
        Row: {
          id: string;
          name: string;
          game: string;
          game_id: string | null;
          description: string | null;
          announcement: string | null;
          promo_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          game: string;
          game_id?: string | null;
          description?: string | null;
          announcement?: string | null;
          promo_code?: string | null;
        };
        Update: {
          name?: string;
          game?: string;
          game_id?: string | null;
          description?: string | null;
          announcement?: string | null;
          promo_code?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'guilds_game_id_fkey';
            columns: ['game_id'];
            referencedRelation: 'games';
            referencedColumns: ['id'];
          }
        ];
      };
      guild_members: {
        Row: {
          id: string;
          guild_id: string;
          user_id: string;
          role: GuildRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          guild_id: string;
          user_id: string;
          role?: GuildRole;
        };
        Update: {
          role?: GuildRole;
        };
        Relationships: [
          {
            foreignKeyName: 'guild_members_guild_id_fkey';
            columns: ['guild_id'];
            referencedRelation: 'guilds';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'guild_members_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      screenshots: {
        Row: {
          id: string;
          user_id: string;
          guild_id: string | null;
          file_path: string;
          label: string | null;
          extracted_text: string | null;
          processing_status: ProcessingStatus;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          guild_id?: string | null;
          file_path: string;
          label?: string | null;
          extracted_text?: string | null;
          processing_status?: ProcessingStatus;
          processed_at?: string | null;
        };
        Update: {
          guild_id?: string | null;
          label?: string | null;
          extracted_text?: string | null;
          processing_status?: ProcessingStatus;
          processed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'screenshots_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'screenshots_guild_id_fkey';
            columns: ['guild_id'];
            referencedRelation: 'guilds';
            referencedColumns: ['id'];
          }
        ];
      };
      scout_reports: {
        Row: {
          id: string;
          screenshot_id: string;
          user_id: string;
          guild_id: string | null;
          target_name: string | null;
          target_guild: string | null;
          coordinates: string | null;
          might: number | null;
          leader_present: boolean | null;
          anti_scout_active: boolean | null;
          wall_hp: number | null;
          traps_total: number | null;
          traps_types: string | null;
          wall_heroes_count: number | null;
          wall_heroes_details: string | null;
          wall_familiars: string | null;
          active_boosts: string | null;
          total_troops: number | null;
          troop_breakdown: string | null;
          reinforcements_count: number | null;
          reinforcements_details: string | null;
          garrisons_count: number | null;
          garrisons_details: string | null;
          coalition_inside: boolean | null;
          coalition_details: string | null;
          wounded_in_infirmary: number | null;
          damaged_traps_count: number | null;
          retrieve_traps_info: string | null;
          resources_food: number | null;
          resources_stone: number | null;
          resources_ore: number | null;
          resources_timber: number | null;
          resources_gold: number | null;
          resources_above_vault: string | null;
          worth_it_farming: boolean | null;
          worth_it_kills: boolean | null;
          parsed_data: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          screenshot_id: string;
          user_id: string;
          guild_id?: string | null;
          target_name?: string | null;
          target_guild?: string | null;
          coordinates?: string | null;
          might?: number | null;
          leader_present?: boolean | null;
          anti_scout_active?: boolean | null;
          wall_hp?: number | null;
          traps_total?: number | null;
          traps_types?: string | null;
          wall_heroes_count?: number | null;
          wall_heroes_details?: string | null;
          wall_familiars?: string | null;
          active_boosts?: string | null;
          total_troops?: number | null;
          troop_breakdown?: string | null;
          reinforcements_count?: number | null;
          reinforcements_details?: string | null;
          garrisons_count?: number | null;
          garrisons_details?: string | null;
          coalition_inside?: boolean | null;
          coalition_details?: string | null;
          wounded_in_infirmary?: number | null;
          damaged_traps_count?: number | null;
          retrieve_traps_info?: string | null;
          resources_food?: number | null;
          resources_stone?: number | null;
          resources_ore?: number | null;
          resources_timber?: number | null;
          resources_gold?: number | null;
          resources_above_vault?: string | null;
          worth_it_farming?: boolean | null;
          worth_it_kills?: boolean | null;
          parsed_data?: string | null;
        };
        Update: {
          screenshot_id?: string;
          user_id?: string;
          guild_id?: string | null;
          target_name?: string | null;
          target_guild?: string | null;
          coordinates?: string | null;
          might?: number | null;
          leader_present?: boolean | null;
          anti_scout_active?: boolean | null;
          wall_hp?: number | null;
          traps_total?: number | null;
          traps_types?: string | null;
          wall_heroes_count?: number | null;
          wall_heroes_details?: string | null;
          wall_familiars?: string | null;
          active_boosts?: string | null;
          total_troops?: number | null;
          troop_breakdown?: string | null;
          reinforcements_count?: number | null;
          reinforcements_details?: string | null;
          garrisons_count?: number | null;
          garrisons_details?: string | null;
          coalition_inside?: boolean | null;
          coalition_details?: string | null;
          wounded_in_infirmary?: number | null;
          damaged_traps_count?: number | null;
          retrieve_traps_info?: string | null;
          resources_food?: number | null;
          resources_stone?: number | null;
          resources_ore?: number | null;
          resources_timber?: number | null;
          resources_gold?: number | null;
          resources_above_vault?: string | null;
          worth_it_farming?: boolean | null;
          worth_it_kills?: boolean | null;
          parsed_data?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'scout_reports_screenshot_id_fkey';
            columns: ['screenshot_id'];
            referencedRelation: 'screenshots';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scout_reports_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scout_reports_guild_id_fkey';
            columns: ['guild_id'];
            referencedRelation: 'guilds';
            referencedColumns: ['id'];
          }
        ];
      };
      scout_report_credibility: {
        Row: {
          id: string;
          user_id: string;
          guild_id: string | null;
          total_entries: number;
          accurate_entries: number;
          accuracy_percentage: number;
          reliability_tier: string | null;
          field_accuracy: string | null;
          last_calculated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          guild_id?: string | null;
          total_entries?: number;
          accurate_entries?: number;
          accuracy_percentage?: number;
          reliability_tier?: string | null;
          field_accuracy?: string | null;
          last_calculated_at?: string | null;
        };
        Update: {
          user_id?: string;
          guild_id?: string | null;
          total_entries?: number;
          accurate_entries?: number;
          accuracy_percentage?: number;
          reliability_tier?: string | null;
          field_accuracy?: string | null;
          last_calculated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'scout_report_credibility_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scout_report_credibility_guild_id_fkey';
            columns: ['guild_id'];
            referencedRelation: 'guilds';
            referencedColumns: ['id'];
          }
        ];
      };
      scout_report_validations: {
        Row: {
          id: string;
          scout_report_id: string;
          user_id: string;
          fields_compared: string | null;
          overall_match_percentage: number | null;
          fields_that_differed: string[] | null;
          user_corrections: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          scout_report_id: string;
          user_id: string;
          fields_compared?: string | null;
          overall_match_percentage?: number | null;
          fields_that_differed?: string[] | null;
          user_corrections?: string | null;
        };
        Update: {
          scout_report_id?: string;
          user_id?: string;
          fields_compared?: string | null;
          overall_match_percentage?: number | null;
          fields_that_differed?: string[] | null;
          user_corrections?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'scout_report_validations_scout_report_id_fkey';
            columns: ['scout_report_id'];
            referencedRelation: 'scout_reports';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scout_report_validations_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
