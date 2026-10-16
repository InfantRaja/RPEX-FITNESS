import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dumbbell, Target, MapPin, Utensils, ChevronRight, ChevronLeft,
  Check, Zap, User, Ruler, Weight, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi, getErrorMessage } from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { cn } from '../lib/utils';

const steps = [
  { id: 1, title: 'Basic Info', icon: User },
  { id: 2, title: 'Your Goals', icon: Target },
  { id: 3, title: 'Workout Preferences', icon: Dumbbell },
  { id: 4, title: 'Nutrition', icon: Utensils },
];

const fitnessGoals = [
  { value: 'muscle_building', label: 'Muscle Building', emoji: '💪', desc: 'Build lean muscle mass' },
  { value: 'fat_loss', label: 'Fat Loss', emoji: '🔥', desc: 'Burn fat and get lean' },
  { value: 'strength', label: 'Strength', emoji: '🏋️', desc: 'Increase raw strength' },
  { value: 'weight_gain', label: 'Weight Gain', emoji: '📈', desc: 'Healthy weight gain' },
  { value: 'maintenance', label: 'Maintenance', emoji: '⚖️', desc: 'Maintain current physique' },
  { value: 'general_fitness', label: 'General Fitness', emoji: '🏃', desc: 'Overall health & fitness' },
];

const experienceLevels = [
  { value: 'beginner', label: 'Beginner', desc: '< 1 year training' },
  { value: 'intermediate', label: 'Intermediate', desc: '1–3 years training' },
  { value: 'advanced', label: 'Advanced', desc: '3+ years training' },
];

const workoutLocations = [
  { value: 'gym', label: 'Gym', emoji: '🏋️' },
  { value: 'home', label: 'Home', emoji: '🏠' },
  { value: 'both', label: 'Both', emoji: '🔄' },
];

const equipmentOptions = [
  'Barbells', 'Dumbbells', 'Kettlebells', 'Pull-up Bar', 'Resistance Bands',
  'Cable Machine', 'Smith Machine', 'Treadmill', 'Bike', 'Rowing Machine',
  'Bench', 'Squat Rack', 'Foam Roller', 'Medicine Ball',
];

const dietaryOptions = [
  { value: 'none', label: 'No Restriction', emoji: '🍽️' },
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'keto', label: 'Keto', emoji: '🥑' },
  { value: 'paleo', label: 'Paleo', emoji: '🥩' },
  { value: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt', label: 'Português' },
  { value: 'ar', label: 'العربية' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'it', label: 'Italiano' },
  { value: 'ru', label: 'Русский' },
];

interface OnboardingData {
  unitSystem: 'metric' | 'imperial';
  height: number;
  weight: number;
  age: number;
  fitnessGoal: string;
  fitnessExperience: string;
  workoutLocation: string;
  availableEquipment: string[];
  trainingDaysPerWeek: number;
  dietaryPreference: string;
  foodAllergies: string;
  preferredLanguage: string;
  mealBudget?: number;
}

const OnboardingPage: React.FC = () => {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [data, setData] = useState<Partial<OnboardingData>>({
    unitSystem: 'metric',
    fitnessGoal: '',
    fitnessExperience: '',
    workoutLocation: 'gym',
    availableEquipment: [],
    trainingDaysPerWeek: 4,
    dietaryPreference: 'none',
    foodAllergies: '',
    preferredLanguage: 'en',
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

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const allergies = data.foodAllergies
        ? data.foodAllergies.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const onboardingPayload = {
        ...data,
        completed: true,
        foodAllergies: allergies,
      };

      const response = await userApi.updateOnboarding(onboardingPayload);
      updateUser({ onboarding: response.data.user.onboarding });
      success('Profile complete!', 'Welcome to REPX Tracker. Let\'s crush your goals!');
      navigate('/dashboard');
    } catch (err) {
      toastError('Failed to save', getErrorMessage(err));
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
        'relative p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer',
        selected
          ? 'border-accent bg-accent-muted text-accent'
          : 'border-border bg-surface text-text-secondary hover:border-border hover:text-text-primary'
      )}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-background" strokeWidth={3} />
        </div>
      )}
      {emoji && <div className="text-2xl mb-2">{emoji}</div>}
      <div className="font-semibold text-sm">{label}</div>
      {desc && <div className="text-xs mt-0.5 opacity-70">{desc}</div>}
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 p-6 border-b border-border">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-background" fill="currentColor" />
        </div>
        <span className="font-black text-lg">
          <span className="text-text-primary">REPX</span>
          <span className="text-accent"> Tracker</span>
        </span>
      </div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-8">
        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <React.Fragment key={step.id}>
                <div className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                  isActive && 'bg-accent text-background',
                  isCompleted && 'bg-accent-muted text-accent',
                  !isActive && !isCompleted && 'text-text-muted'
                )}>
                  {isCompleted ? (
                    <Check className="w-3 h-3" strokeWidth={3} />
                  ) : (
                    <Icon className="w-3 h-3" />
                  )}
                  <span className="hidden sm:block">{step.title}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={cn(
                    'flex-1 h-px',
                    isCompleted ? 'bg-accent' : 'bg-border'
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step content */}
        <div className="flex-1 animate-fade-in">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-text-primary">Basic Information</h2>
                <p className="text-text-secondary mt-1">Help us personalize your experience</p>
              </div>

              <div>
                <label className="label">Unit System</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['metric', 'imperial'] as const).map(unit => (
                    <SelectCard
                      key={unit}
                      selected={data.unitSystem === unit}
                      onClick={() => updateData({ unitSystem: unit })}
                      label={unit === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lbs, ft)'}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Height ({data.unitSystem === 'metric' ? 'cm' : 'ft'})</label>
                  <input
                    type="number"
                    className="input"
                    placeholder={data.unitSystem === 'metric' ? '175' : '5.9'}
                    value={data.height || ''}
                    onChange={e => updateData({ height: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="label">Weight ({data.unitSystem === 'metric' ? 'kg' : 'lbs'})</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="75"
                    value={data.weight || ''}
                    onChange={e => updateData({ weight: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="label">Age</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="25"
                    value={data.age || ''}
                    onChange={e => updateData({ age: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Preferred Language</label>
                <select
                  className="input"
                  value={data.preferredLanguage || 'en'}
                  onChange={e => updateData({ preferredLanguage: e.target.value })}
                >
                  {languages.map(lang => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-text-primary">Your Fitness Goal</h2>
                <p className="text-text-secondary mt-1">What are you primarily working towards?</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {fitnessGoals.map(goal => (
                  <SelectCard
                    key={goal.value}
                    selected={data.fitnessGoal === goal.value}
                    onClick={() => updateData({ fitnessGoal: goal.value })}
                    emoji={goal.emoji}
                    label={goal.label}
                    desc={goal.desc}
                  />
                ))}
              </div>

              <div>
                <label className="label mt-4">Experience Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {experienceLevels.map(level => (
                    <SelectCard
                      key={level.value}
                      selected={data.fitnessExperience === level.value}
                      onClick={() => updateData({ fitnessExperience: level.value })}
                      label={level.label}
                      desc={level.desc}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-text-primary">Workout Preferences</h2>
                <p className="text-text-secondary mt-1">Where and how do you prefer to train?</p>
              </div>

              <div>
                <label className="label">Workout Location</label>
                <div className="grid grid-cols-3 gap-3">
                  {workoutLocations.map(loc => (
                    <SelectCard
                      key={loc.value}
                      selected={data.workoutLocation === loc.value}
                      onClick={() => updateData({ workoutLocation: loc.value })}
                      emoji={loc.emoji}
                      label={loc.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="label">
                  Training Days per Week: <span className="text-accent font-bold">{data.trainingDaysPerWeek}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={data.trainingDaysPerWeek || 4}
                  onChange={e => updateData({ trainingDaysPerWeek: Number(e.target.value) })}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>1 day</span>
                  <span>7 days</span>
                </div>
              </div>

              <div>
                <label className="label">Available Equipment (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {equipmentOptions.map(eq => {
                    const selected = data.availableEquipment?.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleEquipment(eq)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                          selected
                            ? 'bg-accent-muted border-accent text-accent'
                            : 'bg-surface border-border text-text-secondary hover:border-accent/50'
                        )}
                      >
                        {selected && <Check className="w-3 h-3 inline mr-1" />}
                        {eq}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-text-primary">Nutrition Preferences</h2>
                <p className="text-text-secondary mt-1">Help us create the perfect meal plan for you</p>
              </div>

              <div>
                <label className="label">Dietary Preference</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {dietaryOptions.map(diet => (
                    <SelectCard
                      key={diet.value}
                      selected={data.dietaryPreference === diet.value}
                      onClick={() => updateData({ dietaryPreference: diet.value })}
                      emoji={diet.emoji}
                      label={diet.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Food Allergies / Intolerances (optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., gluten, dairy, nuts (comma separated)"
                  value={data.foodAllergies || ''}
                  onChange={e => updateData({ foodAllergies: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Monthly Meal Budget (optional, USD)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g., 300"
                  value={data.mealBudget || ''}
                  onChange={e => updateData({ mealBudget: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-border mt-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Back
          </Button>

          <div className="flex gap-1.5">
            {steps.map(step => (
              <div
                key={step.id}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  step.id === currentStep ? 'w-6 bg-accent' : step.id < currentStep ? 'bg-accent' : 'bg-border'
                )}
              />
            ))}
          </div>

          {currentStep < 4 ? (
            <Button onClick={handleNext} rightIcon={<ChevronRight className="w-4 h-4" />}>
              Next
            </Button>
          ) : (
            <Button onClick={handleComplete} isLoading={isLoading} id="onboarding-complete">
              Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
