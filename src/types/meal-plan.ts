export interface MealPlan {
  id: string;
  title: string;
  category: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  content: any;
  nutritional_info: {
    calories: string;
    protein: string;
    carbs: string;
    fats: string;
  };
  scheduled_date: string | null;
  scheduled_time: string | null;
  selected_groups: string[];
  status: 'draft' | 'published';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  time: string;
  name: string;
  foods: FoodItem[];
  notes?: string;
  imageUrl?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  notes?: string;
}

export interface Nutritionist {
  id: string;
  userId: string;
  name: string;
  crn: string;
  specialties: string[];
  patients: Patient[];
}

export interface Patient {
  id: string;
  userId: string;
  name: string;
  email: string;
  restrictions: string[];
  allergies: string[];
  goals: string[];
  currentMealPlanId?: string;
}