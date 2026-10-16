import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Workout from '../models/Workout';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// GET /api/workouts
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate, template } = req.query;
    const filter: Record<string, any> = { userId: req.user?._id };

    if (type) filter.type = type;
    if (template !== undefined) filter.isTemplate = template === 'true';
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [workouts, total] = await Promise.all([
      Workout.find(filter).sort({ date: -1 }).skip(skip).limit(limitNum),
      Workout.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: workouts,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/workouts/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, userId: req.user?._id });
    if (!workout) throw new AppError('Workout not found.', 404);
    res.json({ success: true, data: workout });
  } catch (error) {
    next(error);
  }
});

// POST /api/workouts
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workoutData = { ...req.body, userId: req.user?._id };
    const workout = await Workout.create(workoutData);
    res.status(201).json({ success: true, message: 'Workout logged successfully.', data: workout });
  } catch (error) {
    next(error);
  }
});

// PUT /api/workouts/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workout = await Workout.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!workout) throw new AppError('Workout not found.', 404);
    res.json({ success: true, message: 'Workout updated.', data: workout });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/workouts/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workout = await Workout.findOneAndDelete({ _id: req.params.id, userId: req.user?._id });
    if (!workout) throw new AppError('Workout not found.', 404);
    res.json({ success: true, message: 'Workout deleted.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/workouts/stats/summary
router.get('/stats/summary', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [total, recent, totalDuration, typeBreakdown] = await Promise.all([
      Workout.countDocuments({ userId }),
      Workout.countDocuments({ userId, date: { $gte: thirtyDaysAgo } }),
      Workout.aggregate([
        { $match: { userId } },
        { $group: { _id: null, totalDuration: { $sum: '$duration' }, totalCalories: { $sum: '$caloriesBurned' } } },
      ]),
      Workout.aggregate([
        { $match: { userId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalWorkouts: total,
        workoutsLast30Days: recent,
        totalMinutes: totalDuration[0]?.totalDuration || 0,
        totalCaloriesBurned: totalDuration[0]?.totalCalories || 0,
        typeBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
