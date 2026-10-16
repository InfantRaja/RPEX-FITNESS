import React from 'react';
import { Plus, Check, Trash2, Edit, Dumbbell, Calendar, Zap, Layers } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';
import type { Split } from '../../types';

interface ManageSplitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  splits: Split[];
  onActivate: (splitId: string) => void;
  onEdit: (split: Split) => void;
  onDelete: (splitId: string) => void;
  onCreateNew: () => void;
  isActivating?: boolean;
}

export const ManageSplitsModal: React.FC<ManageSplitsModalProps> = ({
  isOpen,
  onClose,
  splits,
  onActivate,
  onEdit,
  onDelete,
  onCreateNew,
  isActivating,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Training Splits & Routines"
      description="Choose a preset training split or manage your custom workout splits."
      size="2xl"
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-2">
          <div>
            <span className="text-xs text-text-muted">Available Splits: {splits.length}</span>
          </div>
          <Button
            size="sm"
            onClick={() => {
              onClose();
              onCreateNew();
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Create Custom Split
          </Button>
        </div>

        <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
          {splits.map(split => {
            const isCurrentlyActive = split.isActive;

            return (
              <div
                key={split._id}
                className={cn(
                  'rounded-2xl p-4 border transition-all duration-200',
                  isCurrentlyActive
                    ? 'bg-gradient-to-r from-accent/15 via-surface to-surface border-accent/50 shadow-md ring-1 ring-accent/30'
                    : 'bg-surface/80 border-border hover:border-border/80'
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-text-primary text-base">{split.name}</h4>
                      {isCurrentlyActive && (
                        <span className="badge bg-accent text-background font-black text-[10px] px-2 py-0.5">
                          ACTIVE SPLIT
                        </span>
                      )}
                      {split.isPreset ? (
                        <span className="badge bg-surface text-text-muted border border-border text-[10px]">
                          Preset
                        </span>
                      ) : (
                        <span className="badge bg-info/10 text-info border border-info/20 text-[10px]">
                          Custom
                        </span>
                      )}
                    </div>
                    {split.description && (
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">{split.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!split.isPreset && (
                      <>
                        <button
                          onClick={() => {
                            onClose();
                            onEdit(split);
                          }}
                          className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
                          title="Edit custom split"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(split._id)}
                          className="p-1.5 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                          title="Delete custom split"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {!isCurrentlyActive && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onActivate(split._id)}
                        isLoading={isActivating}
                        className="text-xs h-7 px-3 text-accent border-accent/40 hover:bg-accent/10"
                      >
                        Set Active
                      </Button>
                    )}
                  </div>
                </div>

                {/* Days Preview */}
                <div className="mt-3 pt-3 border-t border-border/40">
                  <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                    <span className="flex items-center gap-1 font-semibold text-text-secondary">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      {split.days?.length || 0} Routine Days ({split.daysPerWeek || split.days?.length || 4} days/week)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(split.days || []).map((day, dIdx) => (
                      <div
                        key={dIdx}
                        className="bg-background/80 rounded-xl p-2.5 border border-border/50 text-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="text-[10px] font-bold text-accent uppercase tracking-wider">
                            Day {dIdx + 1}
                          </div>
                          <div className="font-bold text-text-primary mt-0.5 truncate" title={day.name}>
                            {day.name}
                          </div>
                        </div>
                        <div className="text-[11px] text-text-muted mt-2">
                          {day.type === 'rest' ? (
                            <span className="text-text-muted italic">Rest Day</span>
                          ) : (
                            <span>{day.exercises?.length || 0} exercises</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-border/50 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ManageSplitsModal;
