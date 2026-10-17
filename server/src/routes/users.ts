import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Workout from '../models/Workout';
import { AppError } from '../middleware/errorHandler';
import { calculatePersonalizedNutrition } from '../services/nutritionCalculator';

const router = Router();

// All routes require auth
router.use(authenticate);

// GET /api/users/profile (Current user)
router.get('/profile', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id)
      .populate('followers', 'name email avatar')
      .populate('following', 'name email avatar');
    if (!user) throw new AppError('User not found.', 404);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/discover (Find / search other athletes)
router.get('/discover', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id;
    const { q = '', limit = 20 } = req.query;

    const filter: Record<string, any> = {
      _id: { $ne: currentUserId },
    };

    if (q && typeof q === 'string' && q.trim()) {
      filter.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { email: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('name email avatar bio onboarding followers following createdAt')
      .limit(Number(limit))
      .lean();

    const formatted = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      bio: u.bio,
      onboarding: u.onboarding,
      followersCount: (u.followers || []).length,
      followingCount: (u.following || []).length,
      isFollowing: (u.followers || []).some((f: any) => f.toString() === currentUserId?.toString()),
      createdAt: u.createdAt,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/profile/:id (View another user's public profile)
router.get('/profile/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id;
    const targetUserId = req.params.id;

    const user = await User.findById(targetUserId)
      .select('name email avatar bio onboarding followers following createdAt')
      .lean();

    if (!user) throw new AppError('Athlete profile not found.', 404);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [recentWorkouts, totalWorkouts, workoutsLast30Days, totalMinutesAgg, streakWorkouts] = await Promise.all([
      Workout.find({ userId: targetUserId }).sort({ date: -1 }).limit(10).lean(),
      Workout.countDocuments({ userId: targetUserId }),
      Workout.countDocuments({ userId: targetUserId, date: { $gte: thirtyDaysAgo } }),
      Workout.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, totalMinutes: { $sum: '$duration' } } },
      ]),
      Workout.find({ userId: targetUserId }).sort({ date: -1 }).select('date').limit(60).lean(),
    ]);

    const totalMinutes = totalMinutesAgg[0]?.totalMinutes || 0;
    const isFollowing = (user.followers || []).some((f: any) => f.toString() === currentUserId?.toString());

    // Calculate current streak
    let streakCurrent = 0;
    if (streakWorkouts.length > 0) {
      const workoutDates = new Set(
        streakWorkouts.map(w => {
          const d = new Date(w.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      );
      let curr = new Date();
      curr.setHours(0, 0, 0, 0);
      if (!workoutDates.has(curr.getTime())) {
        curr.setDate(curr.getDate() - 1);
      }
      while (workoutDates.has(curr.getTime())) {
        streakCurrent++;
        curr.setDate(curr.getDate() - 1);
      }
    }

    const level = Math.max(1, Math.floor(totalWorkouts / 5) + 1);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        onboarding: user.onboarding,
        gamification: {
          level,
          streakCurrent,
          badges: totalWorkouts >= 10 ? ['Dedicated Athlete', 'Consistency Master'] : ['Active Athlete'],
        },
        followersCount: (user.followers || []).length,
        followingCount: (user.following || []).length,
        isFollowing,
        isSelf: currentUserId?.toString() === targetUserId,
        createdAt: user.createdAt,
        recentWorkouts,
        stats: {
          totalWorkouts,
          workoutsLast30Days,
          totalMinutes,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/profile
router.put('/profile', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const allowedFields = ['name', 'avatar', 'bio'];
    const updates: Record<string, any> = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.body.height !== undefined) updates['onboarding.height'] = req.body.height;
    if (req.body.weight !== undefined) updates['onboarding.weight'] = req.body.weight;
    if (req.body.unitSystem !== undefined) updates['onboarding.unitSystem'] = req.body.unitSystem;
    if (req.body.age !== undefined) updates['onboarding.age'] = req.body.age;
    if (req.body.fitnessGoal !== undefined) updates['onboarding.fitnessGoal'] = req.body.fitnessGoal;
    if (req.body.fitnessExperience !== undefined) updates['onboarding.fitnessExperience'] = req.body.fitnessExperience;

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) throw new AppError('User not found.', 404);
    res.json({ success: true, message: 'Profile updated.', user });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/:id/follow
router.post('/:id/follow', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id;
    const targetUserId = req.params.id;

    if (currentUserId?.toString() === targetUserId) {
      throw new AppError('You cannot follow yourself.', 400);
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) throw new AppError('User not found.', 404);

    await Promise.all([
      User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } }),
      User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } }),
    ]);

    const updatedTarget = await User.findById(targetUserId).select('followers');

    res.json({
      success: true,
      message: `You are now following ${targetUser.name}`,
      isFollowing: true,
      followersCount: (updatedTarget?.followers || []).length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/:id/unfollow
router.post('/:id/unfollow', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id;
    const targetUserId = req.params.id;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) throw new AppError('User not found.', 404);

    await Promise.all([
      User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } }),
      User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } }),
    ]);

    const updatedTarget = await User.findById(targetUserId).select('followers');

    res.json({
      success: true,
      message: `Unfollowed ${targetUser.name}`,
      isFollowing: false,
      followersCount: (updatedTarget?.followers || []).length,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id/follow
router.delete('/:id/follow', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id;
    const targetUserId = req.params.id;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) throw new AppError('User not found.', 404);

    await Promise.all([
      User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } }),
      User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } }),
    ]);

    const updatedTarget = await User.findById(targetUserId).select('followers');

    res.json({
      success: true,
      message: `Unfollowed ${targetUser.name}`,
      isFollowing: false,
      followersCount: (updatedTarget?.followers || []).length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id/followers
router.get('/:id/followers', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id;
    const user = await User.findById(req.params.id)
      .populate('followers', 'name email avatar onboarding followers following createdAt')
      .lean();

    if (!user) throw new AppError('User not found.', 404);

    const followers = (user.followers || []).map((f: any) => ({
      _id: f._id,
      name: f.name,
      email: f.email,
      avatar: f.avatar,
      onboarding: f.onboarding,
      followersCount: (f.followers || []).length,
      followingCount: (f.following || []).length,
      isFollowing: (f.followers || []).some((id: any) => id.toString() === currentUserId?.toString()),
      isSelf: f._id.toString() === currentUserId?.toString(),
    }));

    res.json({ success: true, data: followers });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id/following
router.get('/:id/following', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id;
    const user = await User.findById(req.params.id)
      .populate('following', 'name email avatar onboarding followers following createdAt')
      .lean();

    if (!user) throw new AppError('User not found.', 404);

    const following = (user.following || []).map((f: any) => ({
      _id: f._id,
      name: f.name,
      email: f.email,
      avatar: f.avatar,
      onboarding: f.onboarding,
      followersCount: (f.followers || []).length,
      followingCount: (f.following || []).length,
      isFollowing: (f.followers || []).some((id: any) => id.toString() === currentUserId?.toString()),
      isSelf: f._id.toString() === currentUserId?.toString(),
    }));

    res.json({ success: true, data: following });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/onboarding
router.put('/onboarding', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const onboardingData = req.body;
    let targets;
    try {
      targets = calculatePersonalizedNutrition(onboardingData);
    } catch (calcErr) {
      // ignore
    }

    const user = await User.findById(req.user?._id);
    if (!user) throw new AppError('User not found.', 404);

    const existingOnboarding = user.onboarding
      ? (typeof (user.onboarding as any).toObject === 'function' ? (user.onboarding as any).toObject() : user.onboarding)
      : {};

    const mergedOnboarding: any = {
      ...existingOnboarding,
      ...onboardingData,
      completed: true,
    };

    if (targets) {
      mergedOnboarding.nutritionTargets = targets;
    }

    user.onboarding = mergedOnboarding;
    user.markModified('onboarding');
    await user.save();

    res.json({ success: true, message: 'Onboarding completed.', user });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/change-password
router.put('/change-password', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new AppError('Current and new passwords are required.', 400);
    }
    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters.', 400);
    }

    const user = await User.findById(req.user?._id).select('+password');
    if (!user) throw new AppError('User not found.', 404);
    if (!user.password) throw new AppError('Cannot change password for Google accounts.', 400);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new AppError('Current password is incorrect.', 400);

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/account
router.delete('/account', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndDelete(req.user?._id);
    if (!user) throw new AppError('User not found.', 404);
    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
