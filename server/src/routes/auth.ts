import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import crypto from 'crypto';
import User from '../models/User';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { sendPasswordResetEmail } from '../services/email';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required.', 400);
    }
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters.', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email already exists.', 409);
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      isEmailVerified: false,
    });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        onboarding: user.onboarding,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required.', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.password) {
      throw new AppError('This account uses Google sign-in. Please sign in with Google.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        onboarding: user.onboarding,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) throw new AppError('User not found.', 404);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) throw new AppError('Email is required.', 400);

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordResetToken +passwordResetExpires');
    if (!user) {
      // Don't reveal if email exists
      res.json({ success: true, message: 'If an account exists, a reset email has been sent.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (emailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw new AppError('Failed to send email. Please check email configuration.', 500);
    }

    res.json({ success: true, message: 'If an account exists, a reset email has been sent.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) throw new AppError('Token and password are required.', 400);
    if (password.length < 8) throw new AppError('Password must be at least 8 characters.', 400);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) throw new AppError('Invalid or expired reset token.', 400);

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const jwtToken = generateToken(user._id.toString());
    res.json({ success: true, message: 'Password reset successfully.', token: jwtToken });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/google
router.get('/google', (req: Request, res: Response, next: NextFunction) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'placeholder_google_client_id') {
    return res.redirect(`${clientUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// GET /api/auth/google/callback
router.get(
  '/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'placeholder_google_client_id') {
      return res.redirect(`${clientUrl}/login?error=google_not_configured`);
    }
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${clientUrl}/login?error=google_failed`,
    })(req, res, next);
  },
  (req: any, res: Response) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const token = generateToken(req.user._id.toString());
    const isNew = !req.user.onboarding || !req.user.onboarding.completed;
    res.redirect(`${clientUrl}/auth/callback?token=${token}${isNew ? '&isNew=true' : ''}`);
  }
);

// POST /api/auth/logout
router.post('/logout', authenticate, (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;
