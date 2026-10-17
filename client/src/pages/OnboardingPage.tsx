import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell, Target, Utensils, ChevronRight, ChevronLeft,
  Check, Zap, User, Activity, Globe, HeartPulse, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi, getErrorMessage } from '../lib/api';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { cn } from '../lib/utils';

const steps = [
  { id: 1, title: 'Profile & Body', icon: User },
  { id: 2, title: 'Goal & Activity', icon: Target },
  { id: 3, title: 'Workout Split', icon: Dumbbell },
  { id: 4, title: 'Diet & Nutrition', icon: Utensils },
];

const fitnessGoals = [
  { value: 'muscle_building', label: 'Muscle Gain', emoji: '💪', desc: 'Calorie surplus & muscle hypertrophy' },
  { value: 'fat_loss', label: 'Fat Loss', emoji: '🔥', desc: 'Moderate deficit while retaining lean mass' },
  { value: 'strength', label: 'Strength Gain', emoji: '🏋️', desc: 'Progressive strength & recovery fuel' },
  { value: 'body_recomposition', label: 'Body Recomp', emoji: '⚡', desc: 'Simultaneous fat loss & muscle tone' },
  { value: 'maintenance', label: 'Weight Maintenance', emoji: '⚖️', desc: 'Maintain physique with balanced macros' },
  { value: 'general_fitness', label: 'General Fitness', emoji: '🏃', desc: 'Overall health, vitality & stamina' },
];

const experienceLevels = [
  { value: 'beginner', label: 'Beginner', desc: '< 1 year training' },
  { value: 'intermediate', label: 'Intermediate', desc: '1–3 years training' },
  { value: 'advanced', label: 'Advanced', desc: '3–5 years training' },
  { value: 'pro', label: 'Pro Athlete', desc: '5+ years competitive' },
];

const activityLevels = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Desk job, minimal walking' },
  { value: 'lightly_active', label: 'Lightly Active', desc: 'Light exercise 1–3 days/week' },
  { value: 'moderately_active', label: 'Moderately Active', desc: 'Exercise 3–5 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Intense training 6–7 days/week' },
  { value: 'extra_active', label: 'Extra Active', desc: 'Heavy physical work or 2x daily workouts' },
];

const genderOptions = [
  { value: 'male', label: 'Male', emoji: '👨' },
  { value: 'female', label: 'Female', emoji: '👩' },
  { value: 'other', label: 'Other', emoji: '🧑' },
];

const workoutLocations = [
  { value: 'gym', label: 'Gym', emoji: '🏋️', desc: 'Full commercial gym equipment' },
  { value: 'home', label: 'Home', emoji: '🏠', desc: 'Dumbbells, bands or bodyweight' },
  { value: 'both', label: 'Both', emoji: '🔄', desc: 'Mix of gym and home sessions' },
];

const equipmentOptions = [
  'Barbells', 'Dumbbells', 'Kettlebells', 'Pull-up Bar', 'Resistance Bands',
  'Cable Machine', 'Smith Machine', 'Treadmill', 'Bike', 'Rowing Machine',
  'Bench', 'Squat Rack', 'Foam Roller', 'Medicine Ball',
];

const dietaryOptions = [
  { value: 'non_vegetarian', label: 'Non-Vegetarian', emoji: '🍗', desc: 'Chicken, fish, eggs, meat' },
  { value: 'eggetarian', label: 'Eggetarian', emoji: '🥚', desc: 'Vegetarian + Eggs' },
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥗', desc: 'Dal, paneer, curd, soy, veggies' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱', desc: '100% plant-based' },
];

const budgetOptions = [
  { value: 'low', label: 'Budget-Friendly', emoji: '💰', desc: 'Soy chunks, eggs, peanuts, dal, oats' },
  { value: 'moderate', label: 'Moderate', emoji: '🥑', desc: 'Standard whole foods, dairy, poultry' },
  { value: 'high', label: 'Premium', emoji: '🥩', desc: 'Salmon, lean steaks, exotic supplements' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
  { value: 'tanglish', label: 'Tanglish' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

const countries = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'United Arab Emirates', 'Singapore', 'Malaysia', 'Germany', 'France', 'Other'
];

interface OnboardingData {
  unitSystem: 'metric' | 'imperial';
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  targetWeight?: number;
  age: number;
  country: string;
  preferredLanguage: string;
  fitnessGoal: string;
  fitnessExperience: string;
  activityLevel: string;
  workoutLocation: string;
  availableEquipment: string[];
  trainingDaysPerWeek: number;
  dietaryPreference: string;
  mealsPerDay: number;
  mealBudget: string;
  foodAllergies: string;
}

const OnboardingPage: React.FC = () => {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [data, setData] = useState<Partial<OnboardingData>>({
    unitSystem: 'metric',
    gender: 'male',
    height: 175,
    weight: 70,
    targetWeight: 72,
    age: 24,
    country: 'India',
    preferredLanguage: 'en',
    fitnessGoal: 'muscle_building',
    fitnessExperience: 'beginner',
    activityLevel: 'moderately_active',
    workoutLocation: 'gym',
    availableEquipment: ['Dumbbells', 'Barbells', 'Bench'],
    trainingDaysPerWeek: 4,
    dietaryPreference: 'non_vegetarian',
    mealsPerDay: 4,
    mealBudget: 'moderate',
    foodAllergies: '',
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const toggleEquipment = (item: string) => {
    const current = data.availableEquipment || [];
    if (current.includes(item)) {
      updateData({ availableEquipment: current.filter(e => e !== item) });
    } else {
      updateData({ availableEquipment: [...current, item] });
    }
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!data.height || data.height < 50) {
        toastError('Height Required', 'Please enter a valid height.');
        return false;
      }
      if (!data.weight || data.weight < 20) {
        toastError('Weight Required', 'Please enter a valid body weight.');
        return false;
      }
      if (!data.age || data.age < 10) {
        toastError('Age Required', 'Please enter your age.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 4) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    if (!validateStep(currentStep)) return;
    setIsLoading(true);

    try {
      const allergies = data.foodAllergies
        ? data.foodAllergies.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const onboardingPayload = {
        ...data,
        completed: true,
        foodAllergies: allergies,
        height: Number(data.height),
        weight: Number(data.weight),
        targetWeight: Number(data.targetWeight || data.weight),
        age: Number(data.age),
        mealsPerDay: Number(data.mealsPerDay || 4),
        trainingDaysPerWeek: Number(data.trainingDaysPerWeek || 4),
      };

      const response = await userApi.updateOnboarding(onboardingPayload);
      const updatedUser = response.data.user;
      updateUser({
        onboarding: updatedUser.onboarding,
        nutritionTargets: updatedUser.nutritionTargets || updatedUser.onboarding?.nutritionTargets,
      });

      success('Profile Complete!', 'Your personalized nutrition targets and workout program are ready!');
      navigate('/dashboard');
    } catch (err) {
      toastError('Setup Failed', getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const SelectCard: React.FC<{
    selected: boolean;
    onClick: () => void;
    emoji?: string;
    label: string;
    desc?: string;
  }> = ({ selected, onClick, emoji, label, desc }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer',
        selected
          ? 'border-accent bg-accent/15 text-text-primary shadow-sm shadow-accent/10'
          : 'border-border bg-surface text-text-secondary hover:border-accent/40 hover:text-text-primary'
      )}
    >
      {selected && (
        <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-background" strokeWidth={3} />
        </div>
      )}
      {emoji && <div className="text-xl mb-1">{emoji}</div>}
      <div className={cn('font-bold text-xs sm:text-sm', selected ? 'text-accent' : 'text-text-primary')}>{label}</div>
      {desc && <div className="text-[11px] mt-0.5 text-text-muted leading-tight">{desc}</div>}
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-surface/40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-md shadow-accent/20">
            <Zap className="w-5 h-5 text-background" fill="currentColor" />
          </div>
          <div>
            <span className="font-black text-lg text-text-primary">
              RPEX<span className="text-accent"> Fitness</span>
            </span>
            <span className="text-[10px] text-text-muted block uppercase tracking-wider font-semibold">
              Personalized Athlete Onboarding
            </span>
          </div>
        </div>
        <div className="text-xs font-semibold text-text-muted">
          Step <span className="text-accent font-bold">{currentStep}</span> of 4
        </div>
      </div>

      {/* Main Content Form */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-8">
        {/* Progress Bar & Steps */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <React.Fragment key={step.id}>
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
                    isActive && 'bg-accent text-background font-bold shadow-md shadow-accent/20',
                    isCompleted && 'bg-accent/20 text-accent',
                    !isActive && !isCompleted && 'text-text-muted bg-surface'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" strokeWidth={3} />
                  ) : (
                    <Icon className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 rounded-full transition-all duration-300',
                      isCompleted ? 'bg-accent' : 'bg-border'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step 1: Profile & Measurements */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-text-primary">Personal Profile & Measurements</h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Your age, gender, height, and weight are used to calculate your precise <strong>Mifflin-St Jeor Basal Metabolic Rate (BMR)</strong>.
              </p>
            </div>

            {/* Gender Selection */}
            <div>
              <label className="label text-xs">Biological Gender (for metabolic formula)</label>
              <div className="grid grid-cols-3 gap-3">
                {genderOptions.map(g => (
                  <SelectCard
                    key={g.value}
                    selected={data.gender === g.value}
                    onClick={() => updateData({ gender: g.value as any })}
                    emoji={g.emoji}
                    label={g.label}
                  />
                ))}
              </div>
            </div>

            {/* Unit System */}
            <div>
              <label className="label text-xs">Measurement Units</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'metric', label: 'Metric (kg, cm)' },
                  { value: 'imperial', label: 'Imperial (lbs, ft)' },
                ].map(unit => (
                  <SelectCard
                    key={unit.value}
                    selected={data.unitSystem === unit.value}
                    onClick={() => updateData({ unitSystem: unit.value as any })}
                    label={unit.label}
                  />
                ))}
              </div>
            </div>

            {/* Body Stats Input */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="label text-xs">Height ({data.unitSystem === 'metric' ? 'cm' : 'ft'})</label>
                <input
                  type="number"
                  step="0.5"
                  className="input text-sm"
                  placeholder={data.unitSystem === 'metric' ? '175' : '5.9'}
                  value={data.height || ''}
                  onChange={e => updateData({ height: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="label text-xs">Current Weight ({data.unitSystem === 'metric' ? 'kg' : 'lbs'})</label>
                <input
                  type="number"
                  step="0.5"
                  className="input text-sm"
                  placeholder="70"
                  value={data.weight || ''}
                  onChange={e => updateData({ weight: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="label text-xs">Target Weight ({data.unitSystem === 'metric' ? 'kg' : 'lbs'})</label>
                <input
                  type="number"
                  step="0.5"
                  className="input text-sm"
                  placeholder="75"
                  value={data.targetWeight || ''}
                  onChange={e => updateData({ targetWeight: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="label text-xs">Age</label>
                <input
                  type="number"
                  className="input text-sm"
                  placeholder="24"
                  value={data.age || ''}
                  onChange={e => updateData({ age: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Country and Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Country / Region (for local food staples)</label>
                <select
                  className="input text-sm"
                  value={data.country || 'India'}
                  onChange={e => updateData({ country: e.target.value })}
                >
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label text-xs">Preferred AI Coach Language</label>
                <select
                  className="input text-sm"
                  value={data.preferredLanguage || 'en'}
                  onChange={e => updateData({ preferredLanguage: e.target.value })}
                >
                  {languages.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Goal & Activity */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-text-primary">Primary Goal & Activity Level</h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Your goal determines calorie adjustments (surplus or deficit) and macronutrient ratios.
              </p>
            </div>

            {/* Fitness Goals */}
            <div>
              <label className="label text-xs">Primary Fitness Goal</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {fitnessGoals.map(g => (
                  <SelectCard
                    key={g.value}
                    selected={data.fitnessGoal === g.value}
                    onClick={() => updateData({ fitnessGoal: g.value })}
                    emoji={g.emoji}
                    label={g.label}
                    desc={g.desc}
                  />
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="label text-xs">Training Experience</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {experienceLevels.map(lvl => (
                  <SelectCard
                    key={lvl.value}
                    selected={data.fitnessExperience === lvl.value}
                    onClick={() => updateData({ fitnessExperience: lvl.value })}
                    label={lvl.label}
                    desc={lvl.desc}
                  />
                ))}
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="label text-xs">Daily Physical Activity Level (TDEE Factor)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activityLevels.map(act => (
                  <SelectCard
                    key={act.value}
                    selected={data.activityLevel === act.value}
                    onClick={() => updateData({ activityLevel: act.value })}
                    label={act.label}
                    desc={act.desc}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Workout Preferences */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-text-primary">Workout Preferences & Location</h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Tell us where and how often you train so your AI Coach programs the optimal split.
              </p>
            </div>

            {/* Workout Location */}
            <div>
              <label className="label text-xs">Workout Location</label>
              <div className="grid grid-cols-3 gap-3">
                {workoutLocations.map(loc => (
                  <SelectCard
                    key={loc.value}
                    selected={data.workoutLocation === loc.value}
                    onClick={() => updateData({ workoutLocation: loc.value })}
                    emoji={loc.emoji}
                    label={loc.label}
                    desc={loc.desc}
                  />
                ))}
              </div>
            </div>

            {/* Training Frequency */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label text-xs mb-0">Training Days per Week</label>
                <span className="text-accent font-black text-sm">{data.trainingDaysPerWeek || 4} Days</span>
              </div>
              <input
                type="range"
                min={1}
                max={7}
                value={data.trainingDaysPerWeek || 4}
                onChange={e => updateData({ trainingDaysPerWeek: Number(e.target.value) })}
                className="w-full accent-accent cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-text-muted mt-1">
                <span>1 day (Recovery)</span>
                <span>4–5 days (Optimal)</span>
                <span>7 days (Daily)</span>
              </div>
            </div>

            {/* Equipment Chips */}
            <div>
              <label className="label text-xs">Available Equipment (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {equipmentOptions.map(eq => {
                  const isSelected = data.availableEquipment?.includes(eq);
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => toggleEquipment(eq)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer',
                        isSelected
                          ? 'bg-accent/20 border-accent text-accent font-bold'
                          : 'bg-surface border-border text-text-secondary hover:border-accent/40 hover:text-text-primary'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                      {eq}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Nutrition & Diet Preferences */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-text-primary">Diet & Nutrition Planning</h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Personalize your daily meal plan to respect your dietary preferences, budget, and meal frequency.
              </p>
            </div>

            {/* Dietary Preference */}
            <div>
              <label className="label text-xs">Dietary Preference</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {dietaryOptions.map(diet => (
                  <SelectCard
                    key={diet.value}
                    selected={data.dietaryPreference === diet.value}
                    onClick={() => updateData({ dietaryPreference: diet.value })}
                    emoji={diet.emoji}
                    label={diet.label}
                    desc={diet.desc}
                  />
                ))}
              </div>
            </div>

            {/* Meals Per Day & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label text-xs">Preferred Meals per Day</label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateData({ mealsPerDay: num })}
                      className={cn(
                        'p-2.5 rounded-xl border text-center font-bold text-xs transition-colors cursor-pointer',
                        data.mealsPerDay === num
                          ? 'bg-accent/20 border-accent text-accent'
                          : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                      )}
                    >
                      {num} Meals
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label text-xs">Food Budget Range</label>
                <div className="grid grid-cols-3 gap-2">
                  {budgetOptions.map(b => (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => updateData({ mealBudget: b.value })}
                      className={cn(
                        'p-2 rounded-xl border text-center font-semibold text-xs transition-colors cursor-pointer',
                        data.mealBudget === b.value
                          ? 'bg-accent/20 border-accent text-accent'
                          : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                      )}
                    >
                      <span className="block text-sm">{b.emoji}</span>
                      <span className="text-[11px] font-bold block">{b.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Food Allergies */}
            <div>
              <label className="label text-xs">Food Allergies, Intolerances, or Restrictions (optional)</label>
              <input
                type="text"
                className="input text-sm"
                placeholder="e.g. peanuts, lactose, shellfish, gluten (leave blank if none)"
                value={data.foodAllergies || ''}
                onChange={e => updateData({ foodAllergies: e.target.value })}
              />
              <span className="text-[11px] text-text-muted mt-1 block">
                Separated by commas. Foods with these ingredients will be excluded from your AI meal plans.
              </span>
            </div>
          </div>
        )}

        {/* Step Navigation Actions */}
        <div className="flex items-center justify-between pt-8 border-t border-border mt-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1 || isLoading}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Back
          </Button>

          <div className="flex gap-1.5">
            {steps.map(step => (
              <div
                key={step.id}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  step.id === currentStep ? 'w-6 bg-accent' : step.id < currentStep ? 'w-2 bg-accent/60' : 'w-2 bg-border'
                )}
              />
            ))}
          </div>

          {currentStep < 4 ? (
            <Button onClick={handleNext} rightIcon={<ChevronRight className="w-4 h-4" />}>
              Next Step
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              isLoading={isLoading}
              id="onboarding-complete"
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Complete & Generate Plan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
