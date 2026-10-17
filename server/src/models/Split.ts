import mongoose, { Document, Schema } from 'mongoose';

export interface ISplitDayExercise {
  name: string;
  category?: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other';
  sets?: number;
  targetSets?: number;
  reps?: string | number;
  targetReps?: number;
  targetWeight?: number;
  muscleGroup?: string;
}

export interface ISplitDay {
  dayNumber: number;
  name: string;
  type?: 'strength' | 'cardio' | 'hiit' | 'yoga' | 'sports' | 'other' | 'rest';
  muscleGroups?: string[];
  targetMuscleGroups?: string[];
  exercises: ISplitDayExercise[];
  notes?: string;
}

export interface ISplit extends Document {
  userId?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  daysPerWeek?: number;
  isActive: boolean;
  isPreset: boolean;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'pro' | string;
  days: ISplitDay[];
  createdAt: Date;
  updatedAt: Date;
}

const SplitDayExerciseSchema = new Schema<ISplitDayExercise>({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['strength', 'cardio', 'flexibility', 'sports', 'other'],
    default: 'strength',
  },
  sets: { type: Number, default: 3, min: 1 },
  targetSets: { type: Number, default: 3, min: 1 },
  reps: { type: Schema.Types.Mixed, default: '8-12' },
  targetReps: { type: Number, default: 10, min: 1 },
  targetWeight: { type: Number, default: 0, min: 0 },
  muscleGroup: { type: String, trim: true },
}, { _id: false });

const SplitDaySchema = new Schema<ISplitDay>({
  dayNumber: { type: Number, required: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['strength', 'cardio', 'hiit', 'yoga', 'sports', 'other', 'rest'],
    default: 'strength',
  },
  muscleGroups: [{ type: String }],
  targetMuscleGroups: [{ type: String }],
  exercises: [SplitDayExerciseSchema],
  notes: { type: String, maxlength: 500 },
}, { _id: false });

const SplitSchema = new Schema<ISplit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 500 },
    daysPerWeek: { type: Number, min: 1, max: 7, default: 4 },
    isActive: { type: Boolean, default: false },
    isPreset: { type: Boolean, default: false },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'pro', 'all'],
      default: 'intermediate',
    },
    days: [SplitDaySchema],
  },
  { timestamps: true }
);

SplitSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model<ISplit>('Split', SplitSchema);
