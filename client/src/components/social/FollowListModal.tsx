import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, UserCheck, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { userApi, getErrorMessage } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { generateAvatarUrl } from '../../lib/utils';
import type { FollowUserItem } from '../../types';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: FollowUserItem[];
  isLoading?: boolean;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
  isOpen,
  onClose,
  title,
  users,
  isLoading,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const toggleFollowMutation = useMutation({
    mutationFn: ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) =>
      isFollowing ? userApi.unfollow(userId) : userApi.follow(userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['public-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-followers'] });
      queryClient.invalidateQueries({ queryKey: ['user-following'] });
      queryClient.invalidateQueries({ queryKey: ['discover-athletes'] });
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
      title={title}
      size="md"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-xs text-text-muted">Loading athletes...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-text-secondary">No athletes found</p>
            <p className="text-xs text-text-muted mt-1">This list is currently empty.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {users.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3 rounded-xl bg-surface/80 border border-border hover:border-accent/30 transition-all"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2"
                  onClick={() => handleUserClick(item._id)}
                >
                  <img
                    src={item.avatar || generateAvatarUrl(item.name)}
                    alt={item.name}
                    className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-text-primary text-sm truncate hover:text-accent transition-colors">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">
                      {item.followersCount} followers
                    </p>
                  </div>
                </div>

                {!item.isSelf && (
                  <Button
                    size="sm"
                    variant={item.isFollowing ? 'secondary' : 'primary'}
                    className="text-xs h-7 px-2.5 shrink-0"
                    onClick={() =>
                      toggleFollowMutation.mutate({
                        userId: item._id,
                        isFollowing: item.isFollowing,
                      })
                    }
                    isLoading={
                      toggleFollowMutation.isPending &&
                      toggleFollowMutation.variables?.userId === item._id
                    }
                  >
                    {item.isFollowing ? 'Following' : 'Follow'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default FollowListModal;
