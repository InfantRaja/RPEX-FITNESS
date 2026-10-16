import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Progress from '../models/Progress';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// GET /api/progress
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = 30, startDate, endDate } = req.query;
    const filter: Record<string, any> = { userId: req.user?._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const entries = await Progress.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit as string));

    res.json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
});

// GET /api/progress/latest
router.get('/latest', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await Progress.findOne({ userId: req.user?._id }).sort({ date: -1 });
    res.json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

// GET /api/progress/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await Progress.findOne({ _id: req.params.id, userId: req.user?._id });
    if (!entry) throw new AppError('Progress entry not found.', 404);
    res.json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

// POST /api/progress
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await Progress.create({ ...req.body, userId: req.user?._id });
    res.status(201).json({ success: true, message: 'Progress logged.', data: entry });
  } catch (error) {
    next(error);
  }
});

// PUT /api/progress/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await Progress.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!entry) throw new AppError('Progress entry not found.', 404);
    res.json({ success: true, message: 'Progress updated.', data: entry });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/progress/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await Progress.findOneAndDelete({ _id: req.params.id, userId: req.user?._id });
    if (!entry) throw new AppError('Progress entry not found.', 404);
    res.json({ success: true, message: 'Progress entry deleted.' });
  } catch (error) {
    next(error);
  }
});

export default router;
