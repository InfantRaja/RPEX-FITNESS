import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodItem {
  name: string;
  servingSize: number; // grams
  servingUnit: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number;
  sugar?: number;
  sodium?: number; // mg
}

export interface IMealEntry {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
  foods: IFoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  notes?: string;
}

export interface INutritionLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  meals: IMealEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  waterIntake?: number; // ml
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FoodItemSchema = new Schema<IFoodItem>({
  name: { type: String, required: true, trim: true },
  servingSize: { type: Number, required: true, min: 0 },
  servingUnit: { type: String, default: 'g' },
  calories: { type: Number, required: true, min: 0 },
  protein: { type: Number, required: true, min: 0 },
  carbs: { type: Number, required: true, min: 0 },
  fat: { type: Number, required: true, min: 0 },
  fiber: { type: Number, min: 0 },
  sugar: { type: Number, min: 0 },
  sodium: { type: Number, min: 0 },
}, { _id: false });

const MealEntrySchema = new Schema<IMealEntry>({
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'],
    required: true,
  },
  foods: [FoodItemSchema],
  totalCalories: { type: Number, default: 0 },
  totalProtein: { type: Number, default: 0 },
  totalCarbs: { type: Number, default: 0 },
  totalFat: { type: Number, default: 0 },
  notes: { type: String, maxlength: 500 },
}, { _id: false });

const NutritionLogSchema = new Schema<INutritionLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    meals: [MealEntrySchema],
    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFat: { type: Number, default: 0 },
    waterIntake: { type: Number, min: 0 },
    notes: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

NutritionLogSchema.index({ userId: 1, date: -1 });

// Auto-calculate totals before save
NutritionLogSchema.pre('save', function (next) {
  this.totalCalories = this.meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
  this.totalProtein = this.meals.reduce((sum, meal) => sum + meal.totalProtein, 0);
  this.totalCarbs = this.meals.reduce((sum, meal) => sum + meal.totalCarbs, 0);
  this.totalFat = this.meals.reduce((sum, meal) => sum + meal.totalFat, 0);
  next();
});

export default mongoose.model<INutritionLog>('NutritionLog', NutritionLogSchema);
