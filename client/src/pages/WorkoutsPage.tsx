import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, Control, UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { format } from 'date-fns';
import {
  Plus, Dumbbell, Clock, Flame, ChevronDown, ChevronUp, Trash2, Edit,
  Search, Star, MapPin, X, Check, TrendingUp, MessageSquare, Play, Pause,
  RotateCcw, Calendar, Zap, Layers, Sparkles, SlidersHorizontal
} from 'lucide-react';
import { workoutApi, splitApi, getErrorMessage } from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { WorkoutCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { formatDuration, getWorkoutTypeColor, capitalize, formatRelativeDate, cn } from '../lib/utils';
import type { Workout, Exercise, Split, SplitDay } from '../types';
import CreateSplitModal from '../components/workouts/CreateSplitModal';
import ManageSplitsModal from '../components/workouts/ManageSplitsModal';

const workoutTypes = ['strength', 'cardio', 'hiit', 'yoga', 'sports', 'other'];

const POPULAR_EXERCISES = [
  'Arnold Press',
  'Barbell Bicep Curl',
  'Barbell Deadlift',
  'Barbell Row',
  'Barbell Squat',
  'Bench Press',
  'Bulgarian Split Squat',
  'Cable Crossover',
  'Cable Crunch',
  'Calf Raise',
  'Chest Dip',
  'Dumbbell Fly',
  'Dumbbell Hammer Curl',
  'Dumbbell Lateral Raise',
  'Face Pull',
  'Front Squat',
  'Goblet Squat',
  'Hack Squat',
  'Hamstring Curl',
  'Hanging Leg Raise',
  'Hip Thrust',
  'Incline Dumbbell Press',
  'Jump Rope',
  'Lat Pulldown',
  'Leg Extension',
  'Leg Press',
  'Overhead Shoulder Press',
  'Plank',
  'Pull-up',
  'Push-ups',
  'Romanian Deadlift',
  'Rowing Machine',
  'Russian Twist',
  'Seated Cable Row',
  'Skull Crusher',
  'Stationary Bike',
  'Treadmill Run',
  'Tricep Pushdown',
  'Walking Lunges',
];

const formatStopwatch = (totalSeconds: number) => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const calculateWorkoutVolume = (exercises?: Exercise[]): number => {
  if (!exercises) return 0;
  return exercises.reduce((acc, ex) => {
    const exerciseVol = (ex.sets || []).reduce((setAcc, set) => {
      if (set.weight && set.reps) {
        return setAcc + (Number(set.weight) * Number(set.reps));
      }
      return setAcc;
    }, 0);
    return acc + exerciseVol;
  }, 0);
};

const calculateTotalSets = (exercises?: Exercise[]): number => {
  if (!exercises) return 0;
  return exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
};

interface ExerciseFormItemProps {
  exerciseIndex: number;
  control: Control<any>;
  register: UseFormRegister<any>;
  removeExercise: (index: number) => void;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

const ExerciseFormItem: React.FC<ExerciseFormItemProps> = ({
  exerciseIndex,
  control,
  register,
  removeExercise,
  watch,
  setValue,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `exercises.${exerciseIndex}.sets`,
  });

  const category = watch(`exercises.${exerciseIndex}.category`) || 'strength';
  const isCardio = category === 'cardio';

  const handleAddSet = () => {
    const currentSets = watch(`exercises.${exerciseIndex}.sets`) || [];
    const lastSet = currentSets[currentSets.length - 1];
    append({
      setNumber: fields.length + 1,
      reps: lastSet?.reps ?? 10,
      weight: lastSet?.weight ?? 0,
      duration: lastSet?.duration ?? 15,
      distance: lastSet?.distance ?? 2,
      completed: true,
    });
  };

  return (
    <div className="bg-surface/90 rounded-2xl p-4 border border-border shadow-sm space-y-3.5 transition-all">
      {/* Exercise header */}
      <div className="flex items-start gap-2.5">
        <div className="flex-1 space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <input
                list="popular-exercises"
                className="input py-2 px-3 text-sm font-semibold w-full bg-background"
                placeholder="Exercise name (e.g. Barbell Squat)"
                {...register(`exercises.${exerciseIndex}.name`)}
              />
            </div>
            <select
              className="input py-2 px-3 text-xs w-full sm:w-32 shrink-0 bg-background"
              {...register(`exercises.${exerciseIndex}.category`)}
            >
              <option value="strength">Strength</option>
              <option value="cardio">Cardio</option>
              <option value="flexibility">Flexibility</option>
              <option value="sports">Sports</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => removeExercise(exerciseIndex)}
          className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-xl transition-colors mt-0.5"
          title="Delete exercise"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sets table */}
      <div className="bg-background/80 rounded-xl p-3 border border-border/60">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-text-muted uppercase tracking-wider px-1 pb-2 border-b border-border/40">
          <div className="col-span-2 text-center">Set</div>
          {isCardio ? (
            <>
              <div className="col-span-4 text-center">Time (min)</div>
              <div className="col-span-4 text-center">Distance (km)</div>
            </>
          ) : (
            <>
              <div className="col-span-4 text-center">Weight (kg)</div>
              <div className="col-span-4 text-center">Reps</div>
            </>
          )}
          <div className="col-span-2 text-center">Done</div>
        </div>

        {/* Sets list */}
        <div className="space-y-2 pt-2.5">
          {fields.map((field, sIdx) => {
            const isCompleted = watch(`exercises.${exerciseIndex}.sets.${sIdx}.completed`);
            return (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                {/* Set number badge */}
                <div className="col-span-2 flex items-center justify-center">
                  <span className="w-6 h-6 rounded-lg bg-surface border border-border flex items-center justify-center text-xs font-bold text-text-secondary">
                    {sIdx + 1}
                  </span>
                </div>

                {isCardio ? (
                  <>
                    <div className="col-span-4">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="min"
                        className="input py-1.5 px-2 text-center text-xs w-full bg-surface"
                        {...register(`exercises.${exerciseIndex}.sets.${sIdx}.duration`, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="km"
                        className="input py-1.5 px-2 text-center text-xs w-full bg-surface"
                        {...register(`exercises.${exerciseIndex}.sets.${sIdx}.distance`, { valueAsNumber: true })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-4">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0 kg"
                        className="input py-1.5 px-2 text-center text-xs w-full bg-surface font-semibold"
                        {...register(`exercises.${exerciseIndex}.sets.${sIdx}.weight`, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="0 reps"
                        className="input py-1.5 px-2 text-center text-xs w-full bg-surface font-semibold"
                        {...register(`exercises.${exerciseIndex}.sets.${sIdx}.reps`, { valueAsNumber: true })}
                      />
                    </div>
                  </>
                )}

                {/* Completed toggle & delete */}
                <div className="col-span-2 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => setValue(`exercises.${exerciseIndex}.sets.${sIdx}.completed`, !isCompleted)}
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center transition-all border',
                      isCompleted
                        ? 'bg-accent/20 border-accent/60 text-accent hover:bg-accent/30'
                        : 'bg-surface border-border text-text-muted hover:text-text-primary'
                    )}
                    title={isCompleted ? 'Completed' : 'Mark as completed'}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(sIdx)}
                      className="p-1 text-text-muted hover:text-error transition-colors"
                      title="Remove set"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Set Button */}
        <div className="mt-3 pt-2 border-t border-border/40 flex justify-between items-center px-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2.5 text-accent hover:text-accent hover:bg-accent/10"
            leftIcon={<Plus className="w-3 h-3" />}
            onClick={handleAddSet}
          >
            Add Set
          </Button>
          <span className="text-[11px] text-text-muted">
            {fields.length} {fields.length === 1 ? 'set' : 'sets'}
          </span>
        </div>
      </div>
    </div>
  );
};

const WorkoutsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());

  // Splits State & Modals
  const [isCreateSplitModalOpen, setIsCreateSplitModalOpen] = useState(false);
  const [isManageSplitsModalOpen, setIsManageSplitsModalOpen] = useState(false);
  const [editingSplit, setEditingSplit] = useState<Split | null>(null);

  // Quick edit duration state on workout cards
  const [quickEditingDuration, setQuickEditingDuration] = useState<{ id: string; minutes: number } | null>(null);

  // Live Workout Timer State
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedRef = useRef<number>(0);

  // Fetch Workouts
  const { data, isLoading } = useQuery({
    queryKey: ['workouts', searchQuery, selectedType],
    queryFn: () => workoutApi.getAll({
      limit: 50,
      type: selectedType || undefined,
    }).then(r => r.data.data as Workout[]),
  });

  // Fetch Workout Stats
  const { data: stats } = useQuery({
    queryKey: ['workout-stats'],
    queryFn: () => workoutApi.getStats().then(r => r.data.data),
  });

  // Fetch Splits
  const { data: splitsData = [], refetch: refetchSplits } = useQuery({
    queryKey: ['splits'],
    queryFn: () => splitApi.getAll().then(r => r.data.data as Split[]),
  });

  const activeSplit = splitsData.find(s => s.isActive) || splitsData[0];

  // Workout Mutations
  const createMutation = useMutation({
    mutationFn: workoutApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workout-stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      success('Workout logged!', 'Great session, keep it up!');
      setIsModalOpen(false);
      setIsTimerActive(false);
      reset();
    },
    onError: (err) => toastError('Failed to log workout', getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => workoutApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workout-stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      success('Workout updated!');
      setIsModalOpen(false);
      setIsTimerActive(false);
      setEditingWorkout(null);
    },
    onError: (err) => toastError('Failed to update', getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: workoutApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workout-stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      success('Workout deleted');
      setDeleteConfirm(null);
    },
    onError: (err) => toastError('Failed to delete', getErrorMessage(err)),
  });

  // Split Mutations
  const createSplitMutation = useMutation({
    mutationFn: splitApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits'] });
      success('Custom split created!', 'Your new workout routine is ready.');
      setIsCreateSplitModalOpen(false);
      setEditingSplit(null);
    },
    onError: (err) => toastError('Failed to create split', getErrorMessage(err)),
  });

  const updateSplitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => splitApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits'] });
      success('Split updated!');
      setIsCreateSplitModalOpen(false);
      setEditingSplit(null);
    },
    onError: (err) => toastError('Failed to update split', getErrorMessage(err)),
  });

  const activateSplitMutation = useMutation({
    mutationFn: splitApi.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits'] });
      success('Active split updated!');
    },
    onError: (err) => toastError('Failed to activate split', getErrorMessage(err)),
  });

  const deleteSplitMutation = useMutation({
    mutationFn: splitApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits'] });
      success('Custom split deleted');
    },
    onError: (err) => toastError('Failed to delete split', getErrorMessage(err)),
  });

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      type: 'strength',
      duration: 45,
      caloriesBurned: undefined as number | undefined,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      notes: '',
      location: 'gym',
      rating: undefined as number | undefined,
      exercises: [] as any[],
    },
  });

  const watchDuration = watch('duration');

  const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({
    control,
    name: 'exercises',
  });

  // Helper to change duration and sync timer display simultaneously
  const handleDurationChange = (newMinutes: number) => {
    const mins = Math.max(1, Math.round(newMinutes));
    setValue('duration', mins);
    const secs = mins * 60;
    accumulatedRef.current = secs;
    startTimeRef.current = isTimerActive ? Date.now() : null;
    setTimerSeconds(secs);
  };

  const adjustTimerMinutes = (deltaMinutes: number) => {
    const currentMins = Number(watchDuration) || (timerSeconds > 0 ? Math.ceil(timerSeconds / 60) : 45);
    const nextMins = Math.max(1, currentMins + deltaMinutes);
    handleDurationChange(nextMins);
  };

  // Accurate drift-free stopwatch timer effect
  useEffect(() => {
    if (isTimerActive) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000) + accumulatedRef.current;
          setTimerSeconds(currentElapsed);
          const calculatedMinutes = Math.max(1, Math.ceil(currentElapsed / 60));
          setValue('duration', calculatedMinutes);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerActive, setValue]);

  const toggleTimer = () => {
    if (isTimerActive) {
      if (startTimeRef.current) {
        accumulatedRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
      }
      setIsTimerActive(false);
    } else {
      startTimeRef.current = Date.now();
      setIsTimerActive(true);
    }
  };

  const resetTimer = () => {
    setIsTimerActive(false);
    accumulatedRef.current = 0;
    startTimeRef.current = null;
    setTimerSeconds(0);
    setValue('duration', 0);
  };

  const openCreate = () => {
    setEditingWorkout(null);

    accumulatedRef.current = 0;
    startTimeRef.current = Date.now();
    setTimerSeconds(0);
    setIsTimerActive(true);

    reset({
      title: '',
      type: 'strength',
      duration: 45,
      caloriesBurned: undefined,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      notes: '',
      location: 'gym',
      rating: undefined,
      exercises: [{
        name: '',
        category: 'strength',
        muscleGroups: [],
        notes: '',
        sets: [{ setNumber: 1, reps: 10, weight: 0, completed: true }],
      }],
    });
    setIsModalOpen(true);
  };

  // Launch Workout Logger pre-loaded with a Split Day's exercises
  const startWorkoutFromSplitDay = (day: SplitDay) => {
    setEditingWorkout(null);
    accumulatedRef.current = 0;
    startTimeRef.current = Date.now();
    setTimerSeconds(0);
    setIsTimerActive(true);

    const prefilledExercises = (day.exercises && day.exercises.length > 0)
      ? day.exercises.map(ex => {
          let defaultReps = 10;
          if (typeof ex.reps === 'number') {
            defaultReps = ex.reps;
          } else if (typeof ex.reps === 'string') {
            const match = ex.reps.match(/\d+/);
            if (match) defaultReps = parseInt(match[0], 10);
          } else if (ex.targetReps) {
            defaultReps = ex.targetReps;
          }

          const numSets = ex.sets || ex.targetSets || 3;

          return {
            name: ex.name,
            category: ex.category || 'strength',
            muscleGroups: ex.muscleGroup ? [ex.muscleGroup] : (day.muscleGroups || day.targetMuscleGroups || []),
            notes: typeof ex.reps === 'string' ? `Target: ${ex.reps} reps` : '',
            sets: Array.from({ length: numSets }).map((_, i) => ({
              setNumber: i + 1,
              reps: defaultReps,
              weight: ex.targetWeight || 0,
              completed: true,
            })),
          };
        })
      : [{
          name: '',
          category: 'strength',
          muscleGroups: [],
          notes: '',
          sets: [{ setNumber: 1, reps: 10, weight: 0, completed: true }],
        }];

    reset({
      title: day.name,
      type: day.type === 'rest' ? 'other' : day.type,
      duration: 45,
      caloriesBurned: undefined,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      notes: day.notes || '',
      location: 'gym',
      rating: undefined,
      exercises: prefilledExercises,
    });

    setIsModalOpen(true);
  };

  const openEdit = (workout: Workout) => {
    setEditingWorkout(workout);

    const savedDuration = workout.duration || 45;
    const savedDurationSecs = savedDuration * 60;
    accumulatedRef.current = savedDurationSecs;
    setTimerSeconds(savedDurationSecs);
    setIsTimerActive(false);

    const workoutDate = new Date(workout.date);
    const isValidDate = !isNaN(workoutDate.getTime());

    reset({
      title: workout.title,
      type: workout.type,
      duration: savedDuration,
      caloriesBurned: workout.caloriesBurned,
      date: isValidDate ? format(workoutDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      time: isValidDate ? format(workoutDate, 'HH:mm') : format(new Date(), 'HH:mm'),
      notes: workout.notes || '',
      location: workout.location || 'gym',
      rating: workout.rating,
      exercises: workout.exercises && workout.exercises.length > 0
        ? workout.exercises.map(e => ({
            name: e.name || '',
            category: e.category || 'strength',
            muscleGroups: e.muscleGroups || [],
            notes: e.notes || '',
            sets: e.sets && e.sets.length > 0
              ? e.sets.map((s, idx) => ({
                  setNumber: s.setNumber || idx + 1,
                  reps: s.reps ?? 10,
                  weight: s.weight ?? 0,
                  duration: s.duration,
                  distance: s.distance,
                  completed: s.completed ?? true,
                }))
              : [{ setNumber: 1, reps: 10, weight: 0, completed: true }],
          }))
        : [{
            name: '',
            category: 'strength',
            muscleGroups: [],
            notes: '',
            sets: [{ setNumber: 1, reps: 10, weight: 0, completed: true }],
          }],
    });
    setIsModalOpen(true);
  };

  const onSubmit = (formData: any) => {
    const cleanedExercises = (formData.exercises || [])
      .filter((ex: any) => ex.name && ex.name.trim().length > 0)
      .map((ex: any) => ({
        name: ex.name.trim(),
        category: ex.category || 'strength',
        muscleGroups: ex.muscleGroups || [],
        notes: ex.notes || '',
        sets: (ex.sets || []).map((s: any, idx: number) => ({
          setNumber: idx + 1,
          reps: s.reps !== undefined && s.reps !== '' ? Number(s.reps) : undefined,
          weight: s.weight !== undefined && s.weight !== '' ? Number(s.weight) : undefined,
          duration: s.duration !== undefined && s.duration !== '' ? Number(s.duration) : undefined,
          distance: s.distance !== undefined && s.distance !== '' ? Number(s.distance) : undefined,
          completed: s.completed !== undefined ? Boolean(s.completed) : true,
        })),
      }));

    // Prioritize user entered/edited duration from the form input, fallback to timer
    const formDuration = Number(formData.duration);
    const finalDuration = !isNaN(formDuration) && formDuration > 0
      ? formDuration
      : (timerSeconds > 0 ? Math.max(1, Math.ceil(timerSeconds / 60)) : 45);

    // Combine date and time
    let finalDate = new Date();
    if (formData.date) {
      const timePart = formData.time && String(formData.time).trim().length > 0
        ? String(formData.time).trim()
        : format(new Date(), 'HH:mm');
      const combined = new Date(`${formData.date}T${timePart}:00`);
      if (!isNaN(combined.getTime())) {
        finalDate = combined;
      } else {
        finalDate = new Date(formData.date);
      }
    }

    const payload: any = {
      ...formData,
      title: formData.title.trim(),
      date: finalDate.toISOString(),
      duration: finalDuration,
      caloriesBurned: formData.caloriesBurned ? Number(formData.caloriesBurned) : undefined,
      rating: formData.rating ? Number(formData.rating) : undefined,
      exercises: cleanedExercises,
    };
    delete payload.time;

    setIsTimerActive(false);

    if (editingWorkout) {
      updateMutation.mutate({ id: editingWorkout._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleCardExpand = (id: string) => {
    setExpandedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveCustomSplit = (splitData: any) => {
    if (editingSplit) {
      updateSplitMutation.mutate({ id: editingSplit._id, data: splitData });
    } else {
      createSplitMutation.mutate(splitData);
    }
  };

  const filtered = data?.filter(w =>
    !searchQuery || w.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Datalist for popular exercise autocomplete */}
      <datalist id="popular-exercises">
        {POPULAR_EXERCISES.map(ex => (
          <option key={ex} value={ex} />
        ))}
      </datalist>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary">Workouts</h1>
          <p className="text-sm text-text-secondary mt-0.5">Track and manage your training sessions and custom splits</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {isTimerActive && !isModalOpen && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-accent/15 border border-accent/40 text-accent px-3 py-1.5 rounded-xl text-xs font-bold animate-pulse hover:bg-accent/25 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <span>Active: {formatStopwatch(timerSeconds)}</span>
            </button>
          )}

          <Button
            variant="secondary"
            onClick={() => {
              setEditingSplit(null);
              setIsCreateSplitModalOpen(true);
            }}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
          >
            Create Split
          </Button>

          <Button
            variant="secondary"
            onClick={() => setIsManageSplitsModalOpen(true)}
            leftIcon={<Layers className="w-3.5 h-3.5" />}
          >
            Splits
          </Button>

          <Button onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />} id="log-workout-btn">
            Log Workout
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Workouts', value: stats.totalWorkouts },
            { label: 'Last 30 Days', value: stats.workoutsLast30Days },
            { label: 'Total Time', value: formatDuration(stats.totalMinutes || 0) },
            { label: 'Calories Burned', value: `${Math.round(stats.totalCaloriesBurned || 0)} kcal` },
          ].map(s => (
            <Card key={s.label} padding="sm">
              <div className="text-xl font-black text-text-primary">{s.value}</div>
              <div className="text-xs text-text-muted mt-0.5">{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Active Training Split Showcase Banner */}
      {activeSplit && (
        <div className="card p-5 bg-gradient-to-br from-surface via-card to-card border border-accent/30 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/40 text-accent flex items-center justify-center">
                <Zap className="w-5 h-5 fill-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-text-primary">
                    Active Split: {activeSplit.name}
                  </h3>
                  {activeSplit.level && (
                    <span className={cn(
                      "badge text-[10px] font-bold uppercase px-2 py-0.5",
                      activeSplit.level === 'beginner' && "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
                      activeSplit.level === 'intermediate' && "bg-blue-500/15 text-blue-400 border border-blue-500/30",
                      activeSplit.level === 'advanced' && "bg-purple-500/15 text-purple-400 border border-purple-500/30",
                      activeSplit.level === 'pro' && "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    )}>
                      {activeSplit.level}
                    </span>
                  )}
                  <span className="badge bg-accent-muted text-accent font-bold text-[10px] px-2 py-0.5">
                    {activeSplit.daysPerWeek || activeSplit.days?.length || 4} DAYS/WEEK
                  </span>
                </div>
                {activeSplit.description && (
                  <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{activeSplit.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-accent hover:bg-accent/10"
                onClick={() => setIsManageSplitsModalOpen(true)}
              >
                Switch Split
              </Button>
            </div>
          </div>

          {/* Routine Days Grid / Carousel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {(activeSplit.days || []).map((day, dIdx) => (
              <div
                key={dIdx}
                className="bg-surface/90 rounded-2xl p-3.5 border border-border/70 hover:border-accent/40 transition-all flex flex-col justify-between group/day shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                      Day {dIdx + 1}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {day.type === 'rest' ? 'Rest' : `${day.exercises?.length || 0} exercises`}
                    </span>
                  </div>

                  <h4 className="font-bold text-text-primary text-sm mt-1">{day.name}</h4>

                  {((day.targetMuscleGroups && day.targetMuscleGroups.length > 0) || (day.muscleGroups && day.muscleGroups.length > 0)) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(day.muscleGroups || day.targetMuscleGroups || []).map(muscle => (
                        <span key={muscle} className="text-[10px] bg-background text-text-muted px-1.5 py-0.5 rounded border border-border">
                          {muscle}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Exercises mini-list preview */}
                  {day.exercises && day.exercises.length > 0 && (
                    <div className="mt-2.5 space-y-1.5 text-[11px] text-text-muted">
                      {day.exercises.slice(0, 4).map((ex, eIdx) => (
                        <div key={eIdx} className="truncate text-text-secondary flex items-center justify-between gap-1">
                          <span className="truncate flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-accent/60 shrink-0" />
                            <span className="truncate" title={ex.name}>{ex.name}</span>
                          </span>
                          <span className="text-text-muted font-mono text-[10px] shrink-0">
                            {ex.sets ?? ex.targetSets ?? 3}×{ex.reps ?? ex.targetReps ?? 10}
                          </span>
                        </div>
                      ))}
                      {day.exercises.length > 4 && (
                        <p className="text-[10px] text-accent/80 font-medium">+{day.exercises.length - 4} more</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-border/40">
                  {day.type === 'rest' ? (
                    <div className="text-center py-1 text-xs text-text-muted italic">
                      Active Recovery
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full text-xs h-8"
                      leftIcon={<Play className="w-3 h-3 fill-current" />}
                      onClick={() => startWorkoutFromSplitDay(day)}
                    >
                      Start Workout
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            className="input pl-10"
            placeholder="Search logged workouts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="input w-36"
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
        >
          <option value="">All Types</option>
          {workoutTypes.map(t => <option key={t} value={t}>{capitalize(t)}</option>)}
        </select>
      </div>

      {/* Workout History List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            Workout History ({filtered.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <WorkoutCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Dumbbell className="w-8 h-8" />}
            title="No workouts logged yet"
            description="Start logging your workouts or pick a routine from your split above to track your progress."
            action={{ label: 'Log Your First Workout', onClick: openCreate }}
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map(workout => {
              const isExpanded = expandedCardIds.has(workout._id);
              const totalVolume = calculateWorkoutVolume(workout.exercises);
              const totalSets = calculateTotalSets(workout.exercises);
              const hasExercises = workout.exercises && workout.exercises.length > 0;

              return (
                <div
                  key={workout._id}
                  className="card p-5 hover:border-accent/30 hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-text-primary text-base truncate">{workout.title}</h3>
                        <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{formatRelativeDate(workout.date)}</span>
                          <span>•</span>
                          <span>{format(new Date(workout.date), 'MMM d, yyyy')}</span>
                          {(() => {
                            const d = new Date(workout.date);
                            const hasTime = !isNaN(d.getTime()) && (d.getHours() !== 0 || d.getMinutes() !== 0);
                            return hasTime ? (
                              <>
                                <span>•</span>
                                <span className="text-text-secondary font-medium">{format(d, 'h:mm a')}</span>
                              </>
                            ) : null;
                          })()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => openEdit(workout)}
                          className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
                          title="Edit workout"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(workout._id)}
                          className="p-1.5 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                          title="Delete workout"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metrics Bar */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mb-3.5">
                      {quickEditingDuration?.id === workout._id ? (
                        <div className="flex items-center gap-1 bg-surface-elevated/90 p-1 rounded-xl border border-accent/40 shadow-sm animate-in fade-in duration-150">
                          <Clock className="w-3.5 h-3.5 text-accent ml-1" />
                          <button
                            type="button"
                            onClick={() => setQuickEditingDuration(prev => prev ? { ...prev, minutes: Math.max(1, prev.minutes - 5) } : null)}
                            className="w-5 h-5 rounded flex items-center justify-center bg-background border border-border text-text-muted hover:text-text-primary text-xs font-bold"
                            title="-5 minutes"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={quickEditingDuration.minutes}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) {
                                setQuickEditingDuration(prev => prev ? { ...prev, minutes: Math.max(1, val) } : null);
                              }
                            }}
                            className="w-12 text-center text-xs font-bold bg-background border border-border rounded py-0.5 text-text-primary"
                          />
                          <span className="text-[10px] text-text-muted font-medium">m</span>
                          <button
                            type="button"
                            onClick={() => setQuickEditingDuration(prev => prev ? { ...prev, minutes: prev.minutes + 5 } : null)}
                            className="w-5 h-5 rounded flex items-center justify-center bg-background border border-border text-text-muted hover:text-text-primary text-xs font-bold"
                            title="+5 minutes"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (quickEditingDuration.minutes > 0) {
                                updateMutation.mutate({
                                  id: workout._id,
                                  data: { duration: quickEditingDuration.minutes }
                                });
                                setQuickEditingDuration(null);
                              }
                            }}
                            className="p-1 rounded bg-accent text-background hover:bg-accent/90 transition-colors ml-0.5"
                            title="Save workout duration"
                          >
                            <Check className="w-3 h-3 font-bold" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickEditingDuration(null)}
                            className="p-1 rounded bg-background hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setQuickEditingDuration({ id: workout._id, minutes: workout.duration || 45 })}
                          className="flex items-center gap-1.5 bg-surface hover:bg-accent/10 hover:border-accent/40 transition-all px-2.5 py-1 rounded-lg border border-border/50 text-text-muted hover:text-accent group/dur"
                          title="Click to quickly edit workout duration"
                        >
                          <Clock className="w-3.5 h-3.5 text-accent" />
                          <span className="font-semibold text-text-secondary group-hover/dur:text-accent">
                            {formatDuration(workout.duration)}
                          </span>
                          <Edit className="w-2.5 h-2.5 text-accent opacity-0 group-hover/dur:opacity-100 transition-opacity" />
                        </button>
                      )}
                      {workout.caloriesBurned ? (
                        <span className="flex items-center gap-1 bg-surface px-2.5 py-1 rounded-lg border border-border/50">
                          <Flame className="w-3.5 h-3.5 text-warning" /> {workout.caloriesBurned} kcal
                        </span>
                      ) : null}
                      {workout.location && (
                        <span className="flex items-center gap-1 bg-surface px-2.5 py-1 rounded-lg border border-border/50">
                          <MapPin className="w-3.5 h-3.5 text-info" /> {capitalize(workout.location)}
                        </span>
                      )}
                      {totalVolume > 0 && (
                        <span className="flex items-center gap-1 bg-accent/10 text-accent font-semibold px-2.5 py-1 rounded-lg border border-accent/20">
                          <TrendingUp className="w-3.5 h-3.5" /> {totalVolume.toLocaleString()} kg volume
                        </span>
                      )}
                    </div>

                    {/* Exercises Breakdown */}
                    {hasExercises ? (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                        <div className="flex items-center justify-between text-xs text-text-secondary font-medium mb-1">
                          <span className="flex items-center gap-1.5">
                            <Dumbbell className="w-3.5 h-3.5 text-accent" />
                            {workout.exercises.length} {workout.exercises.length === 1 ? 'Exercise' : 'Exercises'}
                            <span className="text-text-muted font-normal">({totalSets} sets)</span>
                          </span>
                          {workout.exercises.length > 2 && (
                            <button
                              type="button"
                              onClick={() => toggleCardExpand(workout._id)}
                              className="text-accent hover:underline flex items-center gap-0.5 text-xs font-semibold"
                            >
                              {isExpanded ? 'Show less' : `+${workout.exercises.length - 2} more`}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>

                        {/* List of exercises */}
                        <div className="space-y-2">
                          {(isExpanded ? workout.exercises : workout.exercises.slice(0, 2)).map((ex, exIdx) => (
                            <div key={exIdx} className="bg-surface/80 rounded-xl p-2.5 border border-border/60 text-xs">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-text-primary">{ex.name}</span>
                                <span className="text-[11px] text-text-muted bg-background px-2 py-0.5 rounded-full border border-border">
                                  {ex.sets?.length || 0} {ex.sets?.length === 1 ? 'set' : 'sets'}
                                </span>
                              </div>

                              {/* Sets chips */}
                              {ex.sets && ex.sets.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {ex.sets.map((set, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className={cn(
                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]',
                                        set.completed
                                          ? 'bg-background border border-border text-text-secondary'
                                          : 'bg-background/50 border border-border/40 text-text-muted'
                                      )}
                                    >
                                      <span className="text-text-muted font-mono text-[10px]">#{sIdx + 1}</span>
                                      {ex.category === 'cardio' ? (
                                        <span>{set.duration ? `${set.duration}m` : ''} {set.distance ? `(${set.distance}km)` : ''}</span>
                                      ) : (
                                        <span className="font-semibold text-text-primary">
                                          {set.weight ? `${set.weight}kg` : 'BW'} × {set.reps || 0}
                                        </span>
                                      )}
                                      {set.completed && <Check className="w-2.5 h-2.5 text-accent" />}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <button
                          onClick={() => openEdit(workout)}
                          className="w-full py-2.5 px-3 rounded-xl border border-dashed border-border hover:border-accent/50 text-xs text-text-muted hover:text-accent transition-all flex items-center justify-center gap-1.5 group/btn"
                        >
                          <Plus className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                          <span>Add exercises to this workout</span>
                        </button>
                      </div>
                    )}

                    {/* Notes */}
                    {workout.notes && (
                      <div className="mt-3 pt-2 text-xs text-text-muted italic flex items-start gap-1.5 bg-background/50 p-2 rounded-lg border border-border/40">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 text-text-muted mt-0.5" />
                        <span className="line-clamp-2">{workout.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                    <span className={cn('badge text-xs font-semibold', getWorkoutTypeColor(workout.type))}>
                      {capitalize(workout.type)}
                    </span>
                    {workout.rating && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: workout.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-accent fill-accent" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Active Workout Pill when modal is closed but timer is running */}
      {isTimerActive && !isModalOpen && (
        <div className="fixed bottom-6 right-6 z-50 bg-card/95 backdrop-blur-md border border-accent/40 shadow-2xl rounded-2xl p-4 flex items-center gap-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="w-3 h-3 rounded-full bg-accent block animate-pulse" />
              <span className="w-3 h-3 rounded-full bg-accent absolute inset-0 animate-ping opacity-75" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Workout In Progress</p>
              <p className="text-xl font-black font-mono text-accent">{formatStopwatch(timerSeconds)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              Return to Workout
            </Button>
          </div>
        </div>
      )}

      {/* Log/Edit Workout Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); }}
        title={editingWorkout ? 'Edit Workout' : 'Log Workout'}
        size="2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="workout-form">
          {/* Live Workout Timer Stopwatch Banner */}
          <div className="bg-gradient-to-r from-accent/15 via-surface to-surface border border-accent/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center border transition-all",
                  isTimerActive
                    ? "bg-accent/20 border-accent/50 text-accent shadow-sm"
                    : "bg-surface border-border text-text-muted"
                )}>
                  <Clock className={cn("w-6 h-6", isTimerActive && "animate-pulse")} />
                </div>
                {isTimerActive && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent rounded-full animate-ping opacity-80" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    {editingWorkout ? 'Session Stopwatch' : 'Workout Live Timer'}
                  </span>
                  <span className={cn(
                    "badge text-[10px] px-2 py-0.5",
                    isTimerActive ? "bg-accent-muted text-accent font-bold" : "bg-surface text-text-muted"
                  )}>
                    {isTimerActive ? '● Recording' : 'Paused'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <span className="text-3xl font-black font-mono tracking-wider text-text-primary">
                    {formatStopwatch(timerSeconds)}
                  </span>
                  <span className="text-xs text-text-muted">
                    ({Math.max(1, Math.ceil(timerSeconds / 60))} min calculated)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
              <div className="flex items-center gap-1 bg-surface/80 p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => adjustTimerMinutes(-15)}
                  className="px-2 py-1 text-xs font-semibold rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                  title="Subtract 15 minutes"
                >
                  -15m
                </button>
                <button
                  type="button"
                  onClick={() => adjustTimerMinutes(-5)}
                  className="px-2 py-1 text-xs font-semibold rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                  title="Subtract 5 minutes"
                >
                  -5m
                </button>
                <button
                  type="button"
                  onClick={() => adjustTimerMinutes(5)}
                  className="px-2 py-1 text-xs font-semibold rounded-lg text-text-muted hover:text-accent hover:bg-surface-elevated transition-colors"
                  title="Add 5 minutes"
                >
                  +5m
                </button>
                <button
                  type="button"
                  onClick={() => adjustTimerMinutes(15)}
                  className="px-2 py-1 text-xs font-semibold rounded-lg text-text-muted hover:text-accent hover:bg-surface-elevated transition-colors"
                  title="Add 15 minutes"
                >
                  +15m
                </button>
              </div>

              <Button
                type="button"
                size="sm"
                variant={isTimerActive ? "secondary" : "primary"}
                onClick={toggleTimer}
                leftIcon={isTimerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              >
                {isTimerActive ? 'Pause' : 'Resume'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={resetTimer}
                title="Reset timer to 00:00"
              >
                <RotateCcw className="w-4 h-4 text-text-muted hover:text-text-primary" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2">
              <Input
                label="Workout Title"
                placeholder="e.g., Morning Push Day"
                required
                {...register('title', { required: 'Title is required' })}
                error={errors.title?.message as string}
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" {...register('type')}>
                {workoutTypes.map(t => <option key={t} value={t}>{capitalize(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Location</label>
              <select className="input" {...register('location')}>
                <option value="gym">Gym</option>
                <option value="home">Home</option>
                <option value="outdoor">Outdoor</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Workout Date</label>
              <input type="date" className="input" {...register('date')} />
            </div>
            <div>
              <label className="label">Start Time</label>
              <input type="time" className="input" {...register('time')} />
            </div>

            {/* Duration (minutes) with Quick Presets */}
            <div className="col-span-1 sm:col-span-2 bg-surface/40 p-3.5 rounded-xl border border-border">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <label className="label mb-0">Workout Duration (minutes)</label>
                  {isTimerActive && (
                    <span className="text-[10px] text-accent font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      Live timer syncing
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-text-muted font-medium">Quick Presets:</span>
                  {[20, 30, 45, 60, 75, 90].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleDurationChange(mins)}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-xs font-bold transition-all border",
                        Number(watchDuration) === mins
                          ? "bg-accent text-background border-accent shadow-sm"
                          : "bg-surface text-text-muted border-border hover:border-accent/40 hover:text-text-primary"
                      )}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
              <Input
                type="number"
                min="1"
                max="1440"
                placeholder="Duration in minutes (e.g. 45)"
                leftIcon={<Clock className="w-4 h-4 text-accent" />}
                {...register('duration', {
                  valueAsNumber: true,
                  onChange: (e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val > 0) {
                      const secs = val * 60;
                      setTimerSeconds(secs);
                      accumulatedRef.current = secs;
                    }
                  }
                })}
              />
            </div>

            <div>
              <Input
                label="Calories Burned (optional)"
                type="number"
                leftIcon={<Flame className="w-4 h-4" />}
                {...register('caloriesBurned', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="label">Rating (optional)</label>
              <select className="input" {...register('rating', { valueAsNumber: true })}>
                <option value="">No rating</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
              </select>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="label">Notes (optional)</label>
              <textarea
                className="input min-h-[70px] resize-none"
                placeholder="How did the session feel? Any PRs?"
                {...register('notes')}
              />
            </div>
          </div>

          {/* Exercises Section */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <label className="label mb-0 text-text-primary font-bold">Exercises & Sets</label>
                <p className="text-xs text-text-muted">Log your exercises, sets, weights, and reps</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => appendExercise({
                  name: '',
                  category: 'strength',
                  muscleGroups: [],
                  notes: '',
                  sets: [{ setNumber: 1, reps: 10, weight: 0, completed: true }],
                })}
              >
                Add Exercise
              </Button>
            </div>

            {exerciseFields.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border rounded-2xl bg-surface/30">
                <Dumbbell className="w-6 h-6 text-text-muted mx-auto mb-1.5" />
                <p className="text-xs text-text-secondary font-medium">No exercises added yet</p>
                <p className="text-[11px] text-text-muted mt-0.5">Click "Add Exercise" to log sets and reps</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {exerciseFields.map((field, eIdx) => (
                  <ExerciseFormItem
                    key={field.id}
                    exerciseIndex={eIdx}
                    control={control}
                    register={register}
                    removeExercise={removeExercise}
                    watch={watch}
                    setValue={setValue}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Modal Action Buttons */}
          <div className="flex gap-3 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setIsModalOpen(false);
                setIsTimerActive(false);
                setEditingWorkout(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isMutating} id="workout-submit">
              {editingWorkout ? 'Update Workout' : 'Finish & Log Workout'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create / Edit Custom Split Modal */}
      <CreateSplitModal
        isOpen={isCreateSplitModalOpen}
        onClose={() => {
          setIsCreateSplitModalOpen(false);
          setEditingSplit(null);
        }}
        onSave={handleSaveCustomSplit}
        isLoading={createSplitMutation.isPending || updateSplitMutation.isPending}
        initialSplit={editingSplit}
      />

      {/* Manage / Switch Splits Modal */}
      <ManageSplitsModal
        isOpen={isManageSplitsModalOpen}
        onClose={() => setIsManageSplitsModalOpen(false)}
        splits={splitsData}
        onActivate={(id) => activateSplitMutation.mutate(id)}
        onEdit={(split) => {
          setEditingSplit(split);
          setIsCreateSplitModalOpen(true);
        }}
        onDelete={(id) => deleteSplitMutation.mutate(id)}
        onCreateNew={() => {
          setEditingSplit(null);
          setIsCreateSplitModalOpen(true);
        }}
        isActivating={activateSplitMutation.isPending}
      />

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Workout"
        description="This action cannot be undone."
        size="sm"
      >
        <div className="flex gap-3 mt-2">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default WorkoutsPage;
