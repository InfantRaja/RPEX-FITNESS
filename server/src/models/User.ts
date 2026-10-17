import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface INutritionTargets {
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
  lastCalculatedAt?: Date;
}

export interface IPlannedMealItem {
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

export interface IPlannedMeal {
  mealType: string;
  name: string;
  suggestedTime?: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  foods: IPlannedMealItem[];
}

export interface IOnboarding {
  completed: boolean;
  gender?: 'male' | 'female' | 'other';
  height?: number; // cm
  weight?: number; // kg
  targetWeight?: number; // kg
  age?: number;
  dateOfBirth?: Date;
  unitSystem: 'metric' | 'imperial';
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  fitnessExperience: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  fitnessGoal: 'muscle_building' | 'fat_loss' | 'strength' | 'weight_gain' | 'maintenance' | 'general_fitness' | 'body_recomposition';
  workoutLocation: 'gym' | 'home' | 'both';
  availableEquipment: string[];
  trainingDaysPerWeek: number;
  dietaryPreference: 'none' | 'vegetarian' | 'vegan' | 'eggetarian' | 'non_vegetarian' | 'keto' | 'paleo' | 'mediterranean';
  foodAllergies: string[];
  mealsPerDay?: number;
  mealBudget?: string | number;
  country?: string;
  preferredLanguage: string;
  nutritionTargets?: INutritionTargets;
  savedMealPlan?: IPlannedMeal[];
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  isEmailVerified: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  bio?: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  onboarding: IOnboarding;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const PlannedMealItemSchema = new Schema<IPlannedMealItem>({
  name: { type: String, required: true },
  servingSize: { type: Number, required: true },
  servingUnit: { type: String, default: 'g' },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
  notes: { type: String },
}, { _id: false });

const PlannedMealSchema = new Schema<IPlannedMeal>({
  mealType: { type: String, required: true },
  name: { type: String, required: true },
  suggestedTime: { type: String },
  totalCalories: { type: Number, default: 0 },
  totalProtein: { type: Number, default: 0 },
  totalCarbs: { type: Number, default: 0 },
  totalFat: { type: Number, default: 0 },
  foods: [PlannedMealItemSchema],
}, { _id: false });

const NutritionTargetsSchema = new Schema<INutritionTargets>({
  bmr: { type: Number, default: 1800 },
  tdee: { type: Number, default: 2200 },
  targetCalories: { type: Number, default: 2200 },
  maintenanceCalories: { type: Number, default: 2200 },
  proteinGrams: { type: Number, default: 150 },
  carbsGrams: { type: Number, default: 220 },
  fatGrams: { type: Number, default: 65 },
  waterMl: { type: Number, default: 3000 },
  proteinPerMeal: { type: Number, default: 35 },
  formulaExplanation: { type: String, default: 'Mifflin-St Jeor Formula' },
  goalAdjustmentLabel: { type: String, default: 'Maintenance' },
  lastCalculatedAt: { type: Date, default: Date.now },
}, { _id: false });

const OnboardingSchema = new Schema<IOnboarding>({
  completed: { type: Boolean, default: false },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
  height: { type: Number, min: 50, max: 300 },
  weight: { type: Number, min: 20, max: 500 },
  targetWeight: { type: Number, min: 20, max: 500 },
  age: { type: Number, min: 10, max: 120 },
  dateOfBirth: { type: Date },
  unitSystem: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'],
    default: 'moderately_active',
  },
  fitnessExperience: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'pro'], default: 'beginner' },
  fitnessGoal: {
    type: String,
    enum: ['muscle_building', 'fat_loss', 'strength', 'weight_gain', 'maintenance', 'general_fitness', 'body_recomposition'],
    default: 'general_fitness',
  },
  workoutLocation: { type: String, enum: ['gym', 'home', 'both'], default: 'gym' },
  availableEquipment: [{ type: String }],
  trainingDaysPerWeek: { type: Number, min: 1, max: 7, default: 4 },
  dietaryPreference: {
    type: String,
    enum: ['none', 'vegetarian', 'vegan', 'eggetarian', 'non_vegetarian', 'keto', 'paleo', 'mediterranean'],
    default: 'none',
  },
  foodAllergies: [{ type: String }],
  mealsPerDay: { type: Number, min: 2, max: 7, default: 4 },
  mealBudget: { type: Schema.Types.Mixed, default: 'moderate' },
  country: { type: String, default: 'India' },
  preferredLanguage: { type: String, default: 'en' },
  nutritionTargets: { type: NutritionTargetsSchema },
  savedMealPlan: [PlannedMealSchema],
}, { _id: false });

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: { type: String, minlength: 8, select: false },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    bio: { type: String, maxlength: 250, default: '' },
    followers: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    onboarding: { type: OnboardingSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: any, ret: any) => {
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
