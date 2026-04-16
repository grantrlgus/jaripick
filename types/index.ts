export type SignalType = "participate_if_adopted" | "good_to_review";

export interface Apartment {
  id: string;
  name: string;
  address: string;
  district: string;
  city: string;
  slug: string;
  participant_goal: number;
  created_at: string;
}

export interface ApartmentWithCount extends Apartment {
  participant_count: number;
}

export interface UserProfile {
  id: string;
  auth_user_id: string;
  provider: string;
  display_name: string | null;
  created_at: string;
}

export interface ApartmentInterestSignal {
  id: string;
  apartment_id: string;
  auth_user_id: string;
  signal_type: SignalType;
  created_at: string;
}
