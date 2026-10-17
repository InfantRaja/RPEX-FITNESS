/**
 * RPEX Fitness - Precision Nutrition Science & Calorie Calculator Engine
 * Implements Mifflin-St Jeor formula, TDEE, goal adjustments, and macronutrient distribution.
 */

export interface UserNutritionProfile {
  weight?: number; // kg
  height?: number; // cm
  age?: number;
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  trainingDaysPerWeek?: number;
  fitnessGoal?: 'muscle_building' | 'fat_loss' | 'strength' | 'weight_gain' | 'maintenance' | 'general_fitness' | 'body_recomposition';
  fitnessExperience?: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  mealsPerDay?: number;
  targetWeight?: number;
}

export interface CalculatedNutritionTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  maintenanceCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterMl: number;
  proteinPerMeal: number;
  formulaExplanation: string;
  goalAdjustmentLabel: string;
  macrosRatio: {
    proteinPct: number;
    carbsPct: number;
    fatPct: number;
  };
  caloriesFrom: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export function calculatePersonalizedNutrition(profile: UserNutritionProfile): CalculatedNutritionTargets {
  const weight = profile.weight && profile.weight > 20 ? profile.weight : 70;
  const height = profile.height && profile.height > 50 ? profile.height : 175;
  const age = profile.age && profile.age >= 12 ? profile.age : 25;
  const gender = profile.gender || 'male';
  const activity = profile.activityLevel || 'moderately_active';
  const trainingDays = profile.trainingDaysPerWeek || 4;
  const goal = profile.fitnessGoal || 'general_fitness';
  const mealsCount = profile.mealsPerDay || 4;

  // 1. Mifflin-St Jeor BMR Formula
  let bmr: number;
  if (gender === 'female') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    // Neutral average
    bmr = 10 * weight + 6.25 * height - 5 * age - 78;
  }
  bmr = Math.round(bmr);

  // 2. Physical Activity Multiplier (PAL)
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2, // Desk job, little-to-no intentional exercise
    lightly_active: 1.375, // Light exercise or 1-3 training days/week
    moderately_active: 1.55, // Moderate exercise / gym 3-5 days/week
    very_active: 1.725, // Hard exercise 6-7 days/week or physical job
    extra_active: 1.9, // Hard training 2x/day or rigorous manual labor
  };

  const pal = activityMultipliers[activity] || (trainingDays >= 5 ? 1.65 : 1.5);
  const tdee = Math.round(bmr * pal);
  const maintenanceCalories = tdee;

  // 3. Goal-Specific Adjustments & Macronutrients
  let targetCalories = tdee;
  let proteinPerKg = 1.6;
  let fatPctOfCalories = 0.25;
  let goalLabel = 'Weight Maintenance';

  switch (goal) {
    case 'muscle_building':
    case 'weight_gain':
      targetCalories = tdee + 350; // Lean surplus (~+10-15%)
      proteinPerKg = 2.0; // Optimal for muscle protein synthesis
      fatPctOfCalories = 0.25;
      goalLabel = 'Lean Surplus (+350 kcal for Hypertrophy)';
      break;

    case 'fat_loss':
      targetCalories = Math.max(gender === 'female' ? 1300 : 1500, tdee - 450); // Safe deficit (~0.45kg fat loss/week)
      proteinPerKg = 2.2; // Higher protein in a deficit to preserve lean mass & maximize satiety
      fatPctOfCalories = 0.22;
      goalLabel = 'Moderate Deficit (-450 kcal for Fat Loss)';
      break;

    case 'strength':
      targetCalories = tdee + 250; // Performance energy surplus
      proteinPerKg = 1.9;
      fatPctOfCalories = 0.25;
      goalLabel = 'Strength Fuel (+250 kcal for Peak Power & Recovery)';
      break;

    case 'body_recomposition':
      targetCalories = tdee - 100; // Near-maintenance slight deficit
      proteinPerKg = 2.2; // High protein needed for simultaneous hypertrophy & fat loss
      fatPctOfCalories = 0.24;
      goalLabel = 'Body Recomposition (-100 kcal with High Protein)';
      break;

    case 'general_fitness':
    case 'maintenance':
    default:
      targetCalories = tdee;
      proteinPerKg = 1.6;
      fatPctOfCalories = 0.25;
      goalLabel = 'Maintenance Baseline (Energy Balance)';
      break;
  }

  // Calculate grams:
  // Protein: 4 kcal / gram
  const proteinGrams = Math.round(weight * proteinPerKg);
  const proteinCals = proteinGrams * 4;

  // Fat: 9 kcal / gram
  const fatCals = Math.round(targetCalories * fatPctOfCalories);
  const fatGrams = Math.round(fatCals / 9);

  // Carbs: 4 kcal / gram (Remaining energy)
  const remainingCals = Math.max(0, targetCalories - (proteinCals + fatCals));
  const carbsGrams = Math.round(remainingCals / 4);

  // Recalculate true targetCalories after integer rounding of macros
  const finalCalories = (proteinGrams * 4) + (carbsGrams * 4) + (fatGrams * 9);

  // Water intake in ml (35ml/kg baseline + 500ml for active training)
  const waterMl = Math.round(weight * 35 + (trainingDays >= 3 ? 600 : 300));

  // Protein distribution per meal
  const proteinPerMeal = Math.round(proteinGrams / Math.max(2, mealsCount));

  // Ratios
  const proteinPct = Math.round((proteinCals / finalCalories) * 100);
  const fatPct = Math.round((fatCals / finalCalories) * 100);
  const carbsPct = 100 - (proteinPct + fatPct);

  const formulaExplanation = `BMR of ${bmr} kcal calculated via Mifflin-St Jeor formula (${gender}, ${age}y, ${height}cm, ${weight}kg). Total Daily Energy Expenditure (TDEE) estimated at ${tdee} kcal (${activity.replace(/_/g, ' ')}, ${trainingDays} workouts/wk). ${goalLabel} yields a recommended daily intake of ${finalCalories} kcal (${proteinGrams}g Protein, ${carbsGrams}g Carbs, ${fatGrams}g Fat).`;

  return {
    bmr,
    tdee,
    targetCalories: finalCalories,
    maintenanceCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    waterMl,
    proteinPerMeal,
    formulaExplanation,
    goalAdjustmentLabel: goalLabel,
    macrosRatio: {
      proteinPct,
      carbsPct,
      fatPct,
    },
    caloriesFrom: {
      protein: proteinCals,
      carbs: carbsGrams * 4,
      fat: fatGrams * 9,
    },
  };
}
