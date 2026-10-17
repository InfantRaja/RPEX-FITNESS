import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { format } from 'date-fns';
import {
  Plus, Salad, Flame, Droplets, ChevronDown, ChevronUp,
  Trash2, X, Target, Sparkles, Calculator, RefreshCw,
  Search, Bot, Send, Check, Activity, TrendingUp, Info,
  Languages, Utensils, Apple, ShieldCheck, HeartPulse
} from 'lucide-react';
import { nutritionApi, aiApi, getErrorMessage } from '../lib/api';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { cn, formatCalories } from '../lib/utils';
import type { DatabaseFoodItem, PlannedMeal, NutritionTargets } from '../types';

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];

const MacroBar: React.FC<{ label: string; value: number; max: number; color: string; unit?: string }> = ({
  label, value, max, color, unit = 'g'
}) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-secondary font-medium">{label}</span>
        <span className="text-text-primary font-bold">
          {Math.round(value)}{unit} <span className="text-text-muted font-normal">/ {Math.round(max)}{unit}</span>
        </span>
      </div>
      <div className="h-2.5 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const NutritionPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'meal_plan' | 'food_db' | 'ai_coach' | 'calculator'>('overview');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isRecalcModalOpen, setIsRecalcModalOpen] = useState(false);
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set(['0']));

  // Food Database search state
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPortions, setSelectedPortions] = useState<Record<string, number>>({});
  const [selectedTargetMeal, setSelectedTargetMeal] = useState<Record<string, string>>({});

  // AI Nutrition Coach state
  const [aiLanguage, setAiLanguage] = useState<'en' | 'ta' | 'tanglish'>('en');
  const [aiMessage, setAiMessage] = useState('');
  const [aiHistory, setAiHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      role: 'assistant',
      text: "Hey! I'm your **RPEX AI Nutrition & Fitness Coach**. I analyze your BMR, physical activity, and goal to create evidence-informed dietary recommendations. Ask me anything about pre/post-workout fuel, budget high-protein foods, or macro adjustments!",
      time: 'Just now',
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Queries
  const { data: calculatorData, isLoading: isCalcLoading } = useQuery({
    queryKey: ['nutrition-calculator'],
    queryFn: () => nutritionApi.getCalculator().then(r => r.data.data),
  });

  const { data: todayLog, isLoading: isTodayLoading } = useQuery({
    queryKey: ['nutrition-today'],
    queryFn: () => nutritionApi.getToday().then(r => r.data.data),
  });

  const { data: mealPlanData, isLoading: isMealPlanLoading } = useQuery({
    queryKey: ['nutrition-meal-plan'],
    queryFn: () => nutritionApi.getMealPlan().then(r => r.data.data),
  });

  const { data: foodsData, isLoading: isFoodsLoading } = useQuery({
    queryKey: ['nutrition-foods', foodSearchQuery, selectedCategory],
    queryFn: () =>
      nutritionApi
        .searchFoods({
          query: foodSearchQuery || undefined,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
        })
        .then(r => r.data.data),
  });

  const { data: trendsData } = useQuery({
    queryKey: ['nutrition-trends'],
    queryFn: () => nutritionApi.getTrends().then(r => r.data.data),
  });

  // Effective targets from calculatorData or defaults
  const targets: NutritionTargets = calculatorData?.targets || {
    bmr: 1650,
    tdee: 2250,
    targetCalories: 2200,
    maintenanceCalories: 2250,
    proteinGrams: 150,
    carbsGrams: 240,
    fatGrams: 65,
    waterMl: 3200,
    proteinPerMeal: 35,
    formulaExplanation: 'Mifflin-St Jeor formula with activity multiplier',
    goalAdjustmentLabel: 'Goal Aligned',
  };

  const consumedCalories = todayLog?.totalCalories || 0;
  const consumedProtein = todayLog?.totalProtein || 0;
  const consumedCarbs = todayLog?.totalCarbs || 0;
  const consumedFat = todayLog?.totalFat || 0;
  const waterIntake = todayLog?.waterIntake || 0;

  const remainingCalories = Math.max(0, targets.targetCalories - consumedCalories);
  const remainingProtein = Math.max(0, targets.proteinGrams - consumedProtein);

  // Mutations
  const createMutation = useMutation({
    mutationFn: nutritionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-today'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-trends'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      success('Meal logged!', 'Nutrition tracked successfully.');
      setIsLogModalOpen(false);
      resetLogForm();
    },
    onError: (err) => toastError('Failed to log meal', getErrorMessage(err)),
  });

  const quickLogMutation = useMutation({
    mutationFn: (data: { mealType: string; food: any }) => nutritionApi.quickLogFood(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-today'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-trends'] });
      success('Item added!', 'Food item logged to today\'s nutrition.');
    },
    onError: (err) => toastError('Failed to log food', getErrorMessage(err)),
  });

  const logMealMutation = useMutation({
    mutationFn: (meal: PlannedMeal) => nutritionApi.logPlannedMeal(meal),
    onSuccess: (_, meal) => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-today'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-trends'] });
      success('Meal Logged!', `${meal.name} added to your daily food log.`);
    },
    onError: (err) => toastError('Failed to log planned meal', getErrorMessage(err)),
  });

  const regeneratePlanMutation = useMutation({
    mutationFn: () => nutritionApi.generateMealPlan({}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-meal-plan'] });
      success('Meal Plan Updated!', 'Generated a fresh personalized meal plan.');
    },
    onError: (err) => toastError('Failed to generate plan', getErrorMessage(err)),
  });

  const waterMutation = useMutation({
    mutationFn: (amountMl: number) => nutritionApi.logWater(amountMl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-today'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-trends'] });
      success('Water Logged', 'Hydration progress updated.');
    },
    onError: (err) => toastError('Failed to log water', getErrorMessage(err)),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ mealIndex, itemIndex }: { mealIndex: number; itemIndex: number }) =>
      nutritionApi.deleteMealItem(mealIndex, itemIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-today'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-trends'] });
      success('Item Removed', 'Daily totals recalculated.');
    },
    onError: (err) => toastError('Failed to remove item', getErrorMessage(err)),
  });

  const recalculateMutation = useMutation({
    mutationFn: (data: any) => nutritionApi.recalculateTargets(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-calculator'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-meal-plan'] });
      refreshUser();
      setIsRecalcModalOpen(false);
      success('Targets Updated!', 'Nutrition targets and meal plans refreshed.');
    },
    onError: (err) => toastError('Calculation Failed', getErrorMessage(err)),
  });

  // Manual Log Meal Form
  const { register: registerLog, handleSubmit: handleLogSubmit, reset: resetLogForm, control: logControl } = useForm({
    defaultValues: {
      date: today,
      mealType: 'breakfast',
      foods: [{ name: '', servingSize: 100, servingUnit: 'g', calories: 0, protein: 0, carbs: 0, fat: 0 }],
      notes: '',
    },
  });

  const { fields: foodFields, append: appendFood, remove: removeFood } = useFieldArray({
    control: logControl,
    name: 'foods',
  });

  const onLogSubmit = (formData: any) => {
    const totalCalories = formData.foods.reduce((s: number, f: any) => s + (Number(f.calories) || 0), 0);
    const totalProtein = formData.foods.reduce((s: number, f: any) => s + (Number(f.protein) || 0), 0);
    const totalCarbs = formData.foods.reduce((s: number, f: any) => s + (Number(f.carbs) || 0), 0);
    const totalFat = formData.foods.reduce((s: number, f: any) => s + (Number(f.fat) || 0), 0);

    const meal = {
      mealType: formData.mealType,
      foods: formData.foods,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      notes: formData.notes,
    };

    createMutation.mutate({
      date: formData.date,
      meals: [meal],
    });
  };

  // Recalculator Form
  const { register: registerRecalc, handleSubmit: handleRecalcSubmit } = useForm({
    defaultValues: {
      weight: user?.onboarding?.weight || 70,
      targetWeight: user?.onboarding?.targetWeight || 72,
      height: user?.onboarding?.height || 175,
      age: user?.onboarding?.age || 25,
      gender: user?.onboarding?.gender || 'male',
      activityLevel: user?.onboarding?.activityLevel || 'moderately_active',
      fitnessGoal: user?.onboarding?.fitnessGoal || 'muscle_building',
      dietaryPreference: user?.onboarding?.dietaryPreference || 'non_vegetarian',
      mealBudget: user?.onboarding?.mealBudget || 'moderate',
      country: user?.onboarding?.country || 'India',
      mealsPerDay: user?.onboarding?.mealsPerDay || 4,
    },
  });

  const onRecalcSubmit = (data: any) => {
    recalculateMutation.mutate({
      ...data,
      weight: Number(data.weight),
      targetWeight: Number(data.targetWeight),
      height: Number(data.height),
      age: Number(data.age),
      mealsPerDay: Number(data.mealsPerDay),
    });
  };

  const toggleMealExpand = (id: string) => {
    setExpandedMeals(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // AI Coach handler
  const handleAiSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || aiMessage;
    if (!promptToSend.trim() || isAiLoading) return;

    const userEntry = { role: 'user' as const, text: promptToSend, time: format(new Date(), 'HH:mm') };
    setAiHistory(prev => [...prev, userEntry]);
    if (!customPrompt) setAiMessage('');
    setIsAiLoading(true);

    try {
      const res = await aiApi.chat({
        message: promptToSend,
        topic: 'nutrition',
        language: aiLanguage,
      });

      const replyText = res.data?.data?.message || res.data?.data?.response || "I've reviewed your targets and progress. Keep hitting your protein daily!";
      setAiHistory(prev => [
        ...prev,
        { role: 'assistant', text: replyText, time: format(new Date(), 'HH:mm') },
      ]);
    } catch (err: any) {
      setAiHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `**Coach says:** For ${user?.onboarding?.fitnessGoal || 'your goal'}, make sure you stay within ${targets.targetCalories} kcal and hit ${targets.proteinGrams}g of protein daily!`,
          time: format(new Date(), 'HH:mm'),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const quickQuestions = [
    { label: '🥗 Muscle Building Diet', prompt: 'What should I eat today to gain muscle and hit my macros?' },
    { label: '⚡ Pre & Post Workout', prompt: 'What should I eat before and after the gym?' },
    { label: '💰 Budget Protein (No Whey)', prompt: 'How can I reach my protein target without whey protein on a limited budget?' },
    { label: '🔄 Chicken/Egg Replacements', prompt: 'Which foods can replace chicken, eggs, milk, or paneer?' },
    { label: '🍚 Portion Sizes', prompt: 'How much rice, chicken, or dal should I eat per meal?' },
    { label: '📈 Break Weight Plateau', prompt: 'Why am I not gaining weight despite training, and how should I adjust my diet?' },
    { label: '🛋️ Rest Days Nutrition', prompt: 'What should I eat on rest days?' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-surface to-background border border-border p-6 rounded-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-accent/20 text-accent border border-accent/30">
              AI Sports Nutrition Engine
            </span>
            <span className="text-xs text-text-muted">
              {targets.goalAdjustmentLabel || 'Personalized'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary mt-1">
            Nutrition & Diet Coach
          </h1>
          <p className="text-xs md:text-sm text-text-secondary mt-1 max-w-xl">
            Calculated via <strong>Mifflin-St Jeor Formula</strong> for your body composition, daily activity, and training demands.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsRecalcModalOpen(true)}
            leftIcon={<Calculator className="w-4 h-4 text-accent" />}
          >
            Adjust Profile / BMR
          </Button>
          <Button
            size="sm"
            onClick={() => setIsLogModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            id="log-meal-btn"
          >
            Log Custom Meal
          </Button>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-border pb-2 no-scrollbar">
        {[
          { id: 'overview', label: 'Dashboard & Log', icon: <Flame className="w-4 h-4" /> },
          { id: 'meal_plan', label: 'Personalized Meal Plan', icon: <Utensils className="w-4 h-4" /> },
          { id: 'food_db', label: 'Food Database & Search', icon: <Search className="w-4 h-4" /> },
          { id: 'ai_coach', label: 'AI Nutrition Coach', icon: <Bot className="w-4 h-4" /> },
          { id: 'calculator', label: 'Targets & BMR Science', icon: <Calculator className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm whitespace-nowrap transition-all duration-200',
              activeTab === tab.id
                ? 'bg-accent text-background shadow-md shadow-accent/20 font-bold'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW & DASHBOARD                              */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Daily Calorie & Macro Target Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="flex flex-col justify-between border-accent/20 bg-gradient-to-br from-surface to-background">
              <div>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Maintenance TDEE</span>
                <div className="text-2xl font-black text-text-primary mt-1">
                  {formatCalories(targets.maintenanceCalories || targets.tdee)} <span className="text-xs font-normal text-text-muted">kcal</span>
                </div>
                <p className="text-[11px] text-text-muted mt-1">Daily energy required to stay at current weight.</p>
              </div>
              <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-text-secondary">Estimated BMR:</span>
                <span className="font-bold text-text-primary">{targets.bmr} kcal</span>
              </div>
            </Card>

            <Card className="flex flex-col justify-between border-accent/30 bg-accent/5">
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">Recommended Target</span>
                <div className="text-2xl font-black text-accent mt-1">
                  {formatCalories(targets.targetCalories)} <span className="text-xs font-normal text-text-muted">kcal</span>
                </div>
                <p className="text-[11px] text-text-secondary mt-1">{targets.goalAdjustmentLabel}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-text-secondary">Consumed Today:</span>
                <span className="font-bold text-text-primary">{consumedCalories} kcal</span>
              </div>
            </Card>

            <Card className="flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-info uppercase tracking-wider">Remaining Today</span>
                <div className="text-2xl font-black text-info mt-1">
                  {formatCalories(remainingCalories)} <span className="text-xs font-normal text-text-muted">kcal</span>
                </div>
                <p className="text-[11px] text-text-muted mt-1">Balance to reach your goal target.</p>
              </div>
              <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-text-secondary">Remaining Protein:</span>
                <span className="font-bold text-info">{remainingProtein}g</span>
              </div>
            </Card>

            <Card className="flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-warning uppercase tracking-wider">Hydration Target</span>
                <div className="text-2xl font-black text-warning mt-1">
                  {(waterIntake / 1000).toFixed(1)} <span className="text-xs font-normal text-text-muted">/ {((targets.waterMl || 3200) / 1000).toFixed(1)} L</span>
                </div>
                <p className="text-[11px] text-text-muted mt-1">Intracellular hydration for muscle protein synthesis.</p>
              </div>
              <div className="mt-3 pt-2 border-t border-border flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 py-1 text-xs"
                  onClick={() => waterMutation.mutate(250)}
                  disabled={waterMutation.isPending}
                >
                  +250ml
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 py-1 text-xs"
                  onClick={() => waterMutation.mutate(500)}
                  disabled={waterMutation.isPending}
                >
                  +500ml
                </Button>
              </div>
            </Card>
          </div>

          {/* Today's Calorie Progress Ring & Macro Breakdown */}
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Calories Ring Card */}
            <Card className="lg:col-span-1 flex flex-col justify-center">
              <CardTitle className="mb-4 text-center">Calorie Budget Progress</CardTitle>
              <div className="flex flex-col items-center">
                <div className="relative w-44 h-44">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#20252A" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="#B8FF3B"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={`${2 * Math.PI * 52 * (1 - Math.min(consumedCalories / targets.targetCalories, 1))}`}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-text-primary">
                      {formatCalories(consumedCalories)}
                    </span>
                    <span className="text-xs text-text-muted uppercase font-bold tracking-wider">Consumed</span>
                    <span className="text-[11px] text-accent font-semibold mt-0.5">
                      {Math.round((consumedCalories / targets.targetCalories) * 100)}% of goal
                    </span>
                  </div>
                </div>

                <div className="w-full mt-4 bg-surface p-3 rounded-xl border border-border flex justify-between text-xs">
                  <div>
                    <span className="text-text-muted block">Goal</span>
                    <span className="font-bold text-text-primary">{formatCalories(targets.targetCalories)} kcal</span>
                  </div>
                  <div className="text-right">
                    <span className="text-text-muted block">Remaining</span>
                    <span className="font-bold text-accent">{formatCalories(remainingCalories)} kcal</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Macros Breakdown Card */}
            <Card className="lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle>Daily Macronutrient Distribution</CardTitle>
                  <span className="text-xs text-text-muted">Target: {targets.proteinGrams}g Protein • {targets.carbsGrams}g Carbs • {targets.fatGrams}g Fat</span>
                </div>

                <div className="space-y-4">
                  <MacroBar
                    label="Protein (Muscle Growth & Repair)"
                    value={consumedProtein}
                    max={targets.proteinGrams}
                    color="bg-info"
                  />
                  <MacroBar
                    label="Carbohydrates (Training Fuel & Glycogen)"
                    value={consumedCarbs}
                    max={targets.carbsGrams}
                    color="bg-warning"
                  />
                  <MacroBar
                    label="Healthy Fats (Hormones & Joint Health)"
                    value={consumedFat}
                    max={targets.fatGrams}
                    color="bg-error"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-border">
                <div className="text-center bg-surface/60 rounded-xl p-3 border border-border">
                  <div className="text-xl font-black text-info">
                    {Math.round(consumedProtein)}<span className="text-xs font-normal text-text-muted">g</span>
                  </div>
                  <div className="text-xs font-semibold text-text-primary mt-0.5">Protein</div>
                  <div className="text-[11px] text-text-muted mt-0.5">Target: {targets.proteinGrams}g</div>
                </div>

                <div className="text-center bg-surface/60 rounded-xl p-3 border border-border">
                  <div className="text-xl font-black text-warning">
                    {Math.round(consumedCarbs)}<span className="text-xs font-normal text-text-muted">g</span>
                  </div>
                  <div className="text-xs font-semibold text-text-primary mt-0.5">Carbohydrates</div>
                  <div className="text-[11px] text-text-muted mt-0.5">Target: {targets.carbsGrams}g</div>
                </div>

                <div className="text-center bg-surface/60 rounded-xl p-3 border border-border">
                  <div className="text-xl font-black text-error">
                    {Math.round(consumedFat)}<span className="text-xs font-normal text-text-muted">g</span>
                  </div>
                  <div className="text-xs font-semibold text-text-primary mt-0.5">Fats</div>
                  <div className="text-[11px] text-text-muted mt-0.5">Target: {targets.fatGrams}g</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Today's Logged Meals List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>Today's Logged Meals</CardTitle>
                  <p className="text-xs text-text-muted mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsLogModalOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Custom Item
                </Button>
              </div>
            </CardHeader>

            {todayLog?.meals && todayLog.meals.length > 0 ? (
              <div className="space-y-3">
                {todayLog.meals.map((meal: any, idx: number) => {
                  const mealKey = `${idx}`;
                  const isExpanded = expandedMeals.has(mealKey);
                  return (
                    <div key={mealKey} className="border border-border rounded-xl overflow-hidden bg-surface/30">
                      <button
                        onClick={() => toggleMealExpand(mealKey)}
                        className="w-full flex items-center justify-between p-4 hover:bg-surface transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center">
                            <Salad className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-primary capitalize">
                              {meal.mealType.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-text-muted">
                              {meal.foods?.length || 0} items logged
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-sm font-black text-text-primary">{meal.totalCalories} kcal</span>
                            <div className="text-[11px] text-text-muted">
                              P: {Math.round(meal.totalProtein)}g • C: {Math.round(meal.totalCarbs)}g • F: {Math.round(meal.totalFat)}g
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                        </div>
                      </button>

                      {isExpanded && meal.foods && (
                        <div className="px-4 pb-4 border-t border-border bg-background/50">
                          <div className="mt-3 space-y-2">
                            {meal.foods.map((food: any, fidx: number) => (
                              <div
                                key={fidx}
                                className="flex items-center justify-between text-xs bg-surface rounded-lg px-3 py-2.5 border border-border"
                              >
                                <div>
                                  <span className="text-text-primary font-semibold">{food.name}</span>
                                  <span className="text-text-muted ml-2">({food.servingSize}{food.servingUnit})</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex gap-2 text-[11px]">
                                    <span className="text-info font-medium">{Math.round(food.protein)}g P</span>
                                    <span className="text-warning font-medium">{Math.round(food.carbs)}g C</span>
                                    <span className="text-error font-medium">{Math.round(food.fat)}g F</span>
                                    <span className="text-text-primary font-bold ml-1">{food.calories} kcal</span>
                                  </div>
                                  <button
                                    onClick={() => deleteItemMutation.mutate({ mealIndex: idx, itemIndex: fidx })}
                                    className="text-text-muted hover:text-error transition-colors p-1"
                                    title="Delete food item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-surface/20 rounded-2xl border border-dashed border-border">
                <Salad className="w-12 h-12 text-accent/50 mx-auto mb-3" />
                <h3 className="text-base font-bold text-text-primary">No meals logged for today</h3>
                <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
                  Log your breakfast or pick items from your personalized AI meal plan to start tracking today's macros.
                </p>
                <div className="flex justify-center gap-3 mt-4">
                  <Button
                    size="sm"
                    onClick={() => setActiveTab('meal_plan')}
                    leftIcon={<Utensils className="w-4 h-4" />}
                  >
                    View AI Meal Plan
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsLogModalOpen(true)}
                  >
                    Log Custom Food
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* 7-Day Consistency & Compliance Trends */}
          {trendsData && trendsData.days && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-accent" />
                      7-Day Nutrition Adherence
                    </CardTitle>
                    <p className="text-xs text-text-muted mt-0.5">Daily target consistency across the past week</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-text-muted">Weekly Score</span>
                    <span className="text-sm font-black text-accent ml-2">{trendsData.averages?.adherenceScore || 85}%</span>
                  </div>
                </div>
              </CardHeader>

              <div className="grid grid-cols-7 gap-2 pt-2">
                {trendsData.days.map((d: any, idx: number) => {
                  const pct = Math.min(Math.round(d.calorieAdherencePct || 0), 100);
                  const isHit = pct >= 85 && pct <= 115;
                  return (
                    <div key={idx} className="bg-surface rounded-xl p-2.5 text-center border border-border">
                      <span className="text-[11px] font-semibold text-text-muted block">{d.dayLabel}</span>
                      <div className="h-16 flex items-end justify-center my-2">
                        <div
                          className={cn(
                            'w-4 rounded-t-sm transition-all duration-500',
                            isHit ? 'bg-accent' : pct > 0 ? 'bg-accent/40' : 'bg-surface'
                          )}
                          style={{ height: `${Math.max(pct, 10)}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-text-primary block">{Math.round(d.calories)}</span>
                      <span className="text-[10px] text-text-muted block">{Math.round(d.protein)}g P</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PERSONALIZED AI MEAL PLAN                         */}
      {/* ======================================================== */}
      {activeTab === 'meal_plan' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-border">
            <div>
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <ChefHatIcon className="w-5 h-5 text-accent" />
                Today's Evidence-Based Meal Structure
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Targeting <strong>{targets.targetCalories} kcal</strong> and <strong>{targets.proteinGrams}g protein</strong> across {mealPlanData?.meals?.length || 5} meals.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => regeneratePlanMutation.mutate()}
              isLoading={regeneratePlanMutation.isPending}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Regenerate Plan
            </Button>
          </div>

          {isMealPlanLoading ? (
            <div className="text-center py-16">
              <RefreshCw className="w-8 h-8 text-accent animate-spin mx-auto mb-3" />
              <p className="text-sm text-text-muted">Calculating optimal meal structure for your goal...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mealPlanData?.meals?.map((meal: PlannedMeal, idx: number) => (
                <Card key={idx} className="flex flex-col justify-between border-border hover:border-accent/30 transition-all">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-accent">
                          {meal.suggestedTime || `Meal ${idx + 1}`}
                        </span>
                        <h3 className="text-base font-bold text-text-primary mt-0.5">{meal.name}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-text-primary">{meal.totalCalories} kcal</span>
                        <div className="text-[11px] text-info font-medium">{meal.totalProtein}g protein</div>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {meal.foods?.map((food, fidx) => (
                        <div
                          key={fidx}
                          className="flex items-center justify-between text-xs bg-surface/70 px-3 py-2 rounded-lg border border-border"
                        >
                          <div>
                            <span className="font-semibold text-text-primary">{food.name}</span>
                            <span className="text-text-muted ml-2">({food.servingSize}{food.servingUnit})</span>
                          </div>
                          <div className="flex gap-2 text-[11px] text-text-muted font-medium">
                            <span className="text-info">{food.protein}g P</span>
                            <span className="text-warning">{food.carbs}g C</span>
                            <span className="text-error">{food.fat}g F</span>
                            <span className="text-text-primary font-bold">{food.calories} cal</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] text-text-muted">
                      Target: ~{targets.proteinPerMeal}g protein per meal
                    </span>
                    <Button
                      size="sm"
                      onClick={() => logMealMutation.mutate(meal)}
                      isLoading={logMealMutation.isPending}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Log to Today
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: VERIFIED FOOD DATABASE & SEARCH                   */}
      {/* ======================================================== */}
      {activeTab === 'food_db' && (
        <div className="space-y-5">
          <Card>
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Search foods (e.g. Chicken, Oats, Soy Chunks, Dosa...)"
                  className="input pl-9 w-full text-sm"
                  value={foodSearchQuery}
                  onChange={(e) => setFoodSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Pills */}
              <div className="flex overflow-x-auto gap-1.5 w-full md:w-auto no-scrollbar">
                {[
                  { id: 'all', label: 'All Foods' },
                  { id: 'protein', label: 'Proteins' },
                  { id: 'carbs', label: 'Carbs & Grains' },
                  { id: 'indian_staple', label: 'Indian Staples' },
                  { id: 'dairy', label: 'Dairy & Curd' },
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                      selectedCategory === c.id
                        ? 'bg-accent text-background font-bold'
                        : 'bg-surface text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Food Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isFoodsLoading ? (
              <div className="col-span-full text-center py-12 text-text-muted">
                <Search className="w-8 h-8 text-accent animate-spin mx-auto mb-2" />
                Searching verified nutrition database...
              </div>
            ) : foodsData && foodsData.length > 0 ? (
              foodsData.map((item: DatabaseFoodItem) => {
                const currentServing = selectedPortions[item.id] || item.servingSize;
                const ratio = currentServing / item.servingSize;
                const cal = Math.round(item.calories * ratio);
                const prot = Number((item.protein * ratio).toFixed(1));
                const carbs = Number((item.carbs * ratio).toFixed(1));
                const fat = Number((item.fat * ratio).toFixed(1));
                const targetMeal = selectedTargetMeal[item.id] || 'lunch';

                return (
                  <Card key={item.id} className="flex flex-col justify-between border-border hover:border-accent/40 transition-all">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-text-primary text-sm">{item.name}</h3>
                            {item.isAffordable && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent/20 text-accent">
                                Budget
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-text-muted capitalize">
                            {item.dietaryPreference.replace(/_/g, ' ')} • {item.commonMeasure || `${item.servingSize}${item.servingUnit}`}
                          </span>
                        </div>
                        <span className="text-sm font-black text-text-primary">{cal} kcal</span>
                      </div>

                      {/* Serving Adjuster */}
                      <div className="mt-3 bg-surface/50 p-2.5 rounded-xl border border-border">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-text-muted">Adjust Portion:</span>
                          <span className="font-bold text-text-primary">{currentServing}{item.servingUnit}</span>
                        </div>
                        <div className="flex gap-2">
                          {[50, 100, 150, 200].map(amt => (
                            <button
                              key={amt}
                              onClick={() => setSelectedPortions(prev => ({ ...prev, [item.id]: amt }))}
                              className={cn(
                                'flex-1 py-1 rounded text-[11px] font-semibold border transition-colors',
                                currentServing === amt
                                  ? 'bg-accent/20 border-accent text-accent'
                                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                              )}
                            >
                              {amt}g
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Macro Pills */}
                      <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                        <div className="bg-surface rounded-lg p-1.5">
                          <span className="text-info font-bold block">{prot}g</span>
                          <span className="text-[10px] text-text-muted">Protein</span>
                        </div>
                        <div className="bg-surface rounded-lg p-1.5">
                          <span className="text-warning font-bold block">{carbs}g</span>
                          <span className="text-[10px] text-text-muted">Carbs</span>
                        </div>
                        <div className="bg-surface rounded-lg p-1.5">
                          <span className="text-error font-bold block">{fat}g</span>
                          <span className="text-[10px] text-text-muted">Fat</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Log Action */}
                    <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
                      <select
                        className="input py-1 text-xs flex-1"
                        value={targetMeal}
                        onChange={(e) => setSelectedTargetMeal(prev => ({ ...prev, [item.id]: e.target.value }))}
                      >
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                        <option value="pre_workout">Pre-Workout</option>
                        <option value="post_workout">Post-Workout</option>
                      </select>
                      <Button
                        size="sm"
                        onClick={() =>
                          quickLogMutation.mutate({
                            mealType: targetMeal,
                            food: {
                              name: item.name,
                              servingSize: currentServing,
                              servingUnit: item.servingUnit,
                              calories: cal,
                              protein: prot,
                              carbs,
                              fat,
                            },
                          })
                        }
                        isLoading={quickLogMutation.isPending}
                      >
                        + Add
                      </Button>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-10 text-text-muted">
                No foods matched your search query. Try another term!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: AI NUTRITION COACH (MULTILINGUAL)                 */}
      {/* ======================================================== */}
      {activeTab === 'ai_coach' && (
        <div className="space-y-4">
          {/* Header & Language Selector */}
          <Card className="bg-gradient-to-r from-surface to-background border-accent/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-base">Interactive AI Nutrition Coach</h3>
                  <p className="text-xs text-text-muted">
                    Active Target: {targets.targetCalories} kcal • {targets.proteinGrams}g Protein • Consumed: {consumedCalories} kcal
                  </p>
                </div>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-2 bg-surface p-1.5 rounded-xl border border-border">
                <Languages className="w-4 h-4 text-text-muted ml-1" />
                <button
                  onClick={() => setAiLanguage('en')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                    aiLanguage === 'en' ? 'bg-accent text-background font-bold' : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  English
                </button>
                <button
                  onClick={() => setAiLanguage('ta')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                    aiLanguage === 'ta' ? 'bg-accent text-background font-bold' : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  தமிழ் (Tamil)
                </button>
                <button
                  onClick={() => setAiLanguage('tanglish')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                    aiLanguage === 'tanglish' ? 'bg-accent text-background font-bold' : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  Tanglish
                </button>
              </div>
            </div>

            {/* Quick Questions Chips */}
            <div className="mt-4 pt-3 border-t border-border flex overflow-x-auto gap-2 no-scrollbar">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAiSend(q.prompt)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface hover:bg-accent/10 border border-border hover:border-accent/30 text-text-secondary hover:text-accent whitespace-nowrap transition-all"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Chat Messages Log */}
          <Card className="min-h-[380px] max-h-[500px] overflow-y-auto flex flex-col gap-3 p-4">
            {aiHistory.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex gap-3 max-w-[85%]',
                  item.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                    item.role === 'user'
                      ? 'bg-accent text-background'
                      : 'bg-surface border border-border text-accent'
                  )}
                >
                  {item.role === 'user' ? 'You' : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={cn(
                    'p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed',
                    item.role === 'user'
                      ? 'bg-accent text-background font-medium rounded-tr-none'
                      : 'bg-surface border border-border text-text-primary rounded-tl-none prose prose-invert max-w-none'
                  )}
                >
                  <div className="whitespace-pre-line">{item.text}</div>
                  <span className={cn('text-[10px] block mt-1', item.role === 'user' ? 'text-background/70' : 'text-text-muted')}>
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="flex gap-2 items-center text-xs text-text-muted p-2">
                <Bot className="w-4 h-4 text-accent animate-bounce" />
                Coach is thinking & calculating your optimal answer...
              </div>
            )}
          </Card>

          {/* Input Area */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={
                aiLanguage === 'ta'
                  ? 'உணவு அல்லது உடற்பயிற்சி பற்றிய கேள்வியை கேட்கவும்...'
                  : aiLanguage === 'tanglish'
                  ? 'Diet or gym doubt edhavadhu irundha kelunga bro...'
                  : 'Ask about meal timing, budget protein, breaking plateaus...'
              }
              className="input flex-1 text-sm"
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
            />
            <Button
              onClick={() => handleAiSend()}
              isLoading={isAiLoading}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Send
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: CALCULATOR & BMR SCIENCE                           */}
      {/* ======================================================== */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-accent" />
                Mifflin-St Jeor Energy Expenditure Breakdown
              </CardTitle>
            </CardHeader>
            <div className="space-y-4 text-xs md:text-sm text-text-secondary leading-relaxed">
              <p>
                The Mifflin-St Jeor equation is considered the gold-standard formula by sports dietitians to determine Basal Metabolic Rate (BMR) with the lowest margin of error:
              </p>
              <div className="bg-surface p-3 rounded-xl border border-border font-mono text-xs text-text-primary">
                BMR (Men) = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) + 5<br />
                BMR (Women) = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) - 161
              </div>
              <p>
                Total Daily Energy Expenditure (TDEE) is then calculated by multiplying your BMR by your Physical Activity Level (PAL), factoring in your weekly workouts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
              <div className="bg-surface/50 p-4 rounded-xl border border-border">
                <span className="text-xs text-text-muted">1. Basal Metabolic Rate</span>
                <div className="text-xl font-black text-text-primary mt-1">{targets.bmr} kcal</div>
                <p className="text-[11px] text-text-muted mt-1">Calories burned at absolute complete rest.</p>
              </div>

              <div className="bg-surface/50 p-4 rounded-xl border border-border">
                <span className="text-xs text-text-muted">2. Maintenance TDEE</span>
                <div className="text-xl font-black text-text-primary mt-1">{targets.maintenanceCalories} kcal</div>
                <p className="text-[11px] text-text-muted mt-1">Calories burned including training & daily steps.</p>
              </div>

              <div className="bg-accent/10 p-4 rounded-xl border border-accent/20">
                <span className="text-xs text-accent font-semibold">3. Goal Daily Target</span>
                <div className="text-xl font-black text-accent mt-1">{targets.targetCalories} kcal</div>
                <p className="text-[11px] text-text-secondary mt-1">{targets.goalAdjustmentLabel}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setIsRecalcModalOpen(true)} leftIcon={<Calculator className="w-4 h-4" />}>
                Update Profile & Recalculate
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: RECALCULATE TARGETS MODAL                       */}
      {/* ======================================================== */}
      <Modal
        isOpen={isRecalcModalOpen}
        onClose={() => setIsRecalcModalOpen(false)}
        title="Personalized Nutrition Target Calculator"
        size="lg"
      >
        <form onSubmit={handleRecalcSubmit(onRecalcSubmit)} className="space-y-4">
          <p className="text-xs text-text-secondary">
            Changing your weight, training split, or fitness goal automatically recalculates your daily BMR, TDEE, protein, carbs, and fats.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="label text-xs">Current Weight (kg)</label>
              <input type="number" step="0.5" className="input text-xs" {...registerRecalc('weight')} />
            </div>
            <div>
              <label className="label text-xs">Target Weight (kg)</label>
              <input type="number" step="0.5" className="input text-xs" {...registerRecalc('targetWeight')} />
            </div>
            <div>
              <label className="label text-xs">Height (cm)</label>
              <input type="number" className="input text-xs" {...registerRecalc('height')} />
            </div>
            <div>
              <label className="label text-xs">Age</label>
              <input type="number" className="input text-xs" {...registerRecalc('age')} />
            </div>
            <div>
              <label className="label text-xs">Gender</label>
              <select className="input text-xs" {...registerRecalc('gender')}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label text-xs">Meals Per Day</label>
              <select className="input text-xs" {...registerRecalc('mealsPerDay')}>
                <option value={3}>3 Meals</option>
                <option value={4}>4 Meals</option>
                <option value={5}>5 Meals</option>
                <option value={6}>6 Meals</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Primary Fitness Goal</label>
              <select className="input text-xs" {...registerRecalc('fitnessGoal')}>
                <option value="muscle_building">Muscle Gain (Surplus + High Protein)</option>
                <option value="fat_loss">Fat Loss (Moderate Deficit + Muscle Retention)</option>
                <option value="strength">Strength Gain (High Performance Fuel)</option>
                <option value="body_recomposition">Body Recomposition (Gradual Lean Mass)</option>
                <option value="maintenance">Maintenance (Balanced Intake)</option>
                <option value="general_fitness">General Fitness</option>
              </select>
            </div>

            <div>
              <label className="label text-xs">Daily Activity Level</label>
              <select className="input text-xs" {...registerRecalc('activityLevel')}>
                <option value="sedentary">Sedentary (Desk job, little exercise)</option>
                <option value="lightly_active">Lightly Active (1-3 days/week)</option>
                <option value="moderately_active">Moderately Active (3-5 days/week)</option>
                <option value="very_active">Very Active (6-7 days/week intense)</option>
                <option value="extra_active">Extra Active (Hard physical work + training)</option>
              </select>
            </div>

            <div>
              <label className="label text-xs">Dietary Preference</label>
              <select className="input text-xs" {...registerRecalc('dietaryPreference')}>
                <option value="non_vegetarian">Non-Vegetarian (Chicken, Fish, Eggs)</option>
                <option value="eggetarian">Eggetarian (Vegetarian + Eggs)</option>
                <option value="vegetarian">Vegetarian (Dairy, Dal, Paneer, Soy)</option>
                <option value="vegan">Vegan (Plant-based only)</option>
              </select>
            </div>

            <div>
              <label className="label text-xs">Food Budget</label>
              <select className="input text-xs" {...registerRecalc('mealBudget')}>
                <option value="low">Budget-Friendly (Soy Chunks, Eggs, Peanuts, Dal)</option>
                <option value="moderate">Moderate (Standard Whole Foods)</option>
                <option value="high">Premium (Salmon, Supplements, Exotic cuts)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsRecalcModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={recalculateMutation.isPending}>
              Save & Recalculate Targets
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: LOG CUSTOM MEAL MODAL                           */}
      {/* ======================================================== */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Custom Meal"
        size="lg"
      >
        <form onSubmit={handleLogSubmit(onLogSubmit)} className="space-y-4" id="nutrition-form">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Meal Type</label>
              <select className="input" {...registerLog('mealType')}>
                {mealTypes.map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" {...registerLog('date')} />
            </div>
          </div>

          {/* Foods Array */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Foods</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<Plus className="w-3 h-3" />}
                onClick={() => appendFood({ name: '', servingSize: 100, servingUnit: 'g', calories: 0, protein: 0, carbs: 0, fat: 0 })}
              >
                Add Food
              </Button>
            </div>
            <div className="space-y-3">
              {foodFields.map((field, idx) => (
                <div key={field.id} className="bg-surface rounded-xl p-3 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      className="input flex-1 py-2 text-xs"
                      placeholder="Food name (e.g., Boiled Eggs)"
                      {...registerLog(`foods.${idx}.name`)}
                    />
                    <button
                      type="button"
                      onClick={() => removeFood(idx)}
                      className="p-1.5 text-text-muted hover:text-error"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Serving (g)', field: 'servingSize' as const },
                      { label: 'Calories', field: 'calories' as const },
                      { label: 'Protein (g)', field: 'protein' as const },
                      { label: 'Carbs (g)', field: 'carbs' as const },
                    ].map(f => (
                      <div key={f.field}>
                        <label className="text-[11px] text-text-muted mb-1 block">{f.label}</label>
                        <input
                          type="number"
                          className="input py-1 text-xs"
                          {...registerLog(`foods.${idx}.${f.field}`, { valueAsNumber: true })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input resize-none min-h-[50px] text-xs" placeholder="E.g. Pre-workout snack..." {...registerLog('notes')} />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={createMutation.isPending} id="nutrition-submit">
              Log Meal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Helper Icon
const ChefHatIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
    <line x1="6" y1="17" x2="18" y2="17" />
  </svg>
);

export default NutritionPage;
