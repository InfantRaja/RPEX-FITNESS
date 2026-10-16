import React, { useState } from 'react';
import { Plus, Trash2, Dumbbell, Sparkles, X, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { cn } from '../../lib/utils';
import type { Split, SplitDay } from '../../types';

interface CreateSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (splitData: any) => void;
  isLoading?: boolean;
  initialSplit?: Split | null;
}

const MUSCLE_GROUP_OPTIONS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Full Body'
];

export const CreateSplitModal: React.FC<CreateSplitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
  initialSplit,
}) => {
  const [name, setName] = useState(initialSplit?.name || '');
  const [description, setDescription] = useState(initialSplit?.description || '');
  const [daysPerWeek, setDaysPerWeek] = useState(initialSplit?.daysPerWeek || 4);
  const [setAsActive, setSetAsActive] = useState(true);

  const [days, setDays] = useState<SplitDay[]>(() => {
    if (initialSplit?.days && initialSplit.days.length > 0) {
      return initialSplit.days;
    }
    return [
      {
        dayNumber: 1,
        name: 'Day 1: Push',
        type: 'strength',
        targetMuscleGroups: ['Chest', 'Shoulders', 'Triceps'],
        exercises: [
          { name: 'Barbell Bench Press', category: 'strength', targetSets: 4, targetReps: 8, targetWeight: 70 },
          { name: 'Overhead Shoulder Press', category: 'strength', targetSets: 3, targetReps: 10, targetWeight: 40 },
          { name: 'Tricep Pushdown', category: 'strength', targetSets: 3, targetReps: 12, targetWeight: 25 },
        ],
        notes: '',
      },
      {
        dayNumber: 2,
        name: 'Day 2: Pull',
        type: 'strength',
        targetMuscleGroups: ['Back', 'Biceps'],
        exercises: [
          { name: 'Barbell Deadlift', category: 'strength', targetSets: 3, targetReps: 5, targetWeight: 100 },
          { name: 'Lat Pulldown', category: 'strength', targetSets: 3, targetReps: 10, targetWeight: 55 },
          { name: 'Barbell Bicep Curl', category: 'strength', targetSets: 3, targetReps: 12, targetWeight: 25 },
        ],
        notes: '',
      },
      {
        dayNumber: 3,
        name: 'Day 3: Legs',
        type: 'strength',
        targetMuscleGroups: ['Quads', 'Hamstrings', 'Calves'],
        exercises: [
          { name: 'Barbell Squat', category: 'strength', targetSets: 4, targetReps: 8, targetWeight: 80 },
          { name: 'Leg Press', category: 'strength', targetSets: 3, targetReps: 10, targetWeight: 140 },
          { name: 'Calf Raise', category: 'strength', targetSets: 4, targetReps: 15, targetWeight: 50 },
        ],
        notes: '',
      },
      {
        dayNumber: 4,
        name: 'Day 4: Rest & Recovery',
        type: 'rest',
        targetMuscleGroups: [],
        exercises: [],
        notes: 'Rest, hydrate, and stretch.',
      },
    ];
  });

  const handleAddDay = () => {
    const nextDayNum = days.length + 1;
    setDays(prev => [
      ...prev,
      {
        dayNumber: nextDayNum,
        name: `Day ${nextDayNum}: Workout`,
        type: 'strength',
        targetMuscleGroups: [],
        exercises: [
          { name: 'Barbell Squat', category: 'strength', targetSets: 3, targetReps: 10, targetWeight: 60 }
        ],
        notes: '',
      },
    ]);
  };

  const handleRemoveDay = (index: number) => {
    if (days.length <= 1) return;
    setDays(prev => prev.filter((_, i) => i !== index).map((d, i) => ({ ...d, dayNumber: i + 1 })));
  };

  const handleUpdateDay = (index: number, updates: Partial<SplitDay>) => {
    setDays(prev => prev.map((d, i) => i === index ? { ...d, ...updates } : d));
  };

  const handleToggleMuscleGroup = (dayIndex: number, muscle: string) => {
    const day = days[dayIndex];
    const current = day.targetMuscleGroups || [];
    const next = current.includes(muscle)
      ? current.filter(m => m !== muscle)
      : [...current, muscle];
    handleUpdateDay(dayIndex, { targetMuscleGroups: next });
  };

  const handleAddExerciseToDay = (dayIndex: number) => {
    const day = days[dayIndex];
    const newEx = { name: '', category: 'strength' as const, targetSets: 3, targetReps: 10, targetWeight: 0 };
    handleUpdateDay(dayIndex, { exercises: [...(day.exercises || []), newEx] });
  };

  const handleUpdateExerciseInDay = (dayIndex: number, exIndex: number, updates: any) => {
    const day = days[dayIndex];
    const nextExercises = (day.exercises || []).map((ex, i) => i === exIndex ? { ...ex, ...updates } : ex);
    handleUpdateDay(dayIndex, { exercises: nextExercises });
  };

  const handleRemoveExerciseFromDay = (dayIndex: number, exIndex: number) => {
    const day = days[dayIndex];
    const nextExercises = (day.exercises || []).filter((_, i) => i !== exIndex);
    handleUpdateDay(dayIndex, { exercises: nextExercises });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Sanitize days & exercises
    const cleanedDays = days.map((d, idx) => ({
      ...d,
      dayNumber: idx + 1,
      name: d.name.trim() || `Day ${idx + 1}`,
      exercises: (d.exercises || [])
        .filter(ex => ex.name && ex.name.trim().length > 0)
        .map(ex => ({
          ...ex,
          name: ex.name.trim(),
          targetSets: Number(ex.targetSets) || 3,
          targetReps: Number(ex.targetReps) || 10,
          targetWeight: Number(ex.targetWeight) || 0,
        })),
    }));

    onSave({
      name: name.trim(),
      description: description.trim(),
      daysPerWeek: Number(daysPerWeek) || cleanedDays.length,
      days: cleanedDays,
      setAsActive,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialSplit ? 'Edit Workout Split' : 'Create Custom Workout Split'}
      description="Design your custom training split, assign days, muscle groups, and planned exercises."
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Split Basic Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2">
            <Input
              label="Split Name"
              placeholder="e.g., 4-Day Hypertrophy, Summer PPL, Arnold Split"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Days Per Week</label>
            <select
              className="input"
              value={daysPerWeek}
              onChange={e => setDaysPerWeek(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7].map(n => (
                <option key={n} value={n}>{n} Days / week</option>
              ))}
            </select>
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={setAsActive}
                onChange={e => setSetAsActive(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
              />
              <span className="text-sm font-semibold text-text-primary">Set as Active Split</span>
            </label>
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label className="label">Description (optional)</label>
            <textarea
              className="input min-h-[60px] resize-none"
              placeholder="e.g., Progressive overload focused routine targeting strength and hypertrophy"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Days Builder Section */}
        <div className="space-y-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Split Days & Routines</h3>
              <p className="text-xs text-text-muted">Configure the sequence of workout and rest days</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddDay}
            >
              Add Day
            </Button>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {days.map((day, dIdx) => (
              <div
                key={dIdx}
                className="bg-surface/80 rounded-2xl p-4 border border-border shadow-sm space-y-3.5 transition-all"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/40 text-accent flex items-center justify-center text-xs font-black">
                      #{dIdx + 1}
                    </span>
                    <input
                      className="input py-1.5 px-3 text-sm font-bold flex-1 bg-background"
                      placeholder="e.g., Push Day, Upper Body, Rest Day"
                      value={day.name}
                      onChange={e => handleUpdateDay(dIdx, { name: e.target.value })}
                      required
                    />
                  </div>

                  <select
                    className="input py-1.5 px-2.5 text-xs w-28 bg-background shrink-0"
                    value={day.type}
                    onChange={e => handleUpdateDay(dIdx, { type: e.target.value as any })}
                  >
                    <option value="strength">Strength</option>
                    <option value="cardio">Cardio</option>
                    <option value="hiit">HIIT</option>
                    <option value="yoga">Yoga</option>
                    <option value="sports">Sports</option>
                    <option value="rest">Rest Day</option>
                    <option value="other">Other</option>
                  </select>

                  {days.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDay(dIdx)}
                      className="p-1.5 text-text-muted hover:text-error rounded-lg hover:bg-error/10 transition-colors"
                      title="Remove day"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Muscle Groups Selection */}
                {day.type !== 'rest' && (
                  <div>
                    <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
                      Target Muscles
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {MUSCLE_GROUP_OPTIONS.map(muscle => {
                        const isSelected = (day.targetMuscleGroups || []).includes(muscle);
                        return (
                          <button
                            key={muscle}
                            type="button"
                            onClick={() => handleToggleMuscleGroup(dIdx, muscle)}
                            className={cn(
                              'px-2 py-0.5 rounded-lg text-xs font-medium border transition-all',
                              isSelected
                                ? 'bg-accent/20 border-accent text-accent'
                                : 'bg-background border-border text-text-muted hover:text-text-primary'
                            )}
                          >
                            {muscle}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Planned Exercises */}
                {day.type !== 'rest' && (
                  <div className="bg-background/80 rounded-xl p-3 border border-border/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                        <Dumbbell className="w-3.5 h-3.5 text-accent" />
                        Planned Exercises ({day.exercises?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddExerciseToDay(dIdx)}
                        className="text-xs text-accent font-semibold hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Exercise
                      </button>
                    </div>

                    {(!day.exercises || day.exercises.length === 0) ? (
                      <p className="text-xs text-text-muted italic py-1">
                        No planned exercises for this day yet. Click "+ Add Exercise" to specify routines.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {day.exercises.map((ex, exIdx) => (
                          <div key={exIdx} className="grid grid-cols-12 gap-2 items-center bg-surface/70 p-2 rounded-xl border border-border/40 text-xs">
                            <div className="col-span-5">
                              <input
                                list="popular-exercises"
                                className="input py-1 px-2.5 text-xs w-full bg-background font-medium"
                                placeholder="Exercise name"
                                value={ex.name}
                                onChange={e => handleUpdateExerciseInDay(dIdx, exIdx, { name: e.target.value })}
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                min="1"
                                className="input py-1 px-2 text-center text-xs w-full bg-background"
                                placeholder="Sets"
                                title="Target Sets"
                                value={ex.targetSets || ''}
                                onChange={e => handleUpdateExerciseInDay(dIdx, exIdx, { targetSets: Number(e.target.value) })}
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                min="1"
                                className="input py-1 px-2 text-center text-xs w-full bg-background"
                                placeholder="Reps"
                                title="Target Reps"
                                value={ex.targetReps || ''}
                                onChange={e => handleUpdateExerciseInDay(dIdx, exIdx, { targetReps: Number(e.target.value) })}
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                min="0"
                                className="input py-1 px-2 text-center text-xs w-full bg-background"
                                placeholder="kg"
                                title="Target Weight (kg)"
                                value={ex.targetWeight || ''}
                                onChange={e => handleUpdateExerciseInDay(dIdx, exIdx, { targetWeight: Number(e.target.value) })}
                              />
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveExerciseFromDay(dIdx, exIdx)}
                                className="p-1 text-text-muted hover:text-error transition-colors"
                                title="Remove exercise"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex gap-3 pt-3 border-t border-border/50">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={isLoading}>
            {initialSplit ? 'Update Split' : 'Save & Create Split'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateSplitModal;
