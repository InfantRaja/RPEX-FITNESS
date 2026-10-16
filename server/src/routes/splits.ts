import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Split, { ISplit } from '../models/Split';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// Default Built-in Preset Splits
export const PRESET_SPLITS = [
  {
    name: 'Push / Pull / Legs (PPL)',
    description: 'The gold standard 3-day or 6-day split targeting compound movements by movement pattern.',
    daysPerWeek: 6,
    isPreset: true,
    isActive: true,
    days: [
      {
        dayNumber: 1,
        name: 'Push Day',
        type: 'strength' as const,
        targetMuscleGroups: ['Chest', 'Shoulders', 'Triceps'],
        exercises: [
          { name: 'Barbell Bench Press', category: 'strength' as const, targetSets: 4, targetReps: 8, targetWeight: 70 },
          { name: 'Incline Dumbbell Press', category: 'strength' as const, targetSets: 3, targetReps: 10, targetWeight: 24 },
          { name: 'Overhead Shoulder Press', category: 'strength' as const, targetSets: 3, targetReps: 10, targetWeight: 40 },
          { name: 'Dumbbell Lateral Raise', category: 'strength' as const, targetSets: 4, targetReps: 15, targetWeight: 10 },
          { name: 'Tricep Pushdown', category: 'strength' as const, targetSets: 3, targetReps: 12, targetWeight: 25 },
        ],
        notes: 'Focus on progressive overload on bench and overhead press.',
      },
      {
        dayNumber: 2,
        name: 'Pull Day',
        type: 'strength' as const,
        targetMuscleGroups: ['Back', 'Biceps', 'Rear Delts'],
        exercises: [
          { name: 'Barbell Deadlift', category: 'strength' as const, targetSets: 3, targetReps: 5, targetWeight: 100 },
          { name: 'Barbell Row', category: 'strength' as const, targetSets: 4, targetReps: 8, targetWeight: 60 },
          { name: 'Lat Pulldown', category: 'strength' as const, targetSets: 3, targetReps: 10, targetWeight: 55 },
          { name: 'Face Pull', category: 'strength' as const, targetSets: 4, targetReps: 15, targetWeight: 20 },
          { name: 'Barbell Bicep Curl', category: 'strength' as const, targetSets: 3, targetReps: 12, targetWeight: 25 },
        ],
        notes: 'Keep back neutral on deadlifts and rows.',
      },
      {
        dayNumber: 3,
        name: 'Leg Day',
        type: 'strength' as const,
        targetMuscleGroups: ['Quads', 'Hamstrings', 'Calves'],
        exercises: [
          { name: 'Barbell Squat', category: 'strength' as const, targetSets: 4, targetReps: 8, targetWeight: 80 },
          { name: 'Leg Press', category: 'strength' as const, targetSets: 3, targetReps: 10, targetWeight: 140 },
          { name: 'Romanian Deadlift', category: 'strength' as const, targetSets: 3, targetReps: 10, targetWeight: 70 },
          { name: 'Leg Extension', category: 'strength' as const, targetSets: 3, targetReps: 12, targetWeight: 45 },
          { name: 'Calf Raise', category: 'strength' as const, targetSets: 4, targetReps: 15, targetWeight: 50 },
        ],
        notes: 'Deep squat depth and controlled eccentric tempo.',
      },
      {
        dayNumber: 4,
        name: 'Rest & Recovery',
        type: 'rest' as const,
        targetMuscleGroups: [],
        exercises: [],
        notes: 'Hydrate, stretch, light walking, and hit your protein goals.',
      },
    ],
  },
  {
    name: 'Upper / Lower (4 Days)',
    description: 'High frequency balanced routine hitting upper and lower body twice per week.',
    daysPerWeek: 4,
    isPreset: true,
    isActive: false,
    days: [
      {
        dayNumber: 1,
        name: 'Upper Power',
        type: 'strength' as const,
        targetMuscleGroups: ['Chest', 'Back', 'Arms'],
        exercises: [
          { name: 'Barbell Bench Press', category: 'strength' as const, targetSets: 4, targetReps: 6, targetWeight: 75 },
          { name: 'Barbell Row', category: 'strength' as const, targetSets: 4, targetReps: 6, targetWeight: 65 },
          { name: 'Overhead Shoulder Press', category: 'strength' as const, targetSets: 3, targetReps: 8, targetWeight: 45 },
          { name: 'Pull-up', category: 'strength' as const, targetSets: 3, targetReps: 8, targetWeight: 0 },
        ],
      },
      {
        dayNumber: 2,
        name: 'Lower Power',
        type: 'strength' as const,
        targetMuscleGroups: ['Quads', 'Hamstrings', 'Glutes'],
        exercises: [
          { name: 'Barbell Squat', category: 'strength' as const, targetSets: 4, targetReps: 6, targetWeight: 85 },
          { name: 'Romanian Deadlift', category: 'strength' as const, targetSets: 4, targetReps: 8, targetWeight: 75 },
          { name: 'Leg Press', category: 'strength' as const, targetSets: 3, targetReps: 10, targetWeight: 150 },
          { name: 'Calf Raise', category: 'strength' as const, targetSets: 4, targetReps: 12, targetWeight: 55 },
        ],
      },
      {
        dayNumber: 3,
        name: 'Upper Hypertrophy',
        type: 'strength' as const,
        targetMuscleGroups: ['Chest', 'Back', 'Shoulders', 'Arms'],
        exercises: [
          { name: 'Incline Dumbbell Press', category: 'strength' as const, targetSets: 4, targetReps: 10, targetWeight: 26 },
          { name: 'Lat Pulldown', category: 'strength' as const, targetSets: 4, targetReps: 10, targetWeight: 55 },
          { name: 'Dumbbell Lateral Raise', category: 'strength' as const, targetSets: 4, targetReps: 12, targetWeight: 12 },
          { name: 'Dumbbell Hammer Curl', category: 'strength' as const, targetSets: 3, targetReps: 12, targetWeight: 14 },
          { name: 'Tricep Pushdown', category: 'strength' as const, targetSets: 3, targetReps: 12, targetWeight: 25 },
        ],
      },
      {
        dayNumber: 4,
        name: 'Lower Hypertrophy',
        type: 'strength' as const,
        targetMuscleGroups: ['Quads', 'Hamstrings', 'Calves', 'Core'],
        exercises: [
          { name: 'Leg Press', category: 'strength' as const, targetSets: 4, targetReps: 12, targetWeight: 130 },
          { name: 'Hamstring Curl', category: 'strength' as const, targetSets: 4, targetReps: 12, targetWeight: 45 },
          { name: 'Leg Extension', category: 'strength' as const, targetSets: 4, targetReps: 12, targetWeight: 45 },
          { name: 'Bulgarian Split Squat', category: 'strength' as const, targetSets: 3, targetReps: 10, targetWeight: 16 },
          { name: 'Plank', category: 'flexibility' as const, targetSets: 3, targetReps: 60, targetWeight: 0 },
        ],
      },
    ],
  },
  {
    name: 'Arnold Split (6 Days)',
    description: 'Golden-era bodybuilding split pairing antagonist muscles (Chest & Back, Shoulders & Arms, Legs).',
    daysPerWeek: 6,
    isPreset: true,
    isActive: false,
    days: [
      {
        dayNumber: 1,
        name: 'Chest & Back',
        type: 'strength' as const,
        targetMuscleGroups: ['Chest', 'Back'],
        exercises: [
          { name: 'Barbell Bench Press', category: 'strength' as const, targetSets: 4, targetReps: 8, targetWeight: 75 },
          { name: 'Barbell Row', category: 'strength' as const, targetSets: 4, targetReps: 8, targetWeight: 65 },
          { name: 'Incline Dumbbell Press', category: 'strength' as const, targetSets: 3, targetReps: 10, targetWeight: 26 },
          { name: 'Lat Pulldown', category: 'strength' as const, targetSets: 3, targetReps: 10, targetWeight: 60 },
          { name: 'Dumbbell Fly', category: 'strength' as const, targetSets: 3, targetReps: 12, targetWeight: 14 },
        ],
      },
      {
        dayNumber: 2,
        name: 'Shoulders & Arms',
        type: 'strength' as const,
        targetMuscleGroups: ['Shoulders', 'Biceps', 'Triceps'],
        exercises: [
          { name: 'Overhead Shoulder Press', category: 'strength' as const, targetSets: 4, targetReps: 8, targetWeight: 45 },
          { name: 'Dumbbell Lateral Raise', category: 'strength' as const, targetSets: 4, targetReps: 12, targetWeight: 12 },
          { name: 'Barbell Bicep Curl', category: 'strength' as const, targetSets: 4, targetReps: 10, targetWeight: 30 },
          { name: 'Skull Crusher', category: 'strength' as const, targetSets: 4, targetReps: 10, targetWeight: 28 },
          { name: 'Dumbbell Hammer Curl', category: 'strength' as const, targetSets: 3, targetReps: 12, targetWeight: 14 },
        ],
      },
      {
        dayNumber: 3,
        name: 'Legs & Core',
        type: 'strength' as const,
        targetMuscleGroups: ['Quads', 'Hamstrings', 'Calves', 'Core'],
        exercises: [
          { name: 'Barbell Squat', category: 'strength' as const, targetSets: 4, targetReps: 8, targetWeight: 85 },
          { name: 'Romanian Deadlift', category: 'strength' as const, targetSets: 4, targetReps: 8, targetWeight: 75 },
          { name: 'Leg Press', category: 'strength' as const, targetSets: 3, targetReps: 12, targetWeight: 140 },
          { name: 'Hamstring Curl', category: 'strength' as const, targetSets: 3, targetReps: 12, targetWeight: 50 },
          { name: 'Calf Raise', category: 'strength' as const, targetSets: 4, targetReps: 15, targetWeight: 55 },
        ],
      },
    ],
  },
  {
    name: 'Full Body (3 Days)',
    description: 'Efficient high-yield compound split hitting major muscle groups 3 times per week.',
    daysPerWeek: 3,
    isPreset: true,
    isActive: false,
    days: [
      {
        dayNumber: 1,
        name: 'Full Body A',
        type: 'strength' as const,
        targetMuscleGroups: ['Full Body'],
        exercises: [
          { name: 'Barbell Squat', category: 'strength' as const, targetSets: 3, targetReps: 8, targetWeight: 75 },
          { name: 'Barbell Bench Press', category: 'strength' as const, targetSets: 3, targetReps: 8, targetWeight: 65 },
          { name: 'Barbell Row', category: 'strength' as const, targetSets: 3, targetReps: 8, targetWeight: 55 },
          { name: 'Plank', category: 'flexibility' as const, targetSets: 3, targetReps: 45, targetWeight: 0 },
        ],
      },
      {
        dayNumber: 2,
        name: 'Full Body B',
        type: 'strength' as const,
        targetMuscleGroups: ['Full Body'],
        exercises: [
          { name: 'Barbell Deadlift', category: 'strength' as const, targetSets: 3, targetReps: 5, targetWeight: 95 },
          { name: 'Overhead Shoulder Press', category: 'strength' as const, targetSets: 3, targetReps: 8, targetWeight: 40 },
          { name: 'Lat Pulldown', category: 'strength' as const, targetSets: 3, targetReps: 10, targetWeight: 50 },
          { name: 'Walking Lunges', category: 'strength' as const, targetSets: 3, targetReps: 12, targetWeight: 14 },
        ],
      },
      {
        dayNumber: 3,
        name: 'Full Body C',
        type: 'strength' as const,
        targetMuscleGroups: ['Full Body'],
        exercises: [
          { name: 'Leg Press', category: 'strength' as const, targetSets: 3, targetReps: 10, targetWeight: 130 },
          { name: 'Incline Dumbbell Press', category: 'strength' as const, targetSets: 3, targetReps: 10, targetWeight: 22 },
          { name: 'Pull-up', category: 'strength' as const, targetSets: 3, targetReps: 8, targetWeight: 0 },
          { name: 'Romanian Deadlift', category: 'strength' as const, targetSets: 3, targetReps: 10, targetWeight: 65 },
        ],
      },
    ],
  },
];

// GET /api/splits
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    let customSplits = await Split.find({ userId }).sort({ createdAt: -1 });

    // Seed preset splits for user if none exist in user's profile
    const hasPreset = customSplits.some(s => s.isPreset);
    if (!hasPreset) {
      const presetsToInsert = PRESET_SPLITS.map((p, idx) => ({
        ...p,
        userId,
        isActive: idx === 0, // Make PPL active by default
      }));
      await Split.insertMany(presetsToInsert);
      customSplits = await Split.find({ userId }).sort({ isPreset: 1, createdAt: -1 });
    }

    res.json({
      success: true,
      data: customSplits,
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
