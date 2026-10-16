import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import NutritionLog from '../models/NutritionLog';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// GET /api/nutrition
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 30, startDate, endDate } = req.query;
    const filter: Record<string, any> = { userId: req.user?._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      NutritionLog.find(filter).sort({ date: -1 }).skip(skip).limit(limitNum),
      NutritionLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/nutrition/today
router.get('/today', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let log = await NutritionLog.findOne({
      userId: req.user?._id,
      date: { $gte: today, $lt: tomorrow },
    });

    if (!log) {
      log = new NutritionLog({ userId: req.user?._id, date: today, meals: [] });
    }

    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
});

// GET /api/nutrition/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const log = await NutritionLog.findOne({ _id: req.params.id, userId: req.user?._id });
    if (!log) throw new AppError('Nutrition log not found.', 404);
    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
});

// POST /api/nutrition
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const logData = { ...req.body, userId: req.user?._id };
    const log = await NutritionLog.create(logData);
    res.status(201).json({ success: true, message: 'Nutrition log created.', data: log });
  } catch (error) {
    next(error);
  }
});

// PUT /api/nutrition/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const log = await NutritionLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!log) throw new AppError('Nutrition log not found.', 404);
    res.json({ success: true, message: 'Nutrition log updated.', data: log });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/nutrition/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const log = await NutritionLog.findOneAndDelete({ _id: req.params.id, userId: req.user?._id });
    if (!log) throw new AppError('Nutrition log not found.', 404);
    res.json({ success: true, message: 'Nutrition log deleted.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/nutrition/stats/summary
router.get('/stats/summary', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const weeklyStats = await NutritionLog.aggregate([
      { $match: { userId, date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: null,
          avgCalories: { $avg: '$totalCalories' },
          avgProtein: { $avg: '$totalProtein' },
          avgCarbs: { $avg: '$totalCarbs' },
          avgFat: { $avg: '$totalFat' },
          daysLogged: { $sum: 1 },
        },
      },
    ]);

    res.json({ success: true, data: weeklyStats[0] || {} });
  } catch (error) {
    next(error);
  }
});

export default router;
