import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Loader2 } from 'lucide-react';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      showError(decodeURIComponent(error));
      navigate('/login');
      return;
    }

    if (token) {
      handleOAuthCallback(token)
        .then(() => {
          showSuccess('Successfully logged in!');
          navigate('/dashboard');
        })
        .catch((err) => {
          showError('Failed to complete authentication: ' + err.message);
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
  }, [searchParams, handleOAuthCallback, navigate, showError, showSuccess]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
        <h2 className="text-lg font-semibold text-text-primary">Authenticating your account...</h2>
        <p className="text-sm text-text-secondary">Please wait while we log you in.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
