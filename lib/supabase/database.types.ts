export type Role = 'admin' | 'member';
export type ProcessingStatus = 'pending' | 'completed' | 'failed';

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
      screenshots: {
        Row: {
          id: string;
          user_id: string;
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
          file_path: string;
          label?: string | null;
          extracted_text?: string | null;
          processing_status?: ProcessingStatus;
          processed_at?: string | null;
        };
        Update: {
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
