import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { userApi, progressApi, getErrorMessage } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import FollowListModal from '../components/social/FollowListModal';
import DiscoverAthletesModal from '../components/social/DiscoverAthletesModal';
import {
  User, Mail, Shield, CheckCircle2, Award, Calendar, Activity,
  Ruler, Weight, Scale, TrendingUp, Plus, Edit, Flame, Dumbbell,
  HeartPulse, Info, X, Sparkles, Users, UserPlus
} from 'lucide-react';
import { generateAvatarUrl, formatRelativeDate, calculateBMI, getBMICategory, cn } from '../lib/utils';
import type { ProgressEntry, User as UserType, FollowUserItem } from '../types';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Social Modals State
  const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null);
  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);

  // Fetch Full User Profile with Followers/Following
  const { data: profileUser } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: () => userApi.getProfile().then(r => r.data.user as UserType),
  });

  useEffect(() => {
    if (profileUser) {
      if (profileUser.name) setName(profileUser.name);
      if (profileUser.bio !== undefined) setBio(profileUser.bio);
    }
  }, [profileUser]);

  // Fetch Followers or Following list for modal
  const { data: followList = [], isLoading: isLoadingFollowList } = useQuery({
    queryKey: ['current-user-follow-list', followListType],
    queryFn: () => {
      if (!user?._id || !followListType) return [];
      return followListType === 'followers'
        ? userApi.getFollowers(user._id).then(r => r.data.data as FollowUserItem[])
        : userApi.getFollowing(user._id).then(r => r.data.data as FollowUserItem[]);
    },
    enabled: Boolean(user?._id && followListType),
  });

  // Measurements Modal State
  const [isMeasurementsModalOpen, setIsMeasurementsModalOpen] = useState(false);
  const [isSubmittingMeasurements, setIsSubmittingMeasurements] = useState(false);

  // Fetch Latest Body Measurements from Progress API
  const { data: latestProgress } = useQuery({
    queryKey: ['progress-latest'],
    queryFn: () => progressApi.getLatest().then(r => r.data.data as ProgressEntry | null),
  });

  // Measurement form state
  const [measureForm, setMeasureForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: '',
    height: '',
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

  // Current values
  const currentHeight = user?.onboarding?.height || 0;
  const currentWeight = latestProgress?.weight || user?.onboarding?.weight || 0;
  const currentBodyFat = latestProgress?.bodyFat || 0;
  const currentMuscleMass = latestProgress?.muscleMass || 0;
  const currentChest = latestProgress?.chest || 0;
  const currentWaist = latestProgress?.waist || 0;
  const currentArms = latestProgress?.arms || 0;
  const currentHips = latestProgress?.hips || 0;
  const currentThighs = latestProgress?.thighs || 0;
  const currentCalves = latestProgress?.calves || 0;

  const followersCount = (profileUser?.followers || user?.followers || []).length;
  const followingCount = (profileUser?.following || user?.following || []).length;

  const bmi = currentHeight > 0 && currentWeight > 0 ? calculateBMI(currentWeight, currentHeight) : 0;
  const bmiCategory = bmi > 0 ? getBMICategory(bmi) : null;

  // Initialize/sync measurement form when modal opens
  const openMeasurementsModal = () => {
    setMeasureForm({
      date: format(new Date(), 'yyyy-MM-dd'),
      weight: currentWeight ? String(currentWeight) : '',
      height: currentHeight ? String(currentHeight) : '',
      bodyFat: currentBodyFat ? String(currentBodyFat) : '',
      muscleMass: currentMuscleMass ? String(currentMuscleMass) : '',
      chest: currentChest ? String(currentChest) : '',
      waist: currentWaist ? String(currentWaist) : '',
      hips: currentHips ? String(currentHips) : '',
      arms: currentArms ? String(currentArms) : '',
      thighs: currentThighs ? String(currentThighs) : '',
      calves: currentCalves ? String(currentCalves) : '',
      notes: '',
    });
    setIsMeasurementsModalOpen(true);
  };

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name?: string; bio?: string }) => userApi.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data.data?.user || res.data.user);
      queryClient.invalidateQueries({ queryKey: ['current-user-profile'] });
      showSuccess('Profile updated successfully');
    },
    onError: (err) => {
      showError(getErrorMessage(err));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) =>
      userApi.changePassword(current, next),
    onSuccess: () => {
      showSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err) => {
      showError(getErrorMessage(err));
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateProfileMutation.mutate({ name: name.trim(), bio: bio.trim() });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    changePasswordMutation.mutate({ current: currentPassword, next: newPassword });
  };

  const handleSaveMeasurements = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingMeasurements(true);
    try {
      const numHeight = measureForm.height ? Number(measureForm.height) : undefined;
      const numWeight = measureForm.weight ? Number(measureForm.weight) : undefined;

      // 1. Update user profile height & weight if changed
      if (numHeight !== undefined || numWeight !== undefined) {
        const res = await userApi.updateProfile({
          height: numHeight,
          weight: numWeight,
        });
        updateUser(res.data.data?.user || res.data.user);
      }

      // 2. Log progress entry
      await progressApi.create({
        date: measureForm.date ? new Date(measureForm.date).toISOString() : new Date().toISOString(),
        weight: numWeight,
        bodyFat: measureForm.bodyFat ? Number(measureForm.bodyFat) : undefined,
        muscleMass: measureForm.muscleMass ? Number(measureForm.muscleMass) : undefined,
        chest: measureForm.chest ? Number(measureForm.chest) : undefined,
        waist: measureForm.waist ? Number(measureForm.waist) : undefined,
        hips: measureForm.hips ? Number(measureForm.hips) : undefined,
        arms: measureForm.arms ? Number(measureForm.arms) : undefined,
        thighs: measureForm.thighs ? Number(measureForm.thighs) : undefined,
        calves: measureForm.calves ? Number(measureForm.calves) : undefined,
        notes: measureForm.notes || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['progress-latest'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });

      showSuccess('Measurements saved!', 'Your physical metrics have been updated.');
      setIsMeasurementsModalOpen(false);
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setIsSubmittingMeasurements(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Profile & Account</h1>
          <p className="text-sm text-text-secondary mt-1">Manage your identity, login security, and fitness badges.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsDiscoverModalOpen(true)}
          leftIcon={<UserPlus className="w-3.5 h-3.5 text-accent" />}
        >
          Discover Athletes
        </Button>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left flex-1">
              <img
                src={user?.avatar || generateAvatarUrl(user?.name || 'Athlete')}
                alt={user?.name}
                className="w-24 h-24 rounded-full border-2 border-accent object-cover shadow-accent shrink-0"
              />
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h2 className="text-xl font-bold text-text-primary">{user?.name}</h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/30 self-center sm:self-auto">
                    <Award className="w-3.5 h-3.5" /> Level {user?.gamification?.level || 1} Athlete
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{user?.email}</p>

                {bio && (
                  <p className="text-xs text-text-muted italic max-w-md">{bio}</p>
                )}

                {/* Followers and Following Clickable Counts */}
                <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                  <button
                    onClick={() => setFollowListType('followers')}
                    className="text-xs text-text-muted hover:text-accent font-semibold transition-colors"
                  >
                    <strong className="text-text-primary text-sm font-bold mr-1">{followersCount}</strong>
                    Followers
                  </button>
                  <span className="text-border">•</span>
                  <button
                    onClick={() => setFollowListType('following')}
                    className="text-xs text-text-muted hover:text-accent font-semibold transition-colors"
                  >
                    <strong className="text-text-primary text-sm font-bold mr-1">{followingCount}</strong>
                    Following
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface border border-border text-text-secondary">
                    <Activity className="w-3.5 h-3.5 text-accent" /> {user?.gamification?.streakCurrent || 0} Day Streak
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface border border-border text-text-secondary">
                    <Calendar className="w-3.5 h-3.5 text-text-muted" /> Joined {formatRelativeDate(user?.createdAt || new Date().toISOString())}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDiscoverModalOpen(true)}
              className="text-xs text-accent hover:bg-accent/10 shrink-0 self-center sm:self-start"
              leftIcon={<Users className="w-3.5 h-3.5" />}
            >
              Find Athletes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info & Change Password Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-accent" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled
                hint="Email cannot be changed"
              />
              <div>
                <label className="label">Bio / Headline</label>
                <input
                  className="input py-2.5 text-sm"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Powerlifter & hypertrophy enthusiast"
                  maxLength={150}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                isLoading={updateProfileMutation.isPending}
                className="w-full"
              >
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Input
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
              <Input
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Button
                type="submit"
                variant="outline"
                isLoading={changePasswordMutation.isPending}
                className="w-full"
              >
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Body Measurements & Physical Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Ruler className="w-5 h-5 text-accent" /> Body Measurements & Stats
              </CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">
                Track your key body circumferences, body composition, and BMI.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/progress"
                className="text-xs text-text-muted hover:text-accent flex items-center gap-1 font-semibold transition-colors mr-1"
              >
                <span>Progress Charts</span>
                <TrendingUp className="w-3.5 h-3.5" />
              </Link>
              <Button
                size="sm"
                onClick={openMeasurementsModal}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Log Measurement
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Top Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Weight */}
            <div className="bg-surface rounded-2xl p-3.5 border border-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-muted mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Weight</span>
                <Weight className="w-4 h-4 text-accent" />
              </div>
              <div>
                <div className="text-xl font-black text-text-primary">
                  {currentWeight ? `${currentWeight} kg` : '--'}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  {currentWeight ? `${(currentWeight * 2.20462).toFixed(1)} lbs` : 'Not recorded'}
                </div>
              </div>
            </div>

            {/* Height */}
            <div className="bg-surface rounded-2xl p-3.5 border border-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-muted mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Height</span>
                <Ruler className="w-4 h-4 text-info" />
              </div>
              <div>
                <div className="text-xl font-black text-text-primary">
                  {currentHeight ? `${currentHeight} cm` : '--'}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  {currentHeight ? `${Math.floor((currentHeight / 2.54) / 12)}'${Math.round((currentHeight / 2.54) % 12)}"` : 'Not recorded'}
                </div>
              </div>
            </div>

            {/* BMI */}
            <div className="bg-surface rounded-2xl p-3.5 border border-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-muted mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">BMI</span>
                <Scale className="w-4 h-4 text-accent" />
              </div>
              <div>
                <div className="text-xl font-black text-text-primary flex items-baseline gap-1.5">
                  <span>{bmi > 0 ? bmi : '--'}</span>
                  {bmiCategory && (
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', bmiCategory.color, 'bg-surface border border-border')}>
                      {bmiCategory.label}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  Normal: 18.5 - 24.9
                </div>
              </div>
            </div>

            {/* Body Fat */}
            <div className="bg-surface rounded-2xl p-3.5 border border-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-muted mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Body Fat</span>
                <Flame className="w-4 h-4 text-warning" />
              </div>
              <div>
                <div className="text-xl font-black text-text-primary">
                  {currentBodyFat ? `${currentBodyFat}%` : '--'}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  {currentBodyFat ? 'Measured fat %' : 'Optional metric'}
                </div>
              </div>
            </div>

            {/* Muscle Mass */}
            <div className="bg-surface rounded-2xl p-3.5 border border-border flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-text-muted mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Muscle Mass</span>
                <Dumbbell className="w-4 h-4 text-success" />
              </div>
              <div>
                <div className="text-xl font-black text-text-primary">
                  {currentMuscleMass ? `${currentMuscleMass} kg` : '--'}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  {currentMuscleMass ? 'Lean mass' : 'Optional metric'}
                </div>
              </div>
            </div>
          </div>

          {/* Circumferences Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Body Circumferences (Tape Measurements)
              </h4>
              <span className="text-[11px] text-text-muted">Unit: Centimeters (cm)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Chest', value: currentChest },
                { label: 'Waist', value: currentWaist },
                { label: 'Arms / Biceps', value: currentArms },
                { label: 'Hips', value: currentHips },
                { label: 'Thighs', value: currentThighs },
                { label: 'Calves', value: currentCalves },
              ].map((m) => (
                <div key={m.label} className="bg-surface/70 rounded-xl p-3 border border-border/80 text-center">
                  <div className="text-[11px] text-text-muted font-medium mb-1">{m.label}</div>
                  <div className="text-lg font-black text-text-primary">
                    {m.value ? `${m.value} cm` : '--'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Last Updated Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-border/50 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              Last updated:{' '}
              <strong className="text-text-secondary font-semibold">
                {latestProgress?.date ? format(new Date(latestProgress.date), 'MMM d, yyyy') : 'No records logged yet'}
              </strong>
            </span>
            <button
              onClick={openMeasurementsModal}
              className="text-accent hover:underline font-semibold flex items-center gap-1"
            >
              <Edit className="w-3 h-3" /> Update measurements
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Log/Update Measurements Modal */}
      <Modal
        isOpen={isMeasurementsModalOpen}
        onClose={() => setIsMeasurementsModalOpen(false)}
        title="Log Body Measurements"
        description="Update your weight, height, body composition, and tape circumferences."
        size="xl"
      >
        <form onSubmit={handleSaveMeasurements} className="space-y-5">
          {/* Core Metrics */}
          <div>
            <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-2.5">
              1. Core Measurements & Composition
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Weight (kg) *"
                type="number"
                step="0.1"
                min="20"
                max="500"
                placeholder="e.g. 75"
                value={measureForm.weight}
                onChange={e => setMeasureForm(prev => ({ ...prev, weight: e.target.value }))}
                required
              />
              <Input
                label="Height (cm) *"
                type="number"
                step="0.5"
                min="50"
                max="280"
                placeholder="e.g. 175"
                value={measureForm.height}
                onChange={e => setMeasureForm(prev => ({ ...prev, height: e.target.value }))}
                required
              />
              <div>
                <label className="label">Measurement Date</label>
                <input
                  type="date"
                  className="input"
                  value={measureForm.date}
                  onChange={e => setMeasureForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <Input
                label="Body Fat % (optional)"
                type="number"
                step="0.1"
                min="1"
                max="60"
                placeholder="e.g. 15.0"
                value={measureForm.bodyFat}
                onChange={e => setMeasureForm(prev => ({ ...prev, bodyFat: e.target.value }))}
              />
              <Input
                label="Muscle Mass (kg) (optional)"
                type="number"
                step="0.1"
                min="10"
                max="200"
                placeholder="e.g. 38.0"
                value={measureForm.muscleMass}
                onChange={e => setMeasureForm(prev => ({ ...prev, muscleMass: e.target.value }))}
              />
            </div>
          </div>

          {/* Circumferences */}
          <div className="pt-3 border-t border-border/50">
            <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-2.5">
              2. Body Circumferences (cm)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input
                label="Chest (cm)"
                type="number"
                step="0.5"
                min="30"
                max="200"
                placeholder="e.g. 102"
                value={measureForm.chest}
                onChange={e => setMeasureForm(prev => ({ ...prev, chest: e.target.value }))}
              />
              <Input
                label="Waist (cm)"
                type="number"
                step="0.5"
                min="30"
                max="200"
                placeholder="e.g. 82"
                value={measureForm.waist}
                onChange={e => setMeasureForm(prev => ({ ...prev, waist: e.target.value }))}
              />
              <Input
                label="Arms / Biceps (cm)"
                type="number"
                step="0.5"
                min="15"
                max="80"
                placeholder="e.g. 37"
                value={measureForm.arms}
                onChange={e => setMeasureForm(prev => ({ ...prev, arms: e.target.value }))}
              />
              <Input
                label="Hips (cm)"
                type="number"
                step="0.5"
                min="30"
                max="200"
                placeholder="e.g. 98"
                value={measureForm.hips}
                onChange={e => setMeasureForm(prev => ({ ...prev, hips: e.target.value }))}
              />
              <Input
                label="Thighs (cm)"
                type="number"
                step="0.5"
                min="20"
                max="120"
                placeholder="e.g. 58"
                value={measureForm.thighs}
                onChange={e => setMeasureForm(prev => ({ ...prev, thighs: e.target.value }))}
              />
              <Input
                label="Calves (cm)"
                type="number"
                step="0.5"
                min="15"
                max="80"
                placeholder="e.g. 38"
                value={measureForm.calves}
                onChange={e => setMeasureForm(prev => ({ ...prev, calves: e.target.value }))}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="pt-2 border-t border-border/50">
            <label className="label">Notes (optional)</label>
            <textarea
              className="input min-h-[60px] resize-none"
              placeholder="e.g., Morning weigh-in, feeling leaner after leg day"
              value={measureForm.notes}
              onChange={e => setMeasureForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex gap-3 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsMeasurementsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={isSubmittingMeasurements}
            >
              Save Measurements
            </Button>
          </div>
        </form>
      </Modal>

      {/* Followers / Following List Modal */}
      <FollowListModal
        isOpen={Boolean(followListType)}
        onClose={() => setFollowListType(null)}
        title={followListType === 'followers' ? 'My Followers' : 'Following Athletes'}
        users={followList}
        isLoading={isLoadingFollowList}
      />

      {/* Discover Athletes Search Modal */}
      <DiscoverAthletesModal
        isOpen={isDiscoverModalOpen}
        onClose={() => setIsDiscoverModalOpen(false)}
      />
    </div>
  );
};

export default ProfilePage;
