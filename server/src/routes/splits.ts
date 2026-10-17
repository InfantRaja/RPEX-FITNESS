import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Split, { ISplit } from '../models/Split';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// Default Built-in Preset Splits (Beginner, Intermediate, Advanced, Pro)
export const PRESET_SPLITS = [
  {
    name: 'Beginner Full Body (3 Days)',
    description: 'Beginner-friendly full-body plan focused on learning technique and building consistency.',
    daysPerWeek: 3,
    isActive: false,
    isPreset: true,
    level: 'beginner' as const,
    days: [
      {
        dayNumber: 1,
        name: 'Full Body A',
        type: 'strength' as const,
        muscleGroups: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms'],
        targetMuscleGroups: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms'],
        exercises: [
          { name: 'Goblet Squat', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Machine Chest Press', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Lat Pulldown', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Dumbbell Romanian Deadlift', sets: 2, targetSets: 2, reps: '10-12', targetReps: 10, muscleGroup: 'Hamstrings', category: 'strength' as const },
          { name: 'Dumbbell Shoulder Press', sets: 2, targetSets: 2, reps: '8-12', targetReps: 10, muscleGroup: 'Shoulders', category: 'strength' as const },
          { name: 'Plank', sets: 3, targetSets: 3, reps: '20-45 sec', targetReps: 30, muscleGroup: 'Core', category: 'flexibility' as const },
        ],
      },
      {
        dayNumber: 2,
        name: 'Full Body B',
        type: 'strength' as const,
        muscleGroups: ['Legs', 'Chest', 'Back', 'Arms', 'Core'],
        targetMuscleGroups: ['Legs', 'Chest', 'Back', 'Arms', 'Core'],
        exercises: [
          { name: 'Leg Press', sets: 3, targetSets: 3, reps: '10-12', targetReps: 10, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Seated Cable Row', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Incline Dumbbell Press', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Leg Curl', sets: 2, targetSets: 2, reps: '10-15', targetReps: 12, muscleGroup: 'Hamstrings', category: 'strength' as const },
          { name: 'Dumbbell Curl', sets: 2, targetSets: 2, reps: '10-15', targetReps: 12, muscleGroup: 'Biceps', category: 'strength' as const },
          { name: 'Dead Bug', sets: 3, targetSets: 3, reps: '8-12 per side', targetReps: 10, muscleGroup: 'Core', category: 'flexibility' as const },
        ],
      },
      {
        dayNumber: 3,
        name: 'Full Body C',
        type: 'strength' as const,
        muscleGroups: ['Legs', 'Chest', 'Back', 'Shoulders', 'Calves'],
        targetMuscleGroups: ['Legs', 'Chest', 'Back', 'Shoulders', 'Calves'],
        exercises: [
          { name: 'Bodyweight Squat', sets: 3, targetSets: 3, reps: '10-15', targetReps: 12, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Machine Chest Press', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Chest-Supported Row', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Hip Thrust', sets: 3, targetSets: 3, reps: '10-12', targetReps: 10, muscleGroup: 'Glutes', category: 'strength' as const },
          { name: 'Dumbbell Lateral Raise', sets: 2, targetSets: 2, reps: '12-15', targetReps: 12, muscleGroup: 'Shoulders', category: 'strength' as const },
          { name: 'Standing Calf Raise', sets: 2, targetSets: 2, reps: '12-20', targetReps: 15, muscleGroup: 'Calves', category: 'strength' as const },
        ],
      },
    ],
  },
  {
    name: 'Intermediate Upper / Lower (4 Days)',
    description: 'Balanced four-day split for lifters with consistent training experience.',
    daysPerWeek: 4,
    isActive: false,
    isPreset: true,
    level: 'intermediate' as const,
    days: [
      {
        dayNumber: 1,
        name: 'Upper A',
        type: 'strength' as const,
        muscleGroups: ['Chest', 'Back', 'Shoulders', 'Arms'],
        targetMuscleGroups: ['Chest', 'Back', 'Shoulders', 'Arms'],
        exercises: [
          { name: 'Barbell Bench Press', sets: 3, targetSets: 3, reps: '6-8', targetReps: 8, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Chest-Supported Row', sets: 3, targetSets: 3, reps: '8-10', targetReps: 8, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Incline Dumbbell Press', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Lat Pulldown', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Dumbbell Lateral Raise', sets: 3, targetSets: 3, reps: '12-15', targetReps: 12, muscleGroup: 'Shoulders', category: 'strength' as const },
          { name: 'Cable Triceps Pushdown', sets: 2, targetSets: 2, reps: '10-15', targetReps: 12, muscleGroup: 'Triceps', category: 'strength' as const },
          { name: 'Dumbbell Curl', sets: 2, targetSets: 2, reps: '10-15', targetReps: 12, muscleGroup: 'Biceps', category: 'strength' as const },
        ],
      },
      {
        dayNumber: 2,
        name: 'Lower A',
        type: 'strength' as const,
        muscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Core'],
        targetMuscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Core'],
        exercises: [
          { name: 'Back Squat', sets: 3, targetSets: 3, reps: '6-8', targetReps: 8, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Romanian Deadlift', sets: 3, targetSets: 3, reps: '8-10', targetReps: 8, muscleGroup: 'Hamstrings', category: 'strength' as const },
          { name: 'Leg Press', sets: 3, targetSets: 3, reps: '10-12', targetReps: 10, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Seated Leg Curl', sets: 3, targetSets: 3, reps: '10-15', targetReps: 12, muscleGroup: 'Hamstrings', category: 'strength' as const },
          { name: 'Standing Calf Raise', sets: 3, targetSets: 3, reps: '12-20', targetReps: 15, muscleGroup: 'Calves', category: 'strength' as const },
          { name: 'Plank', sets: 3, targetSets: 3, reps: '30-60 sec', targetReps: 45, muscleGroup: 'Core', category: 'flexibility' as const },
        ],
      },
      {
        dayNumber: 3,
        name: 'Upper B',
        type: 'strength' as const,
        muscleGroups: ['Back', 'Chest', 'Shoulders', 'Arms'],
        targetMuscleGroups: ['Back', 'Chest', 'Shoulders', 'Arms'],
        exercises: [
          { name: 'Pull-Up or Assisted Pull-Up', sets: 3, targetSets: 3, reps: '6-10', targetReps: 8, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Incline Barbell Press', sets: 3, targetSets: 3, reps: '6-10', targetReps: 8, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Seated Cable Row', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Machine Chest Press', sets: 2, targetSets: 2, reps: '10-12', targetReps: 10, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Reverse Pec Deck', sets: 3, targetSets: 3, reps: '12-15', targetReps: 12, muscleGroup: 'Rear Delts', category: 'strength' as const },
          { name: 'Overhead Triceps Extension', sets: 2, targetSets: 2, reps: '10-15', targetReps: 12, muscleGroup: 'Triceps', category: 'strength' as const },
          { name: 'Incline Dumbbell Curl', sets: 2, targetSets: 2, reps: '10-12', targetReps: 10, muscleGroup: 'Biceps', category: 'strength' as const },
        ],
      },
      {
        dayNumber: 4,
        name: 'Lower B',
        type: 'strength' as const,
        muscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
        targetMuscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
        exercises: [
          { name: 'Hack Squat', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Hip Thrust', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Glutes', category: 'strength' as const },
          { name: 'Bulgarian Split Squat', sets: 2, targetSets: 2, reps: '8-12 per leg', targetReps: 10, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Lying Leg Curl', sets: 3, targetSets: 3, reps: '10-15', targetReps: 12, muscleGroup: 'Hamstrings', category: 'strength' as const },
          { name: 'Leg Extension', sets: 2, targetSets: 2, reps: '12-15', targetReps: 12, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Seated Calf Raise', sets: 3, targetSets: 3, reps: '12-20', targetReps: 15, muscleGroup: 'Calves', category: 'strength' as const },
        ],
      },
    ],
  },
  {
    name: 'Advanced Push / Pull / Legs (6 Days)',
    description: 'Six-day hypertrophy split for experienced lifters who recover well and use sound technique.',
    daysPerWeek: 6,
    isActive: false,
    isPreset: true,
    level: 'advanced' as const,
    days: [
      {
        dayNumber: 1,
        name: 'Push A',
        type: 'strength' as const,
        muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
        targetMuscleGroups: ['Chest', 'Shoulders', 'Triceps'],
        exercises: [
          { name: 'Barbell Bench Press', sets: 3, targetSets: 3, reps: '5-8', targetReps: 8, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Incline Dumbbell Press', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Seated Shoulder Press', sets: 3, targetSets: 3, reps: '6-10', targetReps: 8, muscleGroup: 'Shoulders', category: 'strength' as const },
          { name: 'Cable Lateral Raise', sets: 3, targetSets: 3, reps: '12-20', targetReps: 15, muscleGroup: 'Shoulders', category: 'strength' as const },
          { name: 'Cable Fly', sets: 2, targetSets: 2, reps: '12-15', targetReps: 12, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Cable Triceps Pushdown', sets: 3, targetSets: 3, reps: '10-15', targetReps: 12, muscleGroup: 'Triceps', category: 'strength' as const },
        ],
      },
      {
        dayNumber: 2,
        name: 'Pull A',
        type: 'strength' as const,
        muscleGroups: ['Back', 'Rear Delts', 'Biceps'],
        targetMuscleGroups: ['Back', 'Rear Delts', 'Biceps'],
        exercises: [
          { name: 'Weighted Pull-Up or Lat Pulldown', sets: 3, targetSets: 3, reps: '6-10', targetReps: 8, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Chest-Supported Row', sets: 3, targetSets: 3, reps: '6-10', targetReps: 8, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Single-Arm Cable Row', sets: 2, targetSets: 2, reps: '10-12', targetReps: 10, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Reverse Pec Deck', sets: 3, targetSets: 3, reps: '12-20', targetReps: 15, muscleGroup: 'Rear Delts', category: 'strength' as const },
          { name: 'EZ-Bar Curl', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Biceps', category: 'strength' as const },
          { name: 'Hammer Curl', sets: 2, targetSets: 2, reps: '10-15', targetReps: 12, muscleGroup: 'Biceps', category: 'strength' as const },
        ],
      },
      {
        dayNumber: 3,
        name: 'Legs A',
        type: 'strength' as const,
        muscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
        targetMuscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
        exercises: [
          { name: 'Back Squat', sets: 3, targetSets: 3, reps: '5-8', targetReps: 8, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Romanian Deadlift', sets: 3, targetSets: 3, reps: '6-10', targetReps: 8, muscleGroup: 'Hamstrings', category: 'strength' as const },
          { name: 'Leg Press', sets: 3, targetSets: 3, reps: '10-15', targetReps: 12, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Seated Leg Curl', sets: 3, targetSets: 3, reps: '10-15', targetReps: 12, muscleGroup: 'Hamstrings', category: 'strength' as const },
          { name: 'Standing Calf Raise', sets: 4, targetSets: 4, reps: '10-20', targetReps: 15, muscleGroup: 'Calves', category: 'strength' as const },
        ],
      },
      {
        dayNumber: 4,
        name: 'Push B',
        type: 'strength' as const,
        muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
        targetMuscleGroups: ['Chest', 'Shoulders', 'Triceps'],
        exercises: [
          { name: 'Incline Barbell Press', sets: 3, targetSets: 3, reps: '6-10', targetReps: 8, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Machine Chest Press', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Dumbbell Shoulder Press', sets: 2, targetSets: 2, reps: '8-12', targetReps: 10, muscleGroup: 'Shoulders', category: 'strength' as const },
          { name: 'Dumbbell Lateral Raise', sets: 3, targetSets: 3, reps: '12-20', targetReps: 15, muscleGroup: 'Shoulders', category: 'strength' as const },
          { name: 'Pec Deck', sets: 2, targetSets: 2, reps: '12-15', targetReps: 12, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Overhead Cable Triceps Extension', sets: 3, targetSets: 3, reps: '10-15', targetReps: 12, muscleGroup: 'Triceps', category: 'strength' as const },
        ],
      },
      {
        dayNumber: 5,
        name: 'Pull B',
        type: 'strength' as const,
        muscleGroups: ['Back', 'Rear Delts', 'Biceps'],
        targetMuscleGroups: ['Back', 'Rear Delts', 'Biceps'],
        exercises: [
          { name: 'Neutral-Grip Lat Pulldown', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Seated Cable Row', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Straight-Arm Pulldown', sets: 2, targetSets: 2, reps: '12-15', targetReps: 12, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Face Pull', sets: 3, targetSets: 3, reps: '12-20', targetReps: 15, muscleGroup: 'Rear Delts', category: 'strength' as const },
          { name: 'Incline Dumbbell Curl', sets: 3, targetSets: 3, reps: '10-12', targetReps: 10, muscleGroup: 'Biceps', category: 'strength' as const },
          { name: 'Cable Curl', sets: 2, targetSets: 2, reps: '12-15', targetReps: 12, muscleGroup: 'Biceps', category: 'strength' as const },
        ],
      },
      {
        dayNumber: 6,
        name: 'Legs B',
        type: 'strength' as const,
        muscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
        targetMuscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
        exercises: [
          { name: 'Hack Squat', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Hip Thrust', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Glutes', category: 'strength' as const },
          { name: 'Bulgarian Split Squat', sets: 2, targetSets: 2, reps: '8-12 per leg', targetReps: 10, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Lying Leg Curl', sets: 3, targetSets: 3, reps: '10-15', targetReps: 12, muscleGroup: 'Hamstrings', category: 'strength' as const },
          { name: 'Leg Extension', sets: 2, targetSets: 2, reps: '12-15', targetReps: 12, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Seated Calf Raise', sets: 4, targetSets: 4, reps: '12-20', targetReps: 15, muscleGroup: 'Calves', category: 'strength' as const },
        ],
      },
    ],
  },
  {
    name: 'Pro Specialized Hypertrophy (6 Days)',
    description: 'High-structure six-day specialization plan for very experienced lifters; manage fatigue and adjust volume to recovery.',
    daysPerWeek: 6,
    isActive: false,
    isPreset: true,
    level: 'pro' as const,
    days: [
      {
        dayNumber: 1,
        name: 'Chest & Back A',
        type: 'strength' as const,
        muscleGroups: ['Chest', 'Back'],
        targetMuscleGroups: ['Chest', 'Back'],
        exercises: [
          { name: 'Barbell Bench Press', sets: 3, targetSets: 3, reps: '5-8', targetReps: 8, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Weighted Pull-Up', sets: 3, targetSets: 3, reps: '6-10', targetReps: 8, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Incline Dumbbell Press', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Chest-Supported Row', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Cable Fly', sets: 2, targetSets: 2, reps: '12-15', targetReps: 12, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Straight-Arm Pulldown', sets: 2, targetSets: 2, reps: '12-15', targetReps: 12, muscleGroup: 'Back', category: 'strength' as const },
        ],
      },
      {
        dayNumber: 2,
        name: 'Shoulders & Arms A',
        type: 'strength' as const,
        muscleGroups: ['Shoulders', 'Biceps', 'Triceps'],
        targetMuscleGroups: ['Shoulders', 'Biceps', 'Triceps'],
        exercises: [
          { name: 'Seated Shoulder Press', sets: 3, targetSets: 3, reps: '6-10', targetReps: 8, muscleGroup: 'Shoulders', category: 'strength' as const },
          { name: 'Cable Lateral Raise', sets: 4, targetSets: 4, reps: '12-20', targetReps: 15, muscleGroup: 'Shoulders', category: 'strength' as const },
          { name: 'Reverse Pec Deck', sets: 3, targetSets: 3, reps: '12-20', targetReps: 15, muscleGroup: 'Rear Delts', category: 'strength' as const },
          { name: 'EZ-Bar Curl', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Biceps', category: 'strength' as const },
          { name: 'Incline Dumbbell Curl', sets: 2, targetSets: 2, reps: '10-15', targetReps: 12, muscleGroup: 'Biceps', category: 'strength' as const },
          { name: 'Cable Triceps Pushdown', sets: 3, targetSets: 3, reps: '10-15', targetReps: 12, muscleGroup: 'Triceps', category: 'strength' as const },
          { name: 'Overhead Cable Triceps Extension', sets: 2, targetSets: 2, reps: '10-15', targetReps: 12, muscleGroup: 'Triceps', category: 'strength' as const },
        ],
      },
      {
        dayNumber: 3,
        name: 'Legs A',
        type: 'strength' as const,
        muscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
        targetMuscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
        exercises: [
          { name: 'Back Squat', sets: 3, targetSets: 3, reps: '5-8', targetReps: 8, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Romanian Deadlift', sets: 3, targetSets: 3, reps: '6-10', targetReps: 8, muscleGroup: 'Hamstrings', category: 'strength' as const },
          { name: 'Leg Press', sets: 3, targetSets: 3, reps: '10-15', targetReps: 12, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Seated Leg Curl', sets: 3, targetSets: 3, reps: '10-15', targetReps: 12, muscleGroup: 'Hamstrings', category: 'strength' as const },
          { name: 'Standing Calf Raise', sets: 4, targetSets: 4, reps: '10-20', targetReps: 15, muscleGroup: 'Calves', category: 'strength' as const },
        ],
      },
      {
        dayNumber: 4,
        name: 'Chest & Back B',
        type: 'strength' as const,
        muscleGroups: ['Chest', 'Back'],
        targetMuscleGroups: ['Chest', 'Back'],
        exercises: [
          { name: 'Incline Barbell Press', sets: 3, targetSets: 3, reps: '6-10', targetReps: 8, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Lat Pulldown', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Machine Chest Press', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Seated Cable Row', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Back', category: 'strength' as const },
          { name: 'Pec Deck', sets: 2, targetSets: 2, reps: '12-15', targetReps: 12, muscleGroup: 'Chest', category: 'strength' as const },
          { name: 'Single-Arm Cable Row', sets: 2, targetSets: 2, reps: '10-12', targetReps: 10, muscleGroup: 'Back', category: 'strength' as const },
        ],
      },
      {
        dayNumber: 5,
        name: 'Shoulders & Arms B',
        type: 'strength' as const,
        muscleGroups: ['Shoulders', 'Biceps', 'Triceps'],
        targetMuscleGroups: ['Shoulders', 'Biceps', 'Triceps'],
        exercises: [
          { name: 'Dumbbell Shoulder Press', sets: 2, targetSets: 2, reps: '8-12', targetReps: 10, muscleGroup: 'Shoulders', category: 'strength' as const },
          { name: 'Dumbbell Lateral Raise', sets: 4, targetSets: 4, reps: '12-20', targetReps: 15, muscleGroup: 'Shoulders', category: 'strength' as const },
          { name: 'Face Pull', sets: 3, targetSets: 3, reps: '12-20', targetReps: 15, muscleGroup: 'Rear Delts', category: 'strength' as const },
          { name: 'Hammer Curl', sets: 3, targetSets: 3, reps: '10-15', targetReps: 12, muscleGroup: 'Biceps', category: 'strength' as const },
          { name: 'Cable Curl', sets: 2, targetSets: 2, reps: '12-15', targetReps: 12, muscleGroup: 'Biceps', category: 'strength' as const },
          { name: 'Lying Triceps Extension', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Triceps', category: 'strength' as const },
          { name: 'Rope Pushdown', sets: 2, targetSets: 2, reps: '12-15', targetReps: 12, muscleGroup: 'Triceps', category: 'strength' as const },
        ],
      },
      {
        dayNumber: 6,
        name: 'Legs B',
        type: 'strength' as const,
        muscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
        targetMuscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
        exercises: [
          { name: 'Hack Squat', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Hip Thrust', sets: 3, targetSets: 3, reps: '8-12', targetReps: 10, muscleGroup: 'Glutes', category: 'strength' as const },
          { name: 'Bulgarian Split Squat', sets: 2, targetSets: 2, reps: '8-12 per leg', targetReps: 10, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Lying Leg Curl', sets: 3, targetSets: 3, reps: '10-15', targetReps: 12, muscleGroup: 'Hamstrings', category: 'strength' as const },
          { name: 'Leg Extension', sets: 2, targetSets: 2, reps: '12-15', targetReps: 12, muscleGroup: 'Quadriceps', category: 'strength' as const },
          { name: 'Seated Calf Raise', sets: 4, targetSets: 4, reps: '12-20', targetReps: 15, muscleGroup: 'Calves', category: 'strength' as const },
        ],
      },
    ],
  },
];

// Helper to seed or sync presets for user
async function syncPresetsForUser(userId: any) {
  const existingSplits = await Split.find({ userId });
  const existingPresets = existingSplits.filter(s => s.isPreset);
  const presetNames = new Set(PRESET_SPLITS.map(p => p.name));

  // If user has old presets that don't match the new preset names, or is missing presets
  const needsSync = existingPresets.length === 0 || existingPresets.some(p => !presetNames.has(p.name)) || existingPresets.length < PRESET_SPLITS.length;

  if (needsSync) {
    // Preserve active status if user had an active preset
    const hadActivePreset = existingPresets.some(p => p.isActive);
    const activeCustom = existingSplits.find(s => !s.isPreset && s.isActive);

    // Remove legacy presets
    await Split.deleteMany({ userId, isPreset: true });

    // Insert modern presets
    const toInsert = PRESET_SPLITS.map((p, idx) => ({
      ...p,
      userId,
      isActive: (!activeCustom && (hadActivePreset ? idx === 0 : idx === 0)) || false,
    }));
    await Split.insertMany(toInsert);
  }
}

// GET /api/splits
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    await syncPresetsForUser(userId);

    const splits = await Split.find({ userId }).sort({ isPreset: 1, createdAt: -1 });

    res.json({
      success: true,
      data: splits,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/splits/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const split = await Split.findOne({ _id: req.params.id, userId: req.user?._id });
    if (!split) throw new AppError('Split not found.', 404);
    res.json({ success: true, data: split });
  } catch (error) {
    next(error);
  }
});

// POST /api/splits (Create Custom Split)
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { name, description, daysPerWeek, days, setAsActive } = req.body;

    if (!name || !name.trim()) {
      throw new AppError('Split name is required.', 400);
    }

    if (setAsActive) {
      await Split.updateMany({ userId }, { isActive: false });
    }

    const split = await Split.create({
      userId,
      name: name.trim(),
      description: description?.trim() || '',
      daysPerWeek: daysPerWeek || (days?.length || 4),
      isActive: Boolean(setAsActive),
      isPreset: false,
      days: days || [],
    });

    res.status(201).json({
      success: true,
      message: 'Custom split created successfully.',
      data: split,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/splits/:id (Update Split)
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const split = await Split.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!split) throw new AppError('Split not found.', 404);
    res.json({ success: true, message: 'Split updated.', data: split });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/splits/:id/activate (Set as Active Split)
router.patch('/:id/activate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    await Split.updateMany({ userId }, { isActive: false });
    const split = await Split.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isActive: true },
      { new: true }
    );
    if (!split) throw new AppError('Split not found.', 404);
    res.json({ success: true, message: `Activated "${split.name}" as your active split.`, data: split });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/splits/:id (Delete Split)
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const split = await Split.findOneAndDelete({ _id: req.params.id, userId });
    if (!split) throw new AppError('Split not found.', 404);
    res.json({ success: true, message: 'Split deleted.' });
  } catch (error) {
    next(error);
  }
});

export default router;
