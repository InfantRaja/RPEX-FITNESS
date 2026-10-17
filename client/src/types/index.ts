// =====================
// User & Auth Types
// =====================

export interface Onboarding {
  completed: boolean;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  targetWeight?: number;
  age?: number;
  dateOfBirth?: string;
  unitSystem: 'metric' | 'imperial';
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  fitnessExperience: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  fitnessGoal: 'muscle_building' | 'fat_loss' | 'strength' | 'weight_gain' | 'maintenance' | 'general_fitness' | 'body_recomposition';
  workoutLocation: 'gym' | 'home' | 'both';
  availableEquipment: string[];
  trainingDaysPerWeek: number;
  dietaryPreference: 'none' | 'vegetarian' | 'vegan' | 'eggetarian' | 'non_vegetarian' | 'keto' | 'paleo' | 'mediterranean';
  foodAllergies: string[];
  preferredLanguage: string;
  mealsPerDay?: number;
  mealBudget?: string | number;
  country?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  googleId?: string;
  isEmailVerified: boolean;
  bio?: string;
  followers?: string[];
  following?: string[];
  followersCount?: number;
  followingCount?: number;
  onboarding?: Onboarding;
  nutritionTargets?: NutritionTargets;
  savedMealPlan?: PlannedMeal[];
  preferences?: {
    theme?: 'dark' | 'light';
    units?: 'metric' | 'imperial';
    notifications?: boolean;
  };
  fitnessProfile?: {
    dailyCalorieGoal?: number;
    dailyProteinGoal?: number;
    dailyWaterGoal?: number;
    weeklyWorkoutGoal?: number;
  };
  gamification?: {
    level?: number;
    xp?: number;
    streakCurrent?: number;
    streakLongest?: number;
    badges?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface PublicUserProfile {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  onboarding?: Onboarding;
  gamification?: {
    level?: number;
    xp?: number;
    streakCurrent?: number;
    streakLongest?: number;
    badges?: string[];
  };
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isSelf?: boolean;
  createdAt: string;
  recentWorkouts?: Workout[];
  stats?: {
    totalWorkouts: number;
    workoutsLast30Days: number;
    totalMinutes: number;
  };
}

export interface FollowUserItem {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  onboarding?: Onboarding;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isSelf?: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// =====================
// Workout Types
// =====================

export interface ExerciseSet {
  setNumber: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  restTime?: number;
  notes?: string;
  completed: boolean;
}

export interface Exercise {
  name: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other';
  muscleGroups: string[];
  sets: ExerciseSet[];
  notes?: string;
}

export interface Workout {
  _id: string;
  userId: string;
  title: string;
  type: 'strength' | 'cardio' | 'hiit' | 'yoga' | 'sports' | 'other';
  exercises: Exercise[];
  duration: number;
  caloriesBurned?: number;
  notes?: string;
  date: string;
  isTemplate: boolean;
  rating?: number;
  mood?: 'terrible' | 'bad' | 'okay' | 'good' | 'great';
  location?: 'gym' | 'home' | 'outdoor' | 'other';
  createdAt: string;
  updatedAt: string;
}

export interface SplitDayExercise {
  name: string;
  category?: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other';
  sets?: number;
  targetSets?: number;
  reps?: string | number;
  targetReps?: number;
  targetWeight?: number;
  muscleGroup?: string;
}

export interface SplitDay {
  dayNumber: number;
  name: string;
  type?: 'strength' | 'cardio' | 'hiit' | 'yoga' | 'sports' | 'other' | 'rest';
  muscleGroups?: string[];
  targetMuscleGroups?: string[];
  exercises: SplitDayExercise[];
  notes?: string;
}

export interface Split {
  _id: string;
  userId?: string;
  name: string;
  description?: string;
  daysPerWeek?: number;
  isActive: boolean;
  isPreset: boolean;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'pro' | string;
  days: SplitDay[];
  createdAt: string;
  updatedAt: string;
}

// =====================
// Nutrition Types
// =====================

export interface FoodItem {
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface MealEntry {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  notes?: string;
}

export interface NutritionLog {
  _id: string;
  userId: string;
  date: string;
  meals: MealEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  waterIntake?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  maintenanceCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterMl: number;
  proteinPerMeal: number;
  formulaExplanation: string;
  goalAdjustmentLabel: string;
  macrosRatio?: {
    proteinPct: number;
    carbsPct: number;
    fatPct: number;
  };
  caloriesFrom?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  lastCalculatedAt?: string;
}

export interface PlannedMealItem {
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

export interface PlannedMeal {
  mealType: string;
  name: string;
  suggestedTime?: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  foods: PlannedMealItem[];
}

export interface DatabaseFoodItem {
  id: string;
  name: string;
  category: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  dietType?: string[];
  dietaryPreference?: string;
  isBudgetFriendly?: boolean;
  isAffordable?: boolean;
  region?: string;
  commonMeasure?: string;
}

export interface NutritionTrendsData {
  days: Array<{
    date: string;
    dayLabel: string;
    calories: number;
    targetCalories: number;
    protein: number;
    targetProtein: number;
    waterIntake: number;
    calorieAdherencePct: number;
    proteinAdherencePct: number;
  }>;
  averages: {
    avgCalories: number;
    avgProtein: number;
    avgWater: number;
    adherenceScore: number;
  };
}

// =====================
// Progress Types
// =====================

export interface ProgressEntry {
  _id: string;
  userId: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
  calves?: number;
  notes?: string;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
}

// =====================
// AI Types
// =====================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language?: string;
}

export interface AIConversation {
  _id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  topic: 'general' | 'workout' | 'nutrition' | 'progress' | 'motivation';
  createdAt: string;
  updatedAt: string;
}

// =====================
// Analytics Types
// =====================

export interface AnalyticsOverview {
  workoutsThisMonth: number;
  workoutsLastMonth: number;
  workoutStreak: number;
  avgDailyCalories: number;
  avgDailyProtein: number;
  latestWeight?: number;
  weeklyWorkouts: WeeklyData[];
  weeklyCalories: WeeklyCalorieData[];
}

export interface WeeklyData {
  _id: string;
  count: number;
  totalDuration: number;
  totalCalories: number;
}

export interface WeeklyCalorieData {
  _id: string;
  calories: number;
}

// =====================
// API Response Types
// =====================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: User;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
