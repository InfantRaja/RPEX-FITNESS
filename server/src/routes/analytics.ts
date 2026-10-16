import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Workout from '../models/Workout';
import NutritionLog from '../models/NutritionLog';
import Progress from '../models/Progress';

const router = Router();
router.use(authenticate);

// GET /api/analytics/overview
router.get('/overview', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [
      workoutsThisMonth,
      workoutsLastMonth,
      workoutStreak,
      nutritionThisWeek,
      latestProgress,
      weeklyWorkouts,
      weeklyCalories,
    ] = await Promise.all([
      Workout.countDocuments({ userId, date: { $gte: thirtyDaysAgo } }),
      Workout.countDocuments({ userId, date: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      calculateStreak(userId),
      NutritionLog.aggregate([
        { $match: { userId, date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: null, avgCal: { $avg: '$totalCalories' }, avgProtein: { $avg: '$totalProtein' } } },
      ]),
      Progress.findOne({ userId }).sort({ date: -1 }),
      getWeeklyWorkoutData(userId),
      getWeeklyCalorieData(userId),
    ]);

    res.json({
      success: true,
      data: {
        workoutsThisMonth,
        workoutsLastMonth,
        workoutStreak,
        avgDailyCalories: nutritionThisWeek[0]?.avgCal || 0,
        avgDailyProtein: nutritionThisWeek[0]?.avgProtein || 0,
        latestWeight: latestProgress?.weight,
        weeklyWorkouts,
        weeklyCalories,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/workouts/weekly
router.get('/workouts/weekly', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await getWeeklyWorkoutData(req.user?._id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/nutrition/weekly
router.get('/nutrition/weekly', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const data = await NutritionLog.aggregate([
      { $match: { userId, date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          calories: { $sum: '$totalCalories' },
          protein: { $sum: '$totalProtein' },
          carbs: { $sum: '$totalCarbs' },
          fat: { $sum: '$totalFat' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/progress/chart
router.get('/progress/chart', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { metric = 'weight', limit = 30 } = req.query;
    const entries = await Progress.find({ userId: req.user?._id })
      .sort({ date: 1 })
      .limit(parseInt(limit as string))
      .select(`date ${metric}`);

    const data = entries.map(e => ({
      date: e.date,
      value: (e as any)[metric as string],
    })).filter(e => e.value !== undefined);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

async function calculateStreak(userId: any): Promise<number> {
  const workouts = await Workout.find({ userId })
    .sort({ date: -1 })
    .select('date')
    .limit(100);

  if (workouts.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const workoutDates = new Set(
    workouts.map(w => {
      const d = new Date(w.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  while (workoutDates.has(currentDate.getTime())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

async function getWeeklyWorkoutData(userId: any) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return Workout.aggregate([
    { $match: { userId, date: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        count: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        totalCalories: { $sum: '$caloriesBurned' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

async function getWeeklyCalorieData(userId: any) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return NutritionLog.aggregate([
    { $match: { userId, date: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        calories: { $sum: '$totalCalories' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export default router;
