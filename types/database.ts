// Hand-written Supabase Database type.
// Relationships array is required by @supabase/supabase-js v2.x generics.

export type Database = {
  public: {
    Tables: {
      apartments: {
        Row: {
          id: string;
          name: string;
          address: string;
          district: string;
          city: string;
          slug: string;
          participant_goal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          district: string;
          city?: string;
          slug: string;
          participant_goal?: number;
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          address: string;
          district: string;
          city: string;
          slug: string;
          participant_goal: number;
        }>;
        Relationships: [];
      };
      user_profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          provider: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          provider?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          provider: string;
          display_name: string | null;
        }>;
        Relationships: [];
      };
      parking_cells: {
        Row: {
          id: string;
          n: string;
          row: string;
          lat: number;
          lng: number;
          rot: number;
          type: string;
          photo_url: string | null;
          active: boolean;
          updated_at: string;
        };
        Insert: {
          id: string;
          n: string;
          row: string;
          lat: number;
          lng: number;
          rot?: number;
          type?: string;
          photo_url?: string | null;
          active?: boolean;
          updated_at?: string;
        };
        Update: Partial<{
          n: string;
          row: string;
          lat: number;
          lng: number;
          rot: number;
          type: string;
          photo_url: string | null;
          active: boolean;
        }>;
        Relationships: [];
      };
      households: {
        Row: {
          id: string;
          complex: string;
          dong: string;
          ho: string;
          name: string;
          phone: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          complex?: string;
          dong: string;
          ho: string;
          name: string;
          phone?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<{
          complex: string;
          dong: string;
          ho: string;
          name: string;
          phone: string | null;
          status: string;
        }>;
        Relationships: [];
      };
      apartment_interest_signals: {
        Row: {
          id: string;
          apartment_id: string;
          anon_id: string;
          signal_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          apartment_id: string;
          anon_id: string;
          signal_type: string;
          created_at?: string;
        };
        Update: Partial<{
          signal_type: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "apartment_interest_signals_apartment_id_fkey";
            columns: ["apartment_id"];
            isOneToOne: false;
            referencedRelation: "apartments";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      apartment_with_counts: {
        Row: {
          id: string;
          name: string;
          address: string;
          district: string;
          city: string;
          slug: string;
          participant_goal: number;
          created_at: string;
          participant_count: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
