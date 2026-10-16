import mongoose, { Document, Schema } from 'mongoose';

export interface ISplitDayExercise {
  name: string;
  category?: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other';
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
}

export interface ISplitDay {
  dayNumber: number;
  name: string;
  type: 'strength' | 'cardio' | 'hiit' | 'yoga' | 'sports' | 'other' | 'rest';
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
  targetSets: { type: Number, default: 3, min: 1 },
  targetReps: { type: Number, default: 10, min: 1 },
  targetWeight: { type: Number, default: 0, min: 0 },
}, { _id: false });

const SplitDaySchema = new Schema<ISplitDay>({
  dayNumber: { type: Number, required: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['strength', 'cardio', 'hiit', 'yoga', 'sports', 'other', 'rest'],
    default: 'strength',
  },
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
    days: [SplitDaySchema],
  },
  { timestamps: true }
);

SplitSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model<ISplit>('Split', SplitSchema);
