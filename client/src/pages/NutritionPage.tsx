import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { format } from 'date-fns';
import {
  Plus, Salad, Flame, Droplets, ChevronDown, ChevronUp,
  Trash2, X, Target
} from 'lucide-react';
import { nutritionApi, getErrorMessage } from '../lib/api';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { cn, formatCalories } from '../lib/utils';

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];

const MacroBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({
  label, value, max, color
}) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-secondary font-medium">{label}</span>
        <span className="text-text-primary font-bold">{Math.round(value)}g</span>
      </div>
      <div className="h-2 bg-surface rounded-full overflow-hidden">
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
  const { success, error: toastError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: todayLog, isLoading } = useQuery({
    queryKey: ['nutrition-today'],
    queryFn: () => nutritionApi.getToday().then(r => r.data.data),
  });

  const { data: recentLogs } = useQuery({
    queryKey: ['nutrition-recent'],
    queryFn: () => nutritionApi.getAll({ limit: 7 }).then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: nutritionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-today'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-recent'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      success('Meal logged!', 'Nutrition tracked successfully.');
      setIsModalOpen(false);
      reset();
    },
    onError: (err) => toastError('Failed to log meal', getErrorMessage(err)),
  });

  const { register, handleSubmit, reset, control, watch } = useForm({
    defaultValues: {
      date: today,
      mealType: 'breakfast',
      foods: [{ name: '', servingSize: 100, servingUnit: 'g', calories: 0, protein: 0, carbs: 0, fat: 0 }],
      notes: '',
    },
  });

  const { fields: foodFields, append: appendFood, remove: removeFood } = useFieldArray({
    control,
    name: 'foods',
  });

  const onSubmit = (formData: any) => {
    // Calculate meal totals
    const totalCalories = formData.foods.reduce((s: number, f: any) => s + Number(f.calories), 0);
    const totalProtein = formData.foods.reduce((s: number, f: any) => s + Number(f.protein), 0);
    const totalCarbs = formData.foods.reduce((s: number, f: any) => s + Number(f.carbs), 0);
    const totalFat = formData.foods.reduce((s: number, f: any) => s + Number(f.fat), 0);

    const meal = {
      mealType: formData.mealType,
      foods: formData.foods,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      notes: formData.notes,
    };

    // Create or update today's log
    createMutation.mutate({
      date: formData.date,
      meals: [meal],
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

  // Daily targets (could be from user onboarding/AI recommendations)
  const targets = { calories: 2200, protein: 165, carbs: 220, fat: 70 };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary">Nutrition</h1>
          <p className="text-sm text-text-secondary mt-0.5">Track your daily food intake and macros</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />} id="log-meal-btn">
          Log Meal
        </Button>
      </div>

      {/* Today's Summary */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Calories Ring */}
        <Card className="lg:col-span-1">
          <CardTitle className="mb-4">Today's Calories</CardTitle>
          <div className="flex flex-col items-center">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#20252A" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke="#B8FF3B" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - Math.min((todayLog?.totalCalories || 0) / targets.calories, 1))}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-text-primary">
                  {formatCalories(todayLog?.totalCalories || 0)}
                </span>
                <span className="text-xs text-text-muted">kcal</span>
              </div>
            </div>
            <div className="text-xs text-text-muted mt-2">
              Goal: {formatCalories(targets.calories)} kcal
            </div>
            <div className="text-xs text-text-secondary mt-0.5">
              Remaining: {formatCalories(Math.max(0, targets.calories - (todayLog?.totalCalories || 0)))} kcal
            </div>
          </div>
        </Card>

        {/* Macros */}
        <Card className="lg:col-span-2">
          <CardTitle className="mb-4">Macro Breakdown</CardTitle>
          <div className="space-y-4">
            <MacroBar
              label="Protein"
              value={todayLog?.totalProtein || 0}
              max={targets.protein}
              color="bg-info"
            />
            <MacroBar
              label="Carbohydrates"
              value={todayLog?.totalCarbs || 0}
              max={targets.carbs}
              color="bg-warning"
            />
            <MacroBar
              label="Fat"
              value={todayLog?.totalFat || 0}
              max={targets.fat}
              color="bg-error"
            />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'Protein', value: Math.round(todayLog?.totalProtein || 0), target: targets.protein, color: 'text-info' },
              { label: 'Carbs', value: Math.round(todayLog?.totalCarbs || 0), target: targets.carbs, color: 'text-warning' },
              { label: 'Fat', value: Math.round(todayLog?.totalFat || 0), target: targets.fat, color: 'text-error' },
            ].map(m => (
              <div key={m.label} className="text-center bg-surface rounded-xl p-3">
                <div className={cn('text-xl font-black', m.color)}>{m.value}<span className="text-xs font-normal text-text-muted">g</span></div>
                <div className="text-xs text-text-muted">{m.label}</div>
                <div className="text-xs text-text-muted mt-0.5">/ {m.target}g</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Today's Meals */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Meals</CardTitle>
          <span className="text-xs text-text-muted">{format(new Date(), 'EEEE, MMMM d')}</span>
        </CardHeader>

        {todayLog?.meals && todayLog.meals.length > 0 ? (
          <div className="space-y-3">
            {todayLog.meals.map((meal: any, idx: number) => {
              const mealKey = `${idx}`;
              const isExpanded = expandedMeals.has(mealKey);
              return (
                <div key={mealKey} className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleMealExpand(mealKey)}
                    className="w-full flex items-center justify-between p-4 hover:bg-surface transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-accent-muted rounded-lg flex items-center justify-center">
                        <Salad className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary capitalize">
                          {meal.mealType.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-text-muted">{meal.foods?.length || 0} items</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-text-primary">{meal.totalCalories} kcal</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                    </div>
                  </button>
                  {isExpanded && meal.foods && (
                    <div className="px-4 pb-4 border-t border-border">
                      <div className="mt-3 space-y-2">
                        {meal.foods.map((food: any, fidx: number) => (
                          <div key={fidx} className="flex items-center justify-between text-xs bg-surface rounded-lg px-3 py-2">
                            <span className="text-text-primary font-medium">{food.name}</span>
                            <div className="flex gap-3 text-text-muted">
                              <span>{food.servingSize}{food.servingUnit}</span>
                              <span className="text-text-primary font-semibold">{food.calories} kcal</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 mt-3 text-xs">
                        <span className="text-info">P: {Math.round(meal.totalProtein)}g</span>
                        <span className="text-warning">C: {Math.round(meal.totalCarbs)}g</span>
                        <span className="text-error">F: {Math.round(meal.totalFat)}g</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <Salad className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">No meals logged today</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => setIsModalOpen(true)}
            >
              Log your first meal
            </Button>
          </div>
        )}
      </Card>

      {/* Log Meal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Meal"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="nutrition-form">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Meal Type</label>
              <select className="input" {...register('mealType')}>
                {mealTypes.map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" {...register('date')} />
            </div>
          </div>

          {/* Foods */}
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
                      className="input flex-1 py-2"
                      placeholder="Food name (e.g., Chicken Breast)"
                      {...register(`foods.${idx}.name`)}
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
                        <label className="text-xs text-text-muted mb-1 block">{f.label}</label>
                        <input
                          type="number"
                          className="input py-1.5 text-xs"
                          {...register(`foods.${idx}.${f.field}`, { valueAsNumber: true })}
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
            <textarea className="input resize-none min-h-[60px]" placeholder="Any notes..." {...register('notes')} />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
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

export default NutritionPage;
