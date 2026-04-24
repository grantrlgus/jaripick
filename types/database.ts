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
          complex: string;
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
          complex?: string;
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
          complex: string;
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
      resident_requests: {
        Row: {
          id: string;
          complex: string;
          dong: string;
          ho: string;
          name: string;
          phone: string | null;
          car_plate: string | null;
          car_size: string | null;
          ev: boolean;
          reason: string | null;
          status: string;
          auto: boolean;
          created_at: string;
          decided_at: string | null;
        };
        Insert: {
          id?: string;
          complex?: string;
          dong: string;
          ho: string;
          name: string;
          phone?: string | null;
          car_plate?: string | null;
          car_size?: string | null;
          ev?: boolean;
          reason?: string | null;
          status?: string;
          auto?: boolean;
          created_at?: string;
          decided_at?: string | null;
        };
        Update: Partial<{
          status: string;
          decided_at: string | null;
          reason: string | null;
          phone: string | null;
          car_plate: string | null;
          car_size: string | null;
          ev: boolean;
          auto: boolean;
        }>;
        Relationships: [];
      };
      rounds: {
        Row: {
          id: string;
          complex: string;
          name: string;
          bid_start: string;
          bid_end: string;
          contract_start: string;
          contract_end: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          complex?: string;
          name: string;
          bid_start: string;
          bid_end: string;
          contract_start: string;
          contract_end: string;
          status?: string;
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          bid_start: string;
          bid_end: string;
          contract_start: string;
          contract_end: string;
          status: string;
        }>;
        Relationships: [];
      };
      bids: {
        Row: {
          id: string;
          round_id: string;
          cell_id: string;
          dong: string;
          ho: string;
          name: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          cell_id: string;
          dong: string;
          ho: string;
          name: string;
          amount: number;
          created_at?: string;
        };
        Update: Partial<{
          amount: number;
        }>;
        Relationships: [];
      };
      complex_config: {
        Row: {
          complex: string;
          name: string | null;
          address: string | null;
          total_units: number | null;
          min_bid: number;
          bid_rule: string;
          payment_mode: string;
          updated_at: string;
        };
        Insert: {
          complex?: string;
          name?: string | null;
          address?: string | null;
          total_units?: number | null;
          min_bid?: number;
          bid_rule?: string;
          payment_mode?: string;
          updated_at?: string;
        };
        Update: Partial<{
          name: string | null;
          address: string | null;
          total_units: number | null;
          min_bid: number;
          bid_rule: string;
          payment_mode: string;
        }>;
        Relationships: [];
      };
      notices: {
        Row: {
          id: string;
          complex: string;
          target: string;
          title: string;
          body: string;
          sent_at: string;
          recipient_count: number;
        };
        Insert: {
          id?: string;
          complex?: string;
          target?: string;
          title: string;
          body: string;
          sent_at?: string;
          recipient_count?: number;
        };
        Update: Partial<{
          title: string;
          body: string;
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
      admin_users: {
        Row: {
          id: string;
          auth_user_id: string;
          email: string;
          name: string;
          role: string;
          complex: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          email: string;
          name: string;
          role?: string;
          complex?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          email: string;
          name: string;
          role: string;
          complex: string | null;
        }>;
        Relationships: [];
      };
      complaints: {
        Row: {
          id: string;
          complex: string;
          dong: string;
          ho: string;
          author_name: string;
          phone: string | null;
          category: string;
          title: string;
          body: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          complex?: string;
          dong: string;
          ho: string;
          author_name: string;
          phone?: string | null;
          category?: string;
          title: string;
          body: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          category: string;
          title: string;
          body: string;
          status: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      complaint_replies: {
        Row: {
          id: string;
          complaint_id: string;
          author_role: string;
          author_name: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          complaint_id: string;
          author_role: string;
          author_name: string;
          body: string;
          created_at?: string;
        };
        Update: Partial<{
          body: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "complaint_replies_complaint_id_fkey";
            columns: ["complaint_id"];
            isOneToOne: false;
            referencedRelation: "complaints";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: {
          id: string;
          complex: string;
          round_id: string;
          cell_id: string;
          dong: string;
          ho: string;
          name: string | null;
          period: string;
          amount: number;
          status: string;
          due_date: string | null;
          paid_at: string | null;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          complex: string;
          round_id: string;
          cell_id: string;
          dong: string;
          ho: string;
          name?: string | null;
          period: string;
          amount: number;
          status?: string;
          due_date?: string | null;
          paid_at?: string | null;
          memo?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          status: string;
          paid_at: string | null;
          memo: string | null;
          amount: number;
          due_date: string | null;
        }>;
        Relationships: [];
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
