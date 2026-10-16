import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, Salad, TrendingUp, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { to: '/nutrition', icon: Salad, label: 'Nutrition' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/ai-coach', icon: Bot, label: 'AI' },
];

const MobileNav: React.FC = () => (
  <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border safe-area-pb">
    <div className="flex items-center justify-around px-2 py-2">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-0',
              isActive
                ? 'text-accent'
                : 'text-text-muted hover:text-text-secondary'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                'p-1.5 rounded-lg transition-all duration-200',
                isActive && 'bg-accent-muted'
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default MobileNav;
