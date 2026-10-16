import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IOnboarding {
  completed: boolean;
  height?: number; // cm
  weight?: number; // kg
  age?: number;
  dateOfBirth?: Date;
  unitSystem: 'metric' | 'imperial';
  fitnessExperience: 'beginner' | 'intermediate' | 'advanced';
  fitnessGoal: 'muscle_building' | 'fat_loss' | 'strength' | 'weight_gain' | 'maintenance' | 'general_fitness';
  workoutLocation: 'gym' | 'home' | 'both';
  availableEquipment: string[];
  trainingDaysPerWeek: number;
  dietaryPreference: 'none' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean';
  foodAllergies: string[];
  preferredLanguage: string;
  mealBudget?: number;
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

const OnboardingSchema = new Schema<IOnboarding>({
  completed: { type: Boolean, default: false },
  height: { type: Number, min: 50, max: 300 },
  weight: { type: Number, min: 20, max: 500 },
  age: { type: Number, min: 10, max: 120 },
  dateOfBirth: { type: Date },
  unitSystem: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
  fitnessExperience: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  fitnessGoal: {
    type: String,
    enum: ['muscle_building', 'fat_loss', 'strength', 'weight_gain', 'maintenance', 'general_fitness'],
    default: 'general_fitness',
  },
  workoutLocation: { type: String, enum: ['gym', 'home', 'both'], default: 'gym' },
  availableEquipment: [{ type: String }],
  trainingDaysPerWeek: { type: Number, min: 1, max: 7, default: 3 },
  dietaryPreference: {
    type: String,
    enum: ['none', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean'],
    default: 'none',
  },
  foodAllergies: [{ type: String }],
  preferredLanguage: { type: String, default: 'en' },
  mealBudget: { type: Number, min: 0 },
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
