import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, User, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { generateAvatarUrl } from '../../lib/utils';

const pageTitle: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/workouts': 'Workouts',
  '/nutrition': 'Nutrition',
  '/progress': 'Progress',
  '/ai-coach': 'AI Coach',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

const TopBar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const title = pageTitle[location.pathname] || 'REPX Tracker';

  return (
    <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-card/80 backdrop-blur-md border-b border-border flex-shrink-0">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2">
        <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-background" fill="currentColor" />
        </div>
        <span className="text-sm font-black">
          <span className="text-text-primary">REPX</span>
          <span className="text-accent"> Tracker</span>
        </span>
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <Link to="/profile">
          <img
            src={user?.avatar || generateAvatarUrl(user?.name || 'User')}
            alt={user?.name}
            className="w-8 h-8 rounded-full object-cover border border-border"
            onError={(e) => {
              (e.target as HTMLImageElement).src = generateAvatarUrl(user?.name || 'User');
            }}
          />
        </Link>
      </div>
    </header>
  );
};

export default TopBar;
