import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  TrendingUp, Plus, Trash2, Weight, Ruler, ChevronDown,
  Camera, Trophy
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { progressApi, analyticsApi, getErrorMessage } from '../lib/api';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { cn, formatRelativeDate } from '../lib/utils';
import type { ProgressEntry } from '../types';

const ACCENT = '#B8FF3B';
const CHART_COLORS = { grid: '#2A3038', text: '#9AA4AF' };

const metrics = [
  { key: 'weight', label: 'Weight', unit: 'kg', color: ACCENT },
  { key: 'bodyFat', label: 'Body Fat', unit: '%', color: '#FF5D67' },
  { key: 'waist', label: 'Waist', unit: 'cm', color: '#F39C12' },
  { key: 'chest', label: 'Chest', unit: 'cm', color: '#3498DB' },
  { key: 'arms', label: 'Arms', unit: 'cm', color: '#2ECC71' },
  { key: 'hips', label: 'Hips', unit: 'cm', color: '#9B59B6' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-xl p-3 shadow-card text-xs">
      <p className="text-text-muted mb-1">{label ? format(new Date(label), 'MMM d, yyyy') : ''}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.value} {p.unit}
        </p>
      ))}
    </div>
  );
};

const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('weight');

  const { data: entries, isLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: () => progressApi.getAll({ limit: 60 }).then(r => r.data.data as ProgressEntry[]),
  });

  const { data: chartData } = useQuery({
    queryKey: ['progress-chart', selectedMetric],
    queryFn: () => analyticsApi.getProgressChart(selectedMetric, 30).then(r => r.data.data),
  });

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: '',
    bodyFat: '',
    muscleMass: '',
    chest: '',
    waist: '',
    hips: '',
    arms: '',
    thighs: '',
    calves: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: progressApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['progress-chart'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      success('Progress logged!', 'Keep tracking your journey!');
      setIsModalOpen(false);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        weight: '',
        bodyFat: '',
        muscleMass: '',
        chest: '',
        waist: '',
        hips: '',
        arms: '',
        thighs: '',
        calves: '',
        notes: '',
      });
    },
    onError: (err) => toastError('Failed to log progress', getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: progressApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['progress-chart'] });
      success('Entry deleted');
    },
    onError: (err) => toastError('Failed to delete', getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = { date: formData.date };
    if (formData.notes) payload.notes = formData.notes;
    Object.keys(formData).forEach(key => {
      if (key !== 'date' && key !== 'notes' && formData[key as keyof typeof formData]) {
        payload[key] = Number(formData[key as keyof typeof formData]);
      }
    });
    createMutation.mutate(payload);
  };

  const latestEntry = entries?.[0];
  const previousEntry = entries?.[1];

  const getDelta = (key: string) => {
    if (!latestEntry || !previousEntry) return null;
    const latest = (latestEntry as any)[key];
    const prev = (previousEntry as any)[key];
    if (!latest || !prev) return null;
    const delta = latest - prev;
    return { delta: Math.abs(delta).toFixed(1), isPositive: delta > 0 };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary">Progress</h1>
          <p className="text-sm text-text-secondary mt-0.5">Track your body measurements over time</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />} id="log-progress-btn">
          Log Progress
        </Button>
      </div>

      {/* Latest Stats */}
      {latestEntry && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {metrics.map(metric => {
            const val = (latestEntry as any)[metric.key];
            const delta = getDelta(metric.key);
            return (
              <Card key={metric.key} padding="sm" className="text-center">
                <div className="text-xs text-text-muted mb-1">{metric.label}</div>
                <div className="text-xl font-black" style={{ color: metric.color }}>
                  {val ? val : '—'}
                  {val && <span className="text-xs font-normal text-text-muted ml-0.5">{metric.unit}</span>}
                </div>
                {delta && (
                  <div className={cn(
                    'text-xs mt-0.5',
                    metric.key === 'weight' || metric.key === 'bodyFat' || metric.key === 'waist'
                      ? delta.isPositive ? 'text-error' : 'text-success'
                      : delta.isPositive ? 'text-success' : 'text-error'
                  )}>
                    {delta.isPositive ? '+' : '-'}{delta.delta}{metric.unit}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Chart</CardTitle>
          <div className="flex gap-2 flex-wrap">
            {metrics.map(m => (
              <button
                key={m.key}
                onClick={() => setSelectedMetric(m.key)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200',
                  selectedMetric === m.key
                    ? 'bg-accent text-background'
                    : 'bg-surface text-text-secondary hover:text-text-primary'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <div className="h-64">
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: CHART_COLORS.text }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => {
                    try { return format(new Date(v), 'MMM d'); } catch { return v; }
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: CHART_COLORS.text }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={metrics.find(m => m.key === selectedMetric)?.color || ACCENT}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: metrics.find(m => m.key === selectedMetric)?.color || ACCENT }}
                  activeDot={{ r: 6 }}
                />
                {user?.onboarding?.weight && selectedMetric === 'weight' && (
                  <ReferenceLine
                    y={user.onboarding.weight}
                    stroke={CHART_COLORS.grid}
                    strokeDasharray="4 4"
                    label={{ value: 'Start', fill: CHART_COLORS.text, fontSize: 10 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              {isLoading ? 'Loading chart...' : 'Log progress entries to see your chart'}
            </div>
          )}
        </div>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Progress History</CardTitle>
        </CardHeader>
        {entries && entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry._id}
                className="flex items-start justify-between py-3 border-b border-border/50 last:border-0 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-text-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {formatRelativeDate(entry.date)}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {entry.weight && (
                        <span className="text-xs text-text-muted">{entry.weight} kg</span>
                      )}
                      {entry.bodyFat && (
                        <span className="text-xs text-text-muted">{entry.bodyFat}% BF</span>
                      )}
                      {entry.waist && (
                        <span className="text-xs text-text-muted">W: {entry.waist}cm</span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-text-muted mt-1 italic">"{entry.notes}"</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(entry._id)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 rounded-lg text-text-muted hover:text-error transition-all duration-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <TrendingUp className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">No progress entries yet</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setIsModalOpen(true)}>
              Log your first measurement
            </Button>
          </div>
        )}
      </Card>

      {/* Log Progress Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Progress"
        description="Record your body measurements"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4" id="progress-form">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={formData.date}
              onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'weight', label: 'Weight (kg)' },
              { key: 'bodyFat', label: 'Body Fat (%)' },
              { key: 'muscleMass', label: 'Muscle Mass (kg)' },
              { key: 'chest', label: 'Chest (cm)' },
              { key: 'waist', label: 'Waist (cm)' },
              { key: 'hips', label: 'Hips (cm)' },
              { key: 'arms', label: 'Arms (cm)' },
              { key: 'thighs', label: 'Thighs (cm)' },
              { key: 'calves', label: 'Calves (cm)' },
            ].map(field => (
              <div key={field.key}>
                <label className="label">{field.label}</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  placeholder="Optional"
                  value={formData[field.key as keyof typeof formData]}
                  onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input resize-none min-h-[70px]"
              placeholder="How are you feeling? Any observations?"
              value={formData.notes}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={createMutation.isPending} id="progress-submit">
              Log Progress
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProgressPage;
