import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Dumbbell, Flame, TrendingUp, Zap, ChevronRight,
  Trophy, Target, Calendar, Activity, Plus, Bot
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { format, subDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { analyticsApi, workoutApi, nutritionApi } from '../lib/api';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { PageSkeleton, StatCardSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/EmptyState';
import { formatDuration, formatCalories, getWorkoutTypeColor, capitalize } from '../lib/utils';
import { cn } from '../lib/utils';

const ACCENT = '#B8FF3B';
const CHART_COLORS = { grid: '#2A3038', text: '#9AA4AF' };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-xl p-3 shadow-card text-xs">
      <p className="text-text-muted mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// Generate mock chart data for the past 7 days
const generateWeekData = () => {
  return Array.from({ length: 7 }, (_, i) => ({
    date: format(subDays(new Date(), 6 - i), 'MMM d'),
    day: format(subDays(new Date(), 6 - i), 'EEE'),
    workouts: Math.floor(Math.random() * 2),
    calories: Math.floor(Math.random() * 800 + 1600),
  }));
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError, refetch } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsApi.getOverview().then(r => r.data.data),
    retry: 1,
  });

  const { data: recentWorkouts, isLoading: workoutsLoading } = useQuery({
    queryKey: ['workouts-recent'],
    queryFn: () => workoutApi.getAll({ limit: 5 }).then(r => r.data.data),
    retry: 1,
  });

  const { data: todayNutrition } = useQuery({
    queryKey: ['nutrition-today'],
    queryFn: () => nutritionApi.getToday().then(r => r.data.data),
    retry: 1,
  });

  const weekData = analytics?.weeklyWorkouts?.length > 0
    ? analytics.weeklyWorkouts
    : generateWeekData();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (analyticsLoading && workoutsLoading) return <PageSkeleton />;

  if (analyticsError) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        message="Could not connect to the server. Make sure the backend is running."
        onRetry={refetch}
      />
    );
  }

  const stats = [
    {
      label: 'Workouts This Month',
      value: analytics?.workoutsThisMonth ?? '—',
      sub: `${analytics?.workoutsLastMonth ?? 0} last month`,
      icon: Dumbbell,
      color: 'text-accent bg-accent-muted',
    },
    {
      label: 'Current Streak',
      value: `${analytics?.workoutStreak ?? 0}`,
      sub: 'days in a row',
      icon: Flame,
      color: 'text-error bg-error/10',
    },
    {
      label: 'Avg. Daily Calories',
      value: formatCalories(analytics?.avgDailyCalories ?? 0),
      sub: 'this week',
      icon: Zap,
      color: 'text-warning bg-warning/10',
    },
    {
      label: 'Current Weight',
      value: analytics?.latestWeight ? `${analytics.latestWeight} kg` : '—',
      sub: 'last recorded',
      icon: TrendingUp,
      color: 'text-info bg-info/10',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {format(new Date(), 'EEEE, MMMM d')} · Let's crush your goals today!
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/workouts">
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Log Workout
            </Button>
          </Link>
        </div>
      </div>

      {/* Goal Banner */}
      {user?.onboarding?.fitnessGoal && (
        <Card className="border-accent/20 bg-accent-muted/20" padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-background" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted">Current Goal</p>
              <p className="text-sm font-bold text-accent">{capitalize(user.onboarding.fitnessGoal)}</p>
            </div>
            <Link to="/ai-coach">
              <Button size="sm" variant="ghost" rightIcon={<Bot className="w-4 h-4" />}>
                Ask AI Coach
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="group hover:border-accent/30 transition-all duration-200">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', stat.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-text-primary mb-1">{stat.value}</div>
              <div className="text-xs text-text-muted">{stat.sub}</div>
              <div className="text-xs text-text-secondary font-medium mt-1">{stat.label}</div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Weekly Workouts */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <span className="text-xs text-text-muted">Last 7 days</span>
          </CardHeader>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 11, fill: CHART_COLORS.text }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => {
                    try { return format(new Date(v), 'EEE'); } catch { return v; }
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: CHART_COLORS.text }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Workouts" fill={ACCENT} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Calories */}
        <Card>
          <CardHeader>
            <CardTitle>Calorie Intake</CardTitle>
            <span className="text-xs text-text-muted">Last 7 days</span>
          </CardHeader>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analytics?.weeklyCalories || weekData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 11, fill: CHART_COLORS.text }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => {
                    try { return format(new Date(v), 'EEE'); } catch { return v; }
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: CHART_COLORS.text }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="calories"
                  name="Calories"
                  stroke={ACCENT}
                  strokeWidth={2}
                  fill="url(#calGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent Workouts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Workouts</CardTitle>
            <Link to="/workouts" className="text-xs text-accent hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          {recentWorkouts && recentWorkouts.length > 0 ? (
            <div className="space-y-3">
              {recentWorkouts.slice(0, 5).map((workout: any) => (
                <div key={workout._id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className="w-9 h-9 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-4 h-4 text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{workout.title}</p>
                    <p className="text-xs text-text-muted">
                      {format(new Date(workout.date), 'MMM d')} · {formatDuration(workout.duration)}
                    </p>
                  </div>
                  <span className={cn('badge text-xs', getWorkoutTypeColor(workout.type))}>
                    {workout.type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Dumbbell className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">No workouts yet</p>
              <Link to="/workouts" className="text-xs text-accent hover:underline mt-1 block">
                Log your first workout
              </Link>
            </div>
          )}
        </Card>

        {/* Today's Nutrition */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Nutrition</CardTitle>
            <Link to="/nutrition" className="text-xs text-accent hover:underline flex items-center gap-1">
              Track meals <ChevronRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          {todayNutrition ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-black text-text-primary">
                  {formatCalories(todayNutrition.totalCalories)}
                </div>
                <div className="text-xs text-text-muted mt-1">calories today</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Protein', value: Math.round(todayNutrition.totalProtein), color: 'text-info', unit: 'g' },
                  { label: 'Carbs', value: Math.round(todayNutrition.totalCarbs), color: 'text-warning', unit: 'g' },
                  { label: 'Fat', value: Math.round(todayNutrition.totalFat), color: 'text-error', unit: 'g' },
                ].map(macro => (
                  <div key={macro.label} className="text-center bg-surface rounded-xl p-3">
                    <div className={cn('text-xl font-black', macro.color)}>{macro.value}<span className="text-xs font-normal">{macro.unit}</span></div>
                    <div className="text-xs text-text-muted mt-0.5">{macro.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">No meals logged today</p>
              <Link to="/nutrition" className="text-xs text-accent hover:underline mt-1 block">
                Log your first meal
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/workouts', icon: Dumbbell, label: 'Log Workout', color: 'text-accent bg-accent-muted' },
            { to: '/nutrition', icon: Flame, label: 'Track Meals', color: 'text-warning bg-warning/10' },
            { to: '/progress', icon: TrendingUp, label: 'Log Progress', color: 'text-info bg-info/10' },
            { to: '/ai-coach', icon: Bot, label: 'Ask AI Coach', color: 'text-success bg-success/10' },
          ].map(action => {
            const Icon = action.icon;
            return (
              <Link key={action.to} to={action.to}>
                <div className="flex flex-col items-center gap-2 p-4 bg-surface rounded-xl border border-border hover:border-accent/30 transition-all duration-200 hover:-translate-y-0.5 group cursor-pointer">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', action.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary text-center">{action.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
