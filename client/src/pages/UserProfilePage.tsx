import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Award, Activity, Calendar, Users, Dumbbell,
  Clock, Flame, MapPin, TrendingUp, Check, MessageSquare
} from 'lucide-react';
import { userApi, getErrorMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { WorkoutCardSkeleton } from '../components/ui/Skeleton';
import FollowListModal from '../components/social/FollowListModal';
import {
  generateAvatarUrl, formatRelativeDate, formatDuration,
  getWorkoutTypeColor, capitalize, cn
} from '../lib/utils';
import type { PublicUserProfile, FollowUserItem } from '../types';

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null);

  // If user navigated to their own ID, redirect to /profile
  if (currentUser && currentUser._id === userId) {
    navigate('/profile', { replace: true });
  }

  // Fetch target user's public profile
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: () => userApi.getPublicProfile(userId!).then(r => r.data.data as PublicUserProfile),
    enabled: Boolean(userId),
  });

  // Fetch followers or following when modal opens
  const { data: followList = [], isLoading: isLoadingFollowList } = useQuery({
    queryKey: ['user-follow-list', userId, followListType],
    queryFn: () => {
      if (!userId || !followListType) return [];
      return followListType === 'followers'
        ? userApi.getFollowers(userId).then(r => r.data.data as FollowUserItem[])
        : userApi.getFollowing(userId).then(r => r.data.data as FollowUserItem[]);
    },
    enabled: Boolean(userId && followListType),
  });

  // Follow / Unfollow mutation
  const toggleFollowMutation = useMutation({
    mutationFn: () =>
      profile?.isFollowing
        ? userApi.unfollow(userId!)
        : userApi.follow(userId!),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['public-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-following', userId] });
      queryClient.invalidateQueries({ queryKey: ['current-user-profile'] });
      showSuccess(res.data.message || (profile?.isFollowing ? 'Unfollowed' : 'Following!'));
    },
    onError: (err) => {
      showError(getErrorMessage(err));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-pulse">
        <div className="h-8 w-40 bg-surface rounded-xl" />
        <div className="h-44 bg-surface rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-surface rounded-2xl" />
          <div className="h-24 bg-surface rounded-2xl" />
          <div className="h-24 bg-surface rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Users className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-40" />
        <h2 className="text-xl font-bold text-text-primary">Athlete Not Found</h2>
        <p className="text-sm text-text-muted mt-1">This athlete profile does not exist or may have been removed.</p>
        <Button className="mt-4" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      {/* Hero Profile Card */}
      <Card className="border-accent/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left flex-1">
              <img
                src={profile.avatar || generateAvatarUrl(profile.name)}
                alt={profile.name}
                className="w-24 h-24 rounded-full border-2 border-accent object-cover shadow-accent shrink-0"
              />
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-2xl font-black text-text-primary">{profile.name}</h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/30 self-center sm:self-auto">
                    <Award className="w-3 h-3" /> Level {profile.gamification?.level || 1} Athlete
                  </span>
                </div>

                {profile.bio && (
                  <p className="text-xs text-text-secondary italic max-w-md">{profile.bio}</p>
                )}

                {/* Followers & Following Buttons */}
                <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                  <button
                    onClick={() => setFollowListType('followers')}
                    className="text-xs text-text-muted hover:text-accent font-semibold transition-colors"
                  >
                    <strong className="text-text-primary text-sm font-bold mr-1">{profile.followersCount}</strong>
                    Followers
                  </button>
                  <span className="text-border">•</span>
                  <button
                    onClick={() => setFollowListType('following')}
                    className="text-xs text-text-muted hover:text-accent font-semibold transition-colors"
                  >
                    <strong className="text-text-primary text-sm font-bold mr-1">{profile.followingCount}</strong>
                    Following
                  </button>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2 text-xs text-text-muted">
                  <span className="inline-flex items-center gap-1 bg-surface px-2.5 py-1 rounded-lg border border-border">
                    <Activity className="w-3.5 h-3.5 text-accent" /> {profile.gamification?.streakCurrent || 0} Day Streak
                  </span>
                  <span className="inline-flex items-center gap-1 bg-surface px-2.5 py-1 rounded-lg border border-border">
                    <Calendar className="w-3.5 h-3.5 text-info" /> Joined {formatRelativeDate(profile.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Follow / Unfollow Button */}
            {!profile.isSelf && (
              <div className="shrink-0 self-center sm:self-start">
                <Button
                  variant={profile.isFollowing ? 'secondary' : 'primary'}
                  onClick={() => toggleFollowMutation.mutate()}
                  isLoading={toggleFollowMutation.isPending}
                  className="px-6 py-2.5 min-w-[120px]"
                >
                  {profile.isFollowing ? 'Following' : 'Follow'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary Cards */}
      {profile.stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card padding="sm" className="text-center">
            <div className="text-2xl font-black text-text-primary">{profile.stats.totalWorkouts}</div>
            <div className="text-xs text-text-muted mt-0.5">Total Workouts</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-2xl font-black text-text-primary">{profile.stats.workoutsLast30Days}</div>
            <div className="text-xs text-text-muted mt-0.5">Last 30 Days</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-2xl font-black text-text-primary">{formatDuration(profile.stats.totalMinutes || 0)}</div>
            <div className="text-xs text-text-muted mt-0.5">Total Time Trained</div>
          </Card>
        </div>
      )}

      {/* Fitness Profile Overview */}
      {profile.onboarding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-accent" /> Athletic Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-surface rounded-xl p-3 border border-border">
                <span className="text-text-muted block text-[11px] mb-1">Primary Goal</span>
                <span className="font-bold text-text-primary">
                  {profile.onboarding.fitnessGoal ? capitalize(profile.onboarding.fitnessGoal) : 'General Fitness'}
                </span>
              </div>
              <div className="bg-surface rounded-xl p-3 border border-border">
                <span className="text-text-muted block text-[11px] mb-1">Experience Level</span>
                <span className="font-bold text-text-primary">
                  {profile.onboarding.fitnessExperience ? capitalize(profile.onboarding.fitnessExperience) : 'Beginner'}
                </span>
              </div>
              <div className="bg-surface rounded-xl p-3 border border-border">
                <span className="text-text-muted block text-[11px] mb-1">Workout Location</span>
                <span className="font-bold text-text-primary">
                  {profile.onboarding.workoutLocation ? capitalize(profile.onboarding.workoutLocation) : 'Gym'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Workouts Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" /> Recent Activity ({profile.recentWorkouts?.length || 0})
          </h2>
        </div>

        {(!profile.recentWorkouts || profile.recentWorkouts.length === 0) ? (
          <div className="card p-8 text-center bg-surface/50">
            <Dumbbell className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-text-secondary">No workouts logged yet</p>
            <p className="text-xs text-text-muted mt-1">{profile.name} hasn't logged any workouts yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {profile.recentWorkouts.map((workout) => (
              <div
                key={workout._id}
                className="card p-5 bg-surface/70 border border-border/80 hover:border-accent/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2.5">
                    <div>
                      <h4 className="font-bold text-text-primary text-base truncate">{workout.title}</h4>
                      <p className="text-xs text-text-muted mt-0.5">{formatRelativeDate(workout.date)}</p>
                    </div>
                    <span className={cn('badge text-xs font-semibold', getWorkoutTypeColor(workout.type))}>
                      {capitalize(workout.type)}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mb-3">
                    <span className="flex items-center gap-1 bg-background px-2.5 py-1 rounded-lg border border-border/60">
                      <Clock className="w-3.5 h-3.5 text-accent" /> {formatDuration(workout.duration)}
                    </span>
                    {workout.caloriesBurned ? (
                      <span className="flex items-center gap-1 bg-background px-2.5 py-1 rounded-lg border border-border/60">
                        <Flame className="w-3.5 h-3.5 text-warning" /> {workout.caloriesBurned} kcal
                      </span>
                    ) : null}
                    {workout.location && (
                      <span className="flex items-center gap-1 bg-background px-2.5 py-1 rounded-lg border border-border/60">
                        <MapPin className="w-3.5 h-3.5 text-info" /> {capitalize(workout.location)}
                      </span>
                    )}
                  </div>

                  {/* Exercises preview */}
                  {workout.exercises && workout.exercises.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-border/50 space-y-1.5">
                      <p className="text-[11px] font-bold text-text-secondary">
                        {workout.exercises.length} Exercises ({workout.exercises.reduce((a, b) => a + (b.sets?.length || 0), 0)} sets)
                      </p>
                      <div className="space-y-1">
                        {workout.exercises.slice(0, 3).map((ex, exIdx) => (
                          <div key={exIdx} className="text-xs text-text-muted truncate flex items-center justify-between">
                            <span className="text-text-secondary font-medium truncate">{ex.name}</span>
                            <span className="text-[10px] text-text-muted font-mono">{ex.sets?.length || 0} sets</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {workout.notes && (
                    <div className="mt-3 pt-2 text-xs text-text-muted italic flex items-start gap-1 bg-background/50 p-2 rounded-lg border border-border/40">
                      <MessageSquare className="w-3 h-3 shrink-0 text-text-muted mt-0.5" />
                      <span className="line-clamp-2">{workout.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Followers / Following List Modal */}
      <FollowListModal
        isOpen={Boolean(followListType)}
        onClose={() => setFollowListType(null)}
        title={followListType === 'followers' ? 'Followers' : 'Following'}
        users={followList}
        isLoading={isLoadingFollowList}
      />
    </div>
  );
};

export default UserProfilePage;
