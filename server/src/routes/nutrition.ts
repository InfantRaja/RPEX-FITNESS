import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import NutritionLog from '../models/NutritionLog';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { calculatePersonalizedNutrition } from '../services/nutritionCalculator';
import { generatePersonalizedMealPlan } from '../services/mealPlanGenerator';
import { searchFoods, VERIFIED_FOOD_DATABASE } from '../services/foodDatabase';

const router = Router();
router.use(authenticate);

// Helper to get or create today's NutritionLog
async function getOrCreateTodayLog(userId: any) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let log = await NutritionLog.findOne({
    userId,
    date: { $gte: today, $lt: tomorrow },
  });

  if (!log) {
    log = await NutritionLog.create({
      userId,
      date: today,
      meals: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      waterIntake: 0,
    });
  }

  return log;
}

// GET /api/nutrition/calculator - Get calculated BMR, TDEE, and macro targets
router.get('/calculator', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) throw new AppError('User not found.', 404);

    const ob = user.onboarding || {};
    const calculation = calculatePersonalizedNutrition({
      weight: ob.weight,
      height: ob.height,
      age: ob.age,
      gender: ob.gender || 'male',
      activityLevel: ob.activityLevel || 'moderately_active',
      trainingDaysPerWeek: ob.trainingDaysPerWeek || 4,
      fitnessGoal: ob.fitnessGoal || 'general_fitness',
      fitnessExperience: ob.fitnessExperience || 'intermediate',
      mealsPerDay: ob.mealsPerDay || 4,
      targetWeight: ob.targetWeight,
    });

    // Update user profile with latest targets if missing or updated
    if (!ob.nutritionTargets || !ob.nutritionTargets.lastCalculatedAt) {
      await User.findByIdAndUpdate(req.user?._id, {
        $set: { 'onboarding.nutritionTargets': calculation },
      });
    }

    res.json({
      success: true,
      data: calculation,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/nutrition/recalculate - Recalculate targets with modified parameters
router.post('/recalculate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) throw new AppError('User not found.', 404);

    const updates = req.body;
    const currentOb = user.onboarding || {};

    const mergedProfile = {
      weight: updates.weight !== undefined ? Number(updates.weight) : currentOb.weight,
      height: updates.height !== undefined ? Number(updates.height) : currentOb.height,
      age: updates.age !== undefined ? Number(updates.age) : currentOb.age,
      gender: updates.gender || currentOb.gender || 'male',
      activityLevel: updates.activityLevel || currentOb.activityLevel || 'moderately_active',
      trainingDaysPerWeek: updates.trainingDaysPerWeek !== undefined ? Number(updates.trainingDaysPerWeek) : currentOb.trainingDaysPerWeek,
      fitnessGoal: updates.fitnessGoal || currentOb.fitnessGoal || 'general_fitness',
      fitnessExperience: updates.fitnessExperience || currentOb.fitnessExperience || 'intermediate',
      mealsPerDay: updates.mealsPerDay !== undefined ? Number(updates.mealsPerDay) : (currentOb.mealsPerDay || 4),
      targetWeight: updates.targetWeight !== undefined ? Number(updates.targetWeight) : currentOb.targetWeight,
      dietaryPreference: updates.dietaryPreference || currentOb.dietaryPreference || 'none',
      mealBudget: updates.mealBudget || currentOb.mealBudget || 'moderate',
      country: updates.country || currentOb.country || 'India',
    };

    const newTargets = calculatePersonalizedNutrition(mergedProfile);

    // Save updated onboarding and targets
    await User.findByIdAndUpdate(req.user?._id, {
      $set: {
        'onboarding.weight': mergedProfile.weight,
        'onboarding.height': mergedProfile.height,
        'onboarding.age': mergedProfile.age,
        'onboarding.gender': mergedProfile.gender,
        'onboarding.activityLevel': mergedProfile.activityLevel,
        'onboarding.trainingDaysPerWeek': mergedProfile.trainingDaysPerWeek,
        'onboarding.fitnessGoal': mergedProfile.fitnessGoal,
        'onboarding.fitnessExperience': mergedProfile.fitnessExperience,
        'onboarding.mealsPerDay': mergedProfile.mealsPerDay,
        'onboarding.targetWeight': mergedProfile.targetWeight,
        'onboarding.dietaryPreference': mergedProfile.dietaryPreference,
        'onboarding.mealBudget': mergedProfile.mealBudget,
        'onboarding.country': mergedProfile.country,
        'onboarding.nutritionTargets': newTargets,
      },
    });

    res.json({
      success: true,
      message: 'Nutrition targets recalculated and profile updated successfully.',
      data: newTargets,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/nutrition/meal-plan - Get today's personalized diet plan
router.get('/meal-plan', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) throw new AppError('User not found.', 404);

    const ob = user.onboarding || {};
    const targets = calculatePersonalizedNutrition({
      weight: ob.weight,
      height: ob.height,
      age: ob.age,
      gender: ob.gender,
      activityLevel: ob.activityLevel,
      trainingDaysPerWeek: ob.trainingDaysPerWeek,
      fitnessGoal: ob.fitnessGoal,
      fitnessExperience: ob.fitnessExperience,
      mealsPerDay: ob.mealsPerDay,
    });

    const mealPlan = generatePersonalizedMealPlan(targets, {
      dietaryPreference: ob.dietaryPreference,
      isBudgetFriendly: ob.mealBudget === 'budget' || (typeof ob.mealBudget === 'number' && ob.mealBudget < 5000),
      region: ob.country,
      allergies: ob.foodAllergies,
      goal: ob.fitnessGoal,
    });

    res.json({
      success: true,
      data: mealPlan,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/nutrition/meal-plan/generate - Generate custom meal plan with options
router.post('/meal-plan/generate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) throw new AppError('User not found.', 404);

    const { dietaryPreference, isBudgetFriendly, allergies, goal } = req.body;
    const ob = user.onboarding || {};

    const targets = calculatePersonalizedNutrition({
      weight: ob.weight,
      height: ob.height,
      age: ob.age,
      gender: ob.gender,
      activityLevel: ob.activityLevel,
      trainingDaysPerWeek: ob.trainingDaysPerWeek,
      fitnessGoal: goal || ob.fitnessGoal,
      fitnessExperience: ob.fitnessExperience,
      mealsPerDay: ob.mealsPerDay,
    });

    const mealPlan = generatePersonalizedMealPlan(targets, {
      dietaryPreference: dietaryPreference || ob.dietaryPreference,
      isBudgetFriendly: isBudgetFriendly !== undefined ? Boolean(isBudgetFriendly) : (ob.mealBudget === 'budget'),
      region: ob.country,
      allergies: allergies || ob.foodAllergies,
      goal: goal || ob.fitnessGoal,
    });

    res.json({
      success: true,
      data: mealPlan,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/nutrition/meal-plan/log-meal - 1-Click Log a generated meal into today's log
router.post('/meal-plan/log-meal', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { meal } = req.body;
    if (!meal || !meal.mealType || !meal.foods || !Array.isArray(meal.foods)) {
      throw new AppError('Invalid meal data provided.', 400);
    }

    const log = await getOrCreateTodayLog(req.user?._id);

    // Format meal entry
    const newMealEntry = {
      mealType: meal.mealType,
      foods: meal.foods.map((f: any) => ({
        name: f.name,
        servingSize: Number(f.servingSize) || 100,
        servingUnit: f.servingUnit || 'g',
        calories: Number(f.calories) || 0,
        protein: Number(f.protein) || 0,
        carbs: Number(f.carbs) || 0,
        fat: Number(f.fat) || 0,
      })),
      totalCalories: Number(meal.totalCalories) || meal.foods.reduce((s: number, f: any) => s + (Number(f.calories) || 0), 0),
      totalProtein: Number(meal.totalProtein) || meal.foods.reduce((s: number, f: any) => s + (Number(f.protein) || 0), 0),
      totalCarbs: Number(meal.totalCarbs) || meal.foods.reduce((s: number, f: any) => s + (Number(f.carbs) || 0), 0),
      totalFat: Number(meal.totalFat) || meal.foods.reduce((s: number, f: any) => s + (Number(f.fat) || 0), 0),
      notes: meal.name ? `Logged from plan: ${meal.name}` : undefined,
    };

    log.meals.push(newMealEntry);
    await log.save();

    res.json({
      success: true,
      message: `Logged ${meal.name || meal.mealType} to today's food tracker!`,
      data: log,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/nutrition/foods - Search verified food database
router.get('/foods', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q = '', query = '', category, dietPreference, dietaryPreference, budgetOnly, isAffordable } = req.query;
    const searchTerm = (q || query || '') as string;

    const foods = searchFoods(searchTerm, {
      category: category as string,
      dietPreference: (dietPreference || dietaryPreference) as string,
      isBudgetFriendly: budgetOnly === 'true' || isAffordable === 'true',
    });

    const normalized = foods.map(f => ({
      ...f,
      dietaryPreference: f.dietType?.[0] || 'vegetarian',
      isAffordable: f.isBudgetFriendly,
      commonMeasure: f.servingUnit,
    }));

    res.json({
      success: true,
      count: normalized.length,
      data: normalized,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/nutrition/water - Log water intake
router.post('/water', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { amount, action } = req.body; // amount in ml, action: 'add' | 'set' | 'reset'
    const log = await getOrCreateTodayLog(req.user?._id);

    if (action === 'set') {
      log.waterIntake = Math.max(0, Number(amount) || 0);
    } else if (action === 'reset') {
      log.waterIntake = 0;
    } else {
      // Default: add
      log.waterIntake = (log.waterIntake || 0) + (Number(amount) || 250);
    }

    await log.save();

    res.json({
      success: true,
      message: `Water intake updated: ${log.waterIntake} ml`,
      data: { waterIntake: log.waterIntake },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/nutrition/quick-log - Quick add food item to a meal in today's log
router.post('/quick-log', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { mealType, food } = req.body;
    if (!mealType || !food || !food.name) {
      throw new AppError('Meal type and food details are required.', 400);
    }

    const log = await getOrCreateTodayLog(req.user?._id);

    const foodItem = {
      name: food.name,
      servingSize: Number(food.servingSize) || 100,
      servingUnit: food.servingUnit || 'g',
      calories: Number(food.calories) || 0,
      protein: Number(food.protein) || 0,
      carbs: Number(food.carbs) || 0,
      fat: Number(food.fat) || 0,
    };

    // Find existing meal of same type today, or push new meal
    const existingMeal = log.meals.find(m => m.mealType === mealType);
    if (existingMeal) {
      existingMeal.foods.push(foodItem);
      existingMeal.totalCalories += foodItem.calories;
      existingMeal.totalProtein += foodItem.protein;
      existingMeal.totalCarbs += foodItem.carbs;
      existingMeal.totalFat += foodItem.fat;
    } else {
      log.meals.push({
        mealType,
        foods: [foodItem],
        totalCalories: foodItem.calories,
        totalProtein: foodItem.protein,
        totalCarbs: foodItem.carbs,
        totalFat: foodItem.fat,
      });
    }

    await log.save();

    res.json({
      success: true,
      message: `Added ${food.name} to ${mealType}!`,
      data: log,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/nutrition/meals/:mealIndex/item/:itemIndex - Remove an item from today's log
router.delete('/meals/:mealIndex/item/:itemIndex', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const mealIdx = parseInt(req.params.mealIndex);
    const itemIdx = parseInt(req.params.itemIndex);

    const log = await getOrCreateTodayLog(req.user?._id);
    if (!log.meals[mealIdx] || !log.meals[mealIdx].foods[itemIdx]) {
      throw new AppError('Meal item not found.', 404);
    }

    const removedFood = log.meals[mealIdx].foods[itemIdx];
    log.meals[mealIdx].foods.splice(itemIdx, 1);

    // If no foods left in that meal, remove the meal
    if (log.meals[mealIdx].foods.length === 0) {
      log.meals.splice(mealIdx, 1);
    } else {
      // Recalculate meal totals
      log.meals[mealIdx].totalCalories = log.meals[mealIdx].foods.reduce((s, f) => s + f.calories, 0);
      log.meals[mealIdx].totalProtein = log.meals[mealIdx].foods.reduce((s, f) => s + f.protein, 0);
      log.meals[mealIdx].totalCarbs = log.meals[mealIdx].foods.reduce((s, f) => s + f.carbs, 0);
      log.meals[mealIdx].totalFat = log.meals[mealIdx].foods.reduce((s, f) => s + f.fat, 0);
    }

    await log.save();

    res.json({
      success: true,
      message: `Removed ${removedFood.name}.`,
      data: log,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/nutrition/progress/trends - 7-day adherence trends
router.get('/progress/trends', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);
    const targets = calculatePersonalizedNutrition(user?.onboarding || {});

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const logs = await NutritionLog.find({
      userId,
      date: { $gte: sevenDaysAgo },
    }).sort({ date: 1 });

    const dateMap = new Map();
    logs.forEach(l => {
      const d = new Date(l.date).toISOString().split('T')[0];
      dateMap.set(d, l);
    });

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const log = dateMap.get(dateStr);

      days.push({
        date: dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: log ? log.totalCalories : 0,
        targetCalories: targets.targetCalories,
        protein: log ? log.totalProtein : 0,
        targetProtein: targets.proteinGrams,
        carbs: log ? log.totalCarbs : 0,
        fat: log ? log.totalFat : 0,
        waterIntake: log ? (log.waterIntake || 0) : 0,
        targetWater: targets.waterMl,
        adherencePct: log ? Math.min(100, Math.round((log.totalCalories / targets.targetCalories) * 100)) : 0,
      });
    }

    res.json({
      success: true,
      data: {
        targets,
        trends: days,
      },
    });
  } catch (error) {
    next(error);
  }
});

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
    const log = await getOrCreateTodayLog(req.user?._id);
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
