export interface ProfileForm {
  id: string;
  fullName: string;
  username: string;
  bio: string;
  city: string;
  state: string;
  birthDate: string;
  gender: string;
  email: string;
  phone: string;
  coverImage: string | null;
  avatarUrl: string | null;
  weight?: string;
  height?: string;
  targetWeight?: string;
}