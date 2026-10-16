import mongoose, { Document, Schema } from 'mongoose';

export interface IProgressEntry extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  weight?: number; // kg
  bodyFat?: number; // percentage
  muscleMass?: number; // kg
  chest?: number; // cm
  waist?: number; // cm
  hips?: number; // cm
  arms?: number; // cm
  thighs?: number; // cm
  calves?: number; // cm
  notes?: string;
  photos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema = new Schema<IProgressEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, default: Date.now },
    weight: { type: Number, min: 20, max: 500 },
    bodyFat: { type: Number, min: 1, max: 60 },
    muscleMass: { type: Number, min: 10, max: 200 },
    chest: { type: Number, min: 50, max: 200 },
    waist: { type: Number, min: 40, max: 200 },
    hips: { type: Number, min: 50, max: 200 },
    arms: { type: Number, min: 10, max: 80 },
    thighs: { type: Number, min: 20, max: 100 },
    calves: { type: Number, min: 10, max: 70 },
    notes: { type: String, maxlength: 1000 },
    photos: [{ type: String }],
  },
  { timestamps: true }
);

ProgressSchema.index({ userId: 1, date: -1 });

export default mongoose.model<IProgressEntry>('Progress', ProgressSchema);
