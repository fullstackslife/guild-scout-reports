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
      guilds: {
        Row: {
          id: string;
          name: string;
          game: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          game: string;
          description?: string | null;
        };
        Update: {
          name?: string;
          game?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      guild_members: {
        Row: {
          id: string;
          guild_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          guild_id: string;
          user_id: string;
          role?: string;
        };
        Update: {
          role?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
