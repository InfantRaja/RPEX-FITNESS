import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, UserCheck, Users, Sparkles } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { userApi, getErrorMessage } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { generateAvatarUrl } from '../../lib/utils';
import type { FollowUserItem } from '../../types';

interface DiscoverAthletesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiscoverAthletesModal: React.FC<DiscoverAthletesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [search, setSearch] = useState('');

  const { data: athletes = [], isLoading } = useQuery({
    queryKey: ['discover-athletes', search],
    queryFn: () => userApi.discover({ q: search }).then(r => r.data.data as FollowUserItem[]),
    enabled: isOpen,
  });

  const toggleFollowMutation = useMutation({
    mutationFn: ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) =>
      isFollowing ? userApi.unfollow(userId) : userApi.follow(userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discover-athletes'] });
      queryClient.invalidateQueries({ queryKey: ['public-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-following'] });
      queryClient.invalidateQueries({ queryKey: ['current-user-profile'] });
      showSuccess(variables.isFollowing ? 'Unfollowed athlete' : 'Followed athlete!');
    },
    onError: (err) => {
      showError(getErrorMessage(err));
    },
  });

  const handleUserClick = (userId: string) => {
    onClose();
    navigate(`/profile/${userId}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Discover Athletes"
      description="Connect with fellow lifters, view their workouts, and track each other's progress."
      size="md"
    >
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="input pl-9 text-xs py-2"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Athletes List */}
        {isLoading ? (
          <div className="text-center py-8 text-xs text-text-muted">Searching athletes...</div>
        ) : athletes.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-text-secondary">No athletes found</p>
            <p className="text-xs text-text-muted mt-1">Try searching with a different name or email.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {athletes.map((athlete) => (
              <div
                key={athlete._id}
                className="flex items-center justify-between p-3 rounded-xl bg-surface/80 border border-border hover:border-accent/40 transition-all"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2"
                  onClick={() => handleUserClick(athlete._id)}
                >
                  <img
                    src={athlete.avatar || generateAvatarUrl(athlete.name)}
                    alt={athlete.name}
                    className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-text-primary text-sm truncate hover:text-accent transition-colors">
                      {athlete.name}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">
                      {athlete.followersCount} followers · {athlete.onboarding?.fitnessGoal ? athlete.onboarding.fitnessGoal.replace(/_/g, ' ') : 'Athlete'}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={athlete.isFollowing ? 'secondary' : 'primary'}
                  className="text-xs h-7 px-3 shrink-0"
                  onClick={() =>
                    toggleFollowMutation.mutate({
                      userId: athlete._id,
                      isFollowing: athlete.isFollowing,
                    })
                  }
                  isLoading={
                    toggleFollowMutation.isPending &&
                    toggleFollowMutation.variables?.userId === athlete._id
                  }
                >
                  {athlete.isFollowing ? 'Following' : 'Follow'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DiscoverAthletesModal;
