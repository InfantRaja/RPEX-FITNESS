/**
 * RPEX Fitness - Personalized Daily Meal Plan Generator
 * Creates realistic, balanced meal plans tailored to user targets, dietary preferences, budget, and region.
 */

import { CalculatedNutritionTargets } from './nutritionCalculator';

export interface GeneratedMealItem {
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

export interface GeneratedMeal {
  mealType: string;
  name: string;
  suggestedTime: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  foods: GeneratedMealItem[];
}

export interface GeneratedDietPlan {
  dailyTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  totalPlanned: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  dietaryPreference: string;
  meals: GeneratedMeal[];
  tips: string[];
}

export function generatePersonalizedMealPlan(
  targets: CalculatedNutritionTargets,
  options: {
    dietaryPreference?: string;
    isBudgetFriendly?: boolean;
    region?: string;
    allergies?: string[];
    goal?: string;
  }
): GeneratedDietPlan {
  const pref = options.dietaryPreference || 'none';
  const isVeg = pref === 'vegetarian' || pref === 'vegan';
  const isVegan = pref === 'vegan';
  const isEggetarian = pref === 'eggetarian';
  const isBudget = Boolean(options.isBudgetFriendly);
  const goal = options.goal || 'general_fitness';

  const { targetCalories, proteinGrams, carbsGrams, fatGrams } = targets;

  // Scale factors based on target calories vs standard baseline (2200 kcal)
  const scale = Math.max(0.65, Math.min(1.6, targetCalories / 2200));

  const meals: GeneratedMeal[] = [];

  // ================= 1. BREAKFAST (8:00 AM) =================
  const breakfastFoods: GeneratedMealItem[] = [];
  if (isVegan) {
    breakfastFoods.push(
      { name: 'Rolled Oats Porridge with Soy Milk', servingSize: Math.round(60 * scale), servingUnit: 'g oats', calories: Math.round(230 * scale), protein: Math.round(9 * scale), carbs: Math.round(40 * scale), fat: Math.round(4 * scale) },
      { name: 'Plant Protein Powder / Chia Seeds', servingSize: 30, servingUnit: 'g', calories: 130, protein: 22, carbs: 4, fat: 2.5 },
      { name: 'Fresh Banana (Sliced)', servingSize: 1, servingUnit: 'medium (118g)', calories: 105, protein: 1.3, carbs: 27, fat: 0.3 }
    );
  } else if (isVeg) {
    breakfastFoods.push(
      { name: 'Steamed Idli or Oats Upma', servingSize: Math.round(3 * Math.max(1, scale)), servingUnit: 'pieces', calories: Math.round(210 * scale), protein: Math.round(7 * scale), carbs: Math.round(42 * scale), fat: Math.round(2 * scale) },
      { name: 'Fresh Paneer / Greek Yogurt', servingSize: Math.round(80 * scale), servingUnit: 'g', calories: Math.round(160 * scale), protein: Math.round(16 * scale), carbs: Math.round(4 * scale), fat: Math.round(8 * scale) },
      { name: 'Toor Dal Sambar with Vegetables', servingSize: 150, servingUnit: 'ml (1 bowl)', calories: 95, protein: 4.5, carbs: 14, fat: 2 }
    );
  } else if (isEggetarian) {
    breakfastFoods.push(
      { name: 'Whole Boiled Eggs + Egg Whites', servingSize: 4, servingUnit: '2 whole + 2 whites', calories: 175, protein: 20, carbs: 1.2, fat: 9.8 },
      { name: 'Whole Wheat Toast or Roti', servingSize: 2, servingUnit: 'slices/rotis', calories: 160, protein: 5.5, carbs: 32, fat: 1.5 },
      { name: 'Apple or Fresh Fruit', servingSize: 1, servingUnit: 'medium (150g)', calories: 80, protein: 0.5, carbs: 21, fat: 0.2 }
    );
  } else {
    // Non-vegetarian
    breakfastFoods.push(
      { name: 'Masala Scrambled Eggs (3 Eggs + 2 Whites)', servingSize: 5, servingUnit: 'eggs', calories: 245, protein: 27, carbs: 3, fat: 14 },
      { name: 'Rolled Oats or Whole Wheat Toast', servingSize: Math.round(50 * scale), servingUnit: 'g', calories: Math.round(180 * scale), protein: Math.round(6 * scale), carbs: Math.round(32 * scale), fat: Math.round(3 * scale) },
      { name: 'Fresh Black Coffee or Green Tea', servingSize: 200, servingUnit: 'ml', calories: 5, protein: 0, carbs: 1, fat: 0 }
    );
  }

  meals.push({
    mealType: 'breakfast',
    name: 'Power Breakfast',
    suggestedTime: '08:00 AM',
    totalCalories: breakfastFoods.reduce((s, f) => s + f.calories, 0),
    totalProtein: breakfastFoods.reduce((s, f) => s + f.protein, 0),
    totalCarbs: breakfastFoods.reduce((s, f) => s + f.carbs, 0),
    totalFat: breakfastFoods.reduce((s, f) => s + f.fat, 0),
    foods: breakfastFoods,
  });

  // ================= 2. MID-MORNING SNACK (11:00 AM) =================
  const snackFoods: GeneratedMealItem[] = [];
  if (isBudget) {
    snackFoods.push(
      { name: 'Roasted Chana (Chickpeas) + Peanuts', servingSize: 40, servingUnit: 'g', calories: 170, protein: 8.5, carbs: 21, fat: 6.5 },
      { name: 'Fresh Curd / Buttermilk', servingSize: 200, servingUnit: 'ml', calories: 80, protein: 5, carbs: 8, fat: 3.5 }
    );
  } else {
    snackFoods.push(
      { name: 'Raw Almonds & Walnuts', servingSize: 25, servingUnit: 'g', calories: 155, protein: 5, carbs: 5, fat: 13.5 },
      { name: isVegan ? 'Soy Yogurt' : 'Greek Yogurt with Blueberries', servingSize: 120, servingUnit: 'g', calories: 100, protein: 12, carbs: 9, fat: 1.5 }
    );
  }

  meals.push({
    mealType: 'snack',
    name: 'Mid-Morning Fuel',
    suggestedTime: '11:00 AM',
    totalCalories: snackFoods.reduce((s, f) => s + f.calories, 0),
    totalProtein: snackFoods.reduce((s, f) => s + f.protein, 0),
    totalCarbs: snackFoods.reduce((s, f) => s + f.carbs, 0),
    totalFat: snackFoods.reduce((s, f) => s + f.fat, 0),
    foods: snackFoods,
  });

  // ================= 3. LUNCH (01:30 PM) =================
  const lunchFoods: GeneratedMealItem[] = [];
  if (isVegan) {
    lunchFoods.push(
      { name: 'Nutrela Soy Chunks Curry', servingSize: Math.round(55 * scale), servingUnit: 'g (raw)', calories: Math.round(190 * scale), protein: Math.round(28 * scale), carbs: Math.round(18 * scale), fat: Math.round(1 * scale) },
      { name: 'Cooked Basmati / Brown Rice', servingSize: Math.round(160 * scale), servingUnit: 'g', calories: Math.round(210 * scale), protein: Math.round(4.5 * scale), carbs: Math.round(46 * scale), fat: Math.round(0.6 * scale) },
      { name: 'Cucumber & Tomato Kachumber Salad', servingSize: 150, servingUnit: 'g', calories: 35, protein: 1.5, carbs: 7, fat: 0.3 }
    );
  } else if (isVeg || isEggetarian) {
    lunchFoods.push(
      { name: isBudget ? 'Soya Chunks & Dal Curry' : 'Low-Fat Paneer & Moong Dal', servingSize: Math.round(120 * scale), servingUnit: 'g', calories: Math.round(220 * scale), protein: Math.round(24 * scale), carbs: Math.round(18 * scale), fat: Math.round(6 * scale) },
      { name: 'Whole Wheat Roti (2) or Rice', servingSize: Math.round(150 * scale), servingUnit: 'g', calories: Math.round(200 * scale), protein: Math.round(5 * scale), carbs: Math.round(42 * scale), fat: Math.round(1.5 * scale) },
      { name: 'Homemade Fresh Curd / Dahi', servingSize: 150, servingUnit: 'g', calories: 98, protein: 5.3, carbs: 7, fat: 4.8 },
      { name: 'Mixed Green Salad with Lemon', servingSize: 100, servingUnit: 'g', calories: 25, protein: 1, carbs: 5, fat: 0.2 }
    );
  } else {
    // Non-veg
    lunchFoods.push(
      { name: 'Tandoori / Grilled Chicken Breast', servingSize: Math.round(150 * scale), servingUnit: 'g', calories: Math.round(245 * scale), protein: Math.round(46 * scale), carbs: 0, fat: Math.round(5.5 * scale) },
      { name: 'Steamed Rice or 2 Rotis', servingSize: Math.round(150 * scale), servingUnit: 'g', calories: Math.round(195 * scale), protein: Math.round(4.2 * scale), carbs: Math.round(43 * scale), fat: Math.round(0.6 * scale) },
      { name: 'Yellow Dal (Lentils Soup)', servingSize: 120, servingUnit: 'g', calories: 120, protein: 7, carbs: 19, fat: 2 },
      { name: 'Cucumber & Onion Salad', servingSize: 100, servingUnit: 'g', calories: 25, protein: 1, carbs: 5, fat: 0.2 }
    );
  }

  meals.push({
    mealType: 'lunch',
    name: 'Anabolic Lunch',
    suggestedTime: '01:30 PM',
    totalCalories: lunchFoods.reduce((s, f) => s + f.calories, 0),
    totalProtein: lunchFoods.reduce((s, f) => s + f.protein, 0),
    totalCarbs: lunchFoods.reduce((s, f) => s + f.carbs, 0),
    totalFat: lunchFoods.reduce((s, f) => s + f.fat, 0),
    foods: lunchFoods,
  });

  // ================= 4. PRE-WORKOUT (04:30 PM) =================
  const preWorkoutFoods: GeneratedMealItem[] = [
    { name: 'Banana + Peanut Butter on Rice Cake/Toast', servingSize: 1, servingUnit: 'serving', calories: 185, protein: 5.5, carbs: 32, fat: 5 },
    { name: 'Black Coffee (Pre-workout Caffeine)', servingSize: 150, servingUnit: 'ml', calories: 4, protein: 0.3, carbs: 0.8, fat: 0, notes: 'Drink 30-45 mins before training' },
  ];

  meals.push({
    mealType: 'pre_workout',
    name: 'Pre-Workout Ignition',
    suggestedTime: '04:30 PM',
    totalCalories: preWorkoutFoods.reduce((s, f) => s + f.calories, 0),
    totalProtein: preWorkoutFoods.reduce((s, f) => s + f.protein, 0),
    totalCarbs: preWorkoutFoods.reduce((s, f) => s + f.carbs, 0),
    totalFat: preWorkoutFoods.reduce((s, f) => s + f.fat, 0),
    foods: preWorkoutFoods,
  });

  // ================= 5. POST-WORKOUT (06:45 PM) =================
  const postWorkoutFoods: GeneratedMealItem[] = [];
  if (isBudget) {
    postWorkoutFoods.push(
      { name: 'Boiled Egg Whites (4-5) or Soya Shake', servingSize: 150, servingUnit: 'g', calories: 120, protein: 22, carbs: 4, fat: 0.8 },
      { name: 'Dextrose / Banana / Electrolyte Water', servingSize: 1, servingUnit: 'portion', calories: 105, protein: 1.2, carbs: 26, fat: 0.2 }
    );
  } else {
    postWorkoutFoods.push(
      { name: isVegan ? 'Plant Protein Shake' : 'Whey Protein Isolate Shake', servingSize: 32, servingUnit: '1 scoop with water', calories: 125, protein: 26, carbs: 2, fat: 1 },
      { name: 'Fast-Digesting Fruit (Banana / Apple)', servingSize: 1, servingUnit: 'medium', calories: 100, protein: 1, carbs: 25, fat: 0.2 }
    );
  }

  meals.push({
    mealType: 'post_workout',
    name: 'Post-Workout Recovery',
    suggestedTime: '06:45 PM',
    totalCalories: postWorkoutFoods.reduce((s, f) => s + f.calories, 0),
    totalProtein: postWorkoutFoods.reduce((s, f) => s + f.protein, 0),
    totalCarbs: postWorkoutFoods.reduce((s, f) => s + f.carbs, 0),
    totalFat: postWorkoutFoods.reduce((s, f) => s + f.fat, 0),
    foods: postWorkoutFoods,
  });

  // ================= 6. DINNER (08:30 PM) =================
  const dinnerFoods: GeneratedMealItem[] = [];
  if (isVegan) {
    dinnerFoods.push(
      { name: 'Tofu & Mixed Veggie Stir-Fry', servingSize: Math.round(150 * scale), servingUnit: 'g', calories: Math.round(195 * scale), protein: Math.round(18 * scale), carbs: Math.round(12 * scale), fat: Math.round(9 * scale) },
      { name: 'Boiled Chickpeas / Dal Tadka', servingSize: Math.round(120 * scale), servingUnit: 'g', calories: Math.round(180 * scale), protein: Math.round(10 * scale), carbs: Math.round(28 * scale), fat: Math.round(3 * scale) },
      { name: 'Whole Wheat Roti (2)', servingSize: 2, servingUnit: 'rotis (65g)', calories: 160, protein: 5.5, carbs: 32, fat: 1.2 }
    );
  } else if (isVeg || isEggetarian) {
    dinnerFoods.push(
      { name: isEggetarian ? 'Egg Bhurji (Scrambled with Veggies)' : 'Palak Paneer / Paneer Tikka', servingSize: Math.round(140 * scale), servingUnit: 'g', calories: Math.round(230 * scale), protein: Math.round(22 * scale), carbs: Math.round(8 * scale), fat: Math.round(13 * scale) },
      { name: 'Whole Wheat Roti (2) or Brown Rice', servingSize: Math.round(100 * scale), servingUnit: 'g', calories: Math.round(160 * scale), protein: Math.round(5.5 * scale), carbs: Math.round(32 * scale), fat: Math.round(1.2 * scale) },
      { name: 'Steamed Broccoli & Carrot Sabzi', servingSize: 120, servingUnit: 'g', calories: 45, protein: 3, carbs: 8, fat: 0.5 }
    );
  } else {
    dinnerFoods.push(
      { name: 'Grilled Fish / Chicken Breast / Lean Mince', servingSize: Math.round(140 * scale), servingUnit: 'g', calories: Math.round(225 * scale), protein: Math.round(38 * scale), carbs: 0, fat: Math.round(6 * scale) },
      { name: 'Whole Wheat Roti (2) or Sweet Potato', servingSize: Math.round(100 * scale), servingUnit: 'g', calories: Math.round(150 * scale), protein: Math.round(4.5 * scale), carbs: Math.round(31 * scale), fat: Math.round(1 * scale) },
      { name: 'Steamed Green Vegetables & Palak', servingSize: 150, servingUnit: 'g', calories: 40, protein: 3.5, carbs: 7, fat: 0.5 }
    );
  }

  meals.push({
    mealType: 'dinner',
    name: 'Restorative Dinner',
    suggestedTime: '08:30 PM',
    totalCalories: dinnerFoods.reduce((s, f) => s + f.calories, 0),
    totalProtein: dinnerFoods.reduce((s, f) => s + f.protein, 0),
    totalCarbs: dinnerFoods.reduce((s, f) => s + f.carbs, 0),
    totalFat: dinnerFoods.reduce((s, f) => s + f.fat, 0),
    foods: dinnerFoods,
  });

  const totalPlannedCalories = meals.reduce((s, m) => s + m.totalCalories, 0);
  const totalPlannedProtein = meals.reduce((s, m) => s + m.totalProtein, 0);
  const totalPlannedCarbs = meals.reduce((s, m) => s + m.totalCarbs, 0);
  const totalPlannedFat = meals.reduce((s, m) => s + m.totalFat, 0);

  const tips: string[] = [
    `Hit your ${proteinGrams}g daily protein target across your meals for maximal muscle preservation and recovery.`,
    `Hydration goal: Drink at least ${(targets.waterMl / 1000).toFixed(1)}L of clean water throughout the day.`,
    goal === 'muscle_building'
      ? 'Focus on eating consistently in your lean surplus (+350 kcal). If weight does not increase after 2 weeks, add 150 kcal.'
      : goal === 'fat_loss'
      ? 'Prioritize high-volume fibrous veggies and lean protein to stay satisfied in your -450 kcal deficit.'
      : 'Maintain steady energy and consistent sleep to optimize gym performance and nutrient absorption.',
    isVeg
      ? 'Pro Tip: Pair lentils (dal) with grains (rice/roti) or incorporate soy chunks and paneer for complete amino acid profiles.'
      : 'Pro Tip: Keep sodium moderate and take your pre-workout meal 60-90 minutes before your training session.',
  ];

  return {
    dailyTargets: {
      calories: targetCalories,
      protein: proteinGrams,
      carbs: carbsGrams,
      fat: fatGrams,
    },
    totalPlanned: {
      calories: totalPlannedCalories,
      protein: totalPlannedProtein,
      carbs: totalPlannedCarbs,
      fat: totalPlannedFat,
    },
    dietaryPreference: pref,
    meals,
    tips,
  };
}
