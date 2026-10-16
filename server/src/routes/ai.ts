import { Router, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';
import AIConversation from '../models/AIConversation';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { generateAIResponse, validateGeminiApiKey } from '../services/gemini';

const router = Router();
router.use(authenticate);

function updateEnvKey(key: string, val: string) {
  try {
    const cwdEnv = path.resolve(process.cwd(), '.env');
    const relEnv = path.resolve(__dirname, '../../.env');
    const envPath = fs.existsSync(cwdEnv) ? cwdEnv : (fs.existsSync(relEnv) ? relEnv : null);
    if (envPath) {
      let content = fs.readFileSync(envPath, 'utf8');
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${val}`);
      } else {
        content += `\n${key}=${val}`;
      }
      fs.writeFileSync(envPath, content, 'utf8');
    }
  } catch (err) {
    console.error('Error writing .env file:', err);
  }
}

// GET /api/ai/key-status - Check if custom Gemini API key is configured
router.get('/key-status', async (_req: AuthRequest, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isConfigured = !!apiKey && apiKey !== 'placeholder_gemini_api_key' && apiKey.trim().length > 15;
  res.json({
    success: true,
    data: {
      isConfigured,
      maskedKey: isConfigured ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : null,
    },
  });
});

// POST /api/ai/config-key - Save and test Gemini API key
router.post('/config-key', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || apiKey.trim() === '' || apiKey === 'reset') {
      process.env.GEMINI_API_KEY = 'placeholder_gemini_api_key';
      updateEnvKey('GEMINI_API_KEY', 'placeholder_gemini_api_key');
      return res.json({
        success: true,
        message: 'Reset to built-in smart AI coach engine.',
        data: { isConfigured: false },
      });
    }

    const trimmedKey = apiKey.trim();
    const isValid = await validateGeminiApiKey(trimmedKey);

    if (!isValid) {
      throw new AppError('The provided Gemini API key appears invalid or expired. Please check your key from Google AI Studio.', 400);
    }

    process.env.GEMINI_API_KEY = trimmedKey;
    updateEnvKey('GEMINI_API_KEY', trimmedKey);

    res.json({
      success: true,
      message: 'Gemini API key verified and saved successfully! Full Gemini 1.5 Flash capabilities are now active.',
      data: { isConfigured: true },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/conversations
router.get('/conversations', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const conversations = await AIConversation.find({ userId: req.user?._id })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select('title topic updatedAt messages');

    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/conversations/:id
router.get('/conversations/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const conversation = await AIConversation.findOne({ _id: req.params.id, userId: req.user?._id });
    if (!conversation) throw new AppError('Conversation not found.', 404);
    res.json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/chat - Send a message (creates or continues conversation)
router.post('/chat', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { message, conversationId, topic = 'general', language = 'en' } = req.body;

    if (!message || message.trim().length === 0) {
      throw new AppError('Message is required.', 400);
    }

    // Get user profile for personalized context
    const user = await User.findById(req.user?._id);
    if (!user) throw new AppError('User not found.', 404);

    let conversation = conversationId
      ? await AIConversation.findOne({ _id: conversationId, userId: req.user?._id })
      : null;

    if (!conversation) {
      conversation = new AIConversation({
        userId: req.user?._id,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        topic,
        messages: [],
      });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      language,
    });

    // Build context for AI
    const userContext = {
      name: user.name,
      fitnessGoal: user.onboarding.fitnessGoal,
      experience: user.onboarding.fitnessExperience,
      dietaryPreference: user.onboarding.dietaryPreference,
      weight: user.onboarding.weight,
      height: user.onboarding.height,
      workoutLocation: user.onboarding.workoutLocation,
      equipment: user.onboarding.availableEquipment,
    };

    // Get recent chat history (last 10 messages)
    const history = conversation.messages.slice(-10);

    // Generate AI response
    const aiResponse = await generateAIResponse(message, history, userContext, language);

    // Add AI response
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      language,
    });

    await conversation.save();

    res.json({
      success: true,
      data: {
        conversationId: conversation._id,
        message: aiResponse,
        conversation,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/ai/conversations/:id
router.delete('/conversations/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const conversation = await AIConversation.findOneAndDelete({ _id: req.params.id, userId: req.user?._id });
    if (!conversation) throw new AppError('Conversation not found.', 404);
    res.json({ success: true, message: 'Conversation deleted.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/recommend/workout
router.post('/recommend/workout', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) throw new AppError('User not found.', 404);

    const prompt = `Generate a personalized workout plan for ${user.name}.
    Goal: ${user.onboarding.fitnessGoal || 'general fitness'}
    Experience: ${user.onboarding.fitnessExperience || 'beginner'}
    Location: ${user.onboarding.workoutLocation || 'gym'}
    Equipment: ${user.onboarding.availableEquipment?.join(', ') || 'basic gym equipment'}
    Days per week: ${user.onboarding.trainingDaysPerWeek || 3}
    
    Provide a structured weekly workout plan with exercises, sets, reps, and rest times. Format as JSON.`;

    const response = await generateAIResponse(prompt, [], {}, 'en');
    res.json({ success: true, data: { recommendation: response } });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/recommend/nutrition
router.post('/recommend/nutrition', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) throw new AppError('User not found.', 404);

    const prompt = `Generate a personalized nutrition plan for ${user.name}.
    Goal: ${user.onboarding.fitnessGoal || 'general fitness'}
    Weight: ${user.onboarding.weight || 'unknown'} kg
    Dietary preference: ${user.onboarding.dietaryPreference || 'none'}
    Allergies: ${user.onboarding.foodAllergies?.join(', ') || 'none'}
    Budget: ${user.onboarding.mealBudget ? `$${user.onboarding.mealBudget}/month` : 'flexible'}
    
    Provide daily macro targets, meal timing, and sample meal ideas. Format the response clearly.`;

    const response = await generateAIResponse(prompt, [], {}, 'en');
    res.json({ success: true, data: { recommendation: response } });
  } catch (error) {
    next(error);
  }
});

export default router;
