import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { userApi, aiApi, getErrorMessage } from '../lib/api';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Settings, Scale, Target, Bot, Sparkles, Key } from 'lucide-react';
import AiApiKeyModal from '../components/ai/AiApiKeyModal';

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const { data: keyStatus, refetch: refetchKeyStatus } = useQuery({
    queryKey: ['ai-key-status'],
    queryFn: () => aiApi.getKeyStatus().then(r => r.data?.data as { isConfigured: boolean; maskedKey: string | null }),
  });

  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(
    user?.preferences?.units || 'metric'
  );
  const [calorieGoal, setCalorieGoal] = useState<number>(
    user?.fitnessProfile?.dailyCalorieGoal || 2200
  );
  const [proteinGoal, setProteinGoal] = useState<number>(
    user?.fitnessProfile?.dailyProteinGoal || 150
  );
  const [waterGoal, setWaterGoal] = useState<number>(
    user?.fitnessProfile?.dailyWaterGoal || 2500
  );

  const saveMutation = useMutation({
    mutationFn: (data: any) => userApi.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data.data?.user || res.data.user);
      showSuccess('Preferences saved successfully');
    },
    onError: (err) => {
      showError(getErrorMessage(err));
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      preferences: {
        ...user?.preferences,
        units: unitSystem,
      },
      fitnessProfile: {
        ...user?.fitnessProfile,
        dailyCalorieGoal: Number(calorieGoal),
        dailyProteinGoal: Number(proteinGoal),
        dailyWaterGoal: Number(waterGoal),
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Configure application preferences and daily fitness targets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Unit Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="w-5 h-5 text-accent" /> Units & System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Measurement System
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUnitSystem('metric')}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                    unitSystem === 'metric'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-surface text-text-secondary hover:border-text-muted'
                  }`}
                >
                  Metric (kg, cm, ml)
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem('imperial')}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                    unitSystem === 'imperial'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-surface text-text-secondary hover:border-text-muted'
                  }`}
                >
                  Imperial (lbs, in, oz)
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Targets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" /> Daily Targets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Daily Calorie Target (kcal)</label>
              <input
                type="number"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text-primary text-sm focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Daily Protein Target (grams)</label>
              <input
                type="number"
                value={proteinGoal}
                onChange={(e) => setProteinGoal(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text-primary text-sm focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Daily Water Target (ml)</label>
              <input
                type="number"
                value={waterGoal}
                onChange={(e) => setWaterGoal(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text-primary text-sm focus:border-accent"
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Coach Configuration */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-accent" /> REPX AI Coach Intelligence Engine
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-accent/15 text-accent border border-accent/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {keyStatus?.isConfigured ? 'Google Gemini 1.5 Active' : 'Smart Fitness Engine Active'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {keyStatus?.isConfigured
                    ? `Connected with Google Gemini (${keyStatus.maskedKey})`
                    : 'Built-in Comprehensive Fitness AI'}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {keyStatus?.isConfigured
                    ? 'Using live Gemini 1.5 Flash for chat, personalized workout routines, and nutritional advice.'
                    : 'Works offline without external dependencies. You can connect a free Gemini API key anytime for live generative AI.'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAiModalOpen(true)}
                leftIcon={<Key className="w-4 h-4 text-accent" />}
                className="flex-shrink-0"
              >
                {keyStatus?.isConfigured ? 'Manage Key' : 'Configure Gemini Key'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          variant="primary"
          isLoading={saveMutation.isPending}
          className="px-8"
        >
          Save All Settings
        </Button>
      </div>

      <AiApiKeyModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSuccess={() => refetchKeyStatus()}
      />
    </div>
  );
};

export default SettingsPage;
