import mongoose, { Document, Schema } from 'mongoose';

export interface IExerciseSet {
  setNumber: number;
  reps?: number;
  weight?: number; // kg
  duration?: number; // seconds (for time-based exercises)
  distance?: number; // km (for cardio)
  restTime?: number; // seconds
  notes?: string;
  completed: boolean;
}

export interface IExercise {
  name: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other';
  muscleGroups: string[];
  sets: IExerciseSet[];
  notes?: string;
}

export interface IWorkout extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  type: 'strength' | 'cardio' | 'hiit' | 'yoga' | 'sports' | 'other';
  exercises: IExercise[];
  duration: number; // minutes
  caloriesBurned?: number;
  notes?: string;
  date: Date;
  isTemplate: boolean;
  rating?: number; // 1-5
  mood?: 'terrible' | 'bad' | 'okay' | 'good' | 'great';
  location?: 'gym' | 'home' | 'outdoor' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSetSchema = new Schema<IExerciseSet>({
  setNumber: { type: Number, required: true },
  reps: { type: Number, min: 0 },
  weight: { type: Number, min: 0 },
  duration: { type: Number, min: 0 },
  distance: { type: Number, min: 0 },
  restTime: { type: Number, min: 0 },
  notes: { type: String, maxlength: 200 },
  completed: { type: Boolean, default: false },
}, { _id: false });

const ExerciseSchema = new Schema<IExercise>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  category: {
    type: String,
    enum: ['strength', 'cardio', 'flexibility', 'sports', 'other'],
    default: 'strength',
  },
  muscleGroups: [{ type: String }],
  sets: [ExerciseSetSchema],
  notes: { type: String, maxlength: 500 },
}, { _id: false });

const WorkoutSchema = new Schema<IWorkout>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    type: {
      type: String,
      enum: ['strength', 'cardio', 'hiit', 'yoga', 'sports', 'other'],
      default: 'strength',
    },
    exercises: [ExerciseSchema],
    duration: { type: Number, required: true, min: 1 },
    caloriesBurned: { type: Number, min: 0 },
    notes: { type: String, maxlength: 1000 },
    date: { type: Date, required: true, default: Date.now },
    isTemplate: { type: Boolean, default: false },
    rating: { type: Number, min: 1, max: 5 },
    mood: { type: String, enum: ['terrible', 'bad', 'okay', 'good', 'great'] },
    location: { type: String, enum: ['gym', 'home', 'outdoor', 'other'] },
  },
  { timestamps: true }
);

WorkoutSchema.index({ userId: 1, date: -1 });
WorkoutSchema.index({ userId: 1, isTemplate: 1 });

export default mongoose.model<IWorkout>('Workout', WorkoutSchema);
