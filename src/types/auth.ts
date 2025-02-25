export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  birth_date: string;
  phone: string;
  avatar_url?: string;
  weight?: number;
  height?: number;
  goals?: string;
  food_preferences?: string[];
  allergies?: string[];
  created_at: string;
}