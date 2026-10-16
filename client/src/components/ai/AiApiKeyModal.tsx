import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, X, Eye, EyeOff, Sparkles } from 'lucide-react';
import { aiApi, getErrorMessage } from '../../lib/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';

interface AiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AiApiKeyModal: React.FC<AiApiKeyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showSuccess, showError } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [status, setStatus] = useState<{ isConfigured: boolean; maskedKey: string | null }>({
    isConfigured: false,
    maskedKey: null,
  });

  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await aiApi.getKeyStatus();
      if (res.data?.data) {
        setStatus(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setApiKey('');
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      showError('Please paste a Gemini API key');
      return;
    }

    setLoading(true);
    try {
      const res = await aiApi.configKey(apiKey.trim());
      showSuccess(res.data?.message || 'Gemini API key configured successfully!');
      await fetchStatus();
      setApiKey('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await aiApi.configKey('reset');
      showSuccess('Switched to built-in smart AI coach engine.');
      await fetchStatus();
      setApiKey('');
      if (onSuccess) onSuccess();
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Gemini AI Key">
      <div className="space-y-5">
        {/* Current Status Box */}
        <div className="bg-surface/80 rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" /> Active AI Engine
            </span>
            {statusLoading && <RefreshCw className="w-3 h-3 text-text-muted animate-spin" />}
          </div>

          {status.isConfigured ? (
            <div className="flex items-center gap-2.5 text-sm text-success font-medium">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              <div>
                <p className="font-semibold text-text-primary">Google Gemini 1.5 Flash Connected</p>
                <p className="text-xs text-text-muted">Key: {status.maskedKey}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-sm text-text-primary font-medium">
              <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-text-primary">Built-in Fitness Coach Engine (Active)</p>
                <p className="text-xs text-text-secondary">Fully functional fitness AI without external keys.</p>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste AIzaSy... key from Google AI Studio"
                className="w-full bg-background border border-border rounded-xl pl-9 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-2 flex items-center gap-1.5">
              <span>Don't have an API key?</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline inline-flex items-center gap-0.5 font-medium"
              >
                Get one free at Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {status.isConfigured && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={loading}
                className="mr-auto text-error border-error/30 hover:bg-error/10"
              >
                Reset to Built-in
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !apiKey.trim()}
              isLoading={loading}
            >
              Verify & Save Key
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AiApiKeyModal;
