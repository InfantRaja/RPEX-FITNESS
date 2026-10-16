import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot, Send, Plus, Trash2, MessageCircle, Sparkles, Key,
  Dumbbell, Salad, TrendingUp, Zap, ChevronRight, Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { aiApi, getErrorMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { cn, formatRelativeDate } from '../lib/utils';
import type { AIConversation, ChatMessage } from '../types';
import AiApiKeyModal from '../components/ai/AiApiKeyModal';

const SUGGESTED_PROMPTS = [
  { icon: Dumbbell, text: 'Create a workout plan for me', topic: 'workout' },
  { icon: Salad, text: 'What should I eat to build muscle?', topic: 'nutrition' },
  { icon: TrendingUp, text: 'How can I break a weight loss plateau?', topic: 'progress' },
  { icon: Zap, text: 'Motivate me to stay consistent', topic: 'motivation' },
];

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm',
        isUser ? 'bg-accent text-background font-bold' : 'bg-surface border border-border'
      )}>
        {isUser ? '👤' : <Bot className="w-4 h-4 text-accent" />}
      </div>
      {/* Bubble */}
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-accent text-background rounded-tr-sm font-medium'
          : 'bg-surface border border-border text-text-primary rounded-tl-sm'
      )}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="text-accent font-bold">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-text-secondary">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-background px-1.5 py-0.5 rounded text-accent text-xs font-mono">{children}</code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <p className={cn('text-xs mt-1 opacity-60', isUser ? 'text-right' : 'text-left')}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

const AICoachPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { error: toastError, success } = useToast();
  const [input, setInput] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: keyStatus, refetch: refetchKeyStatus } = useQuery({
    queryKey: ['ai-key-status'],
    queryFn: () => aiApi.getKeyStatus().then(r => r.data?.data as { isConfigured: boolean; maskedKey: string | null }),
  });

  const { data: conversations, isLoading: convsLoading } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => aiApi.getConversations().then(r => r.data.data as AIConversation[]),
  });

  const chatMutation = useMutation({
    mutationFn: aiApi.chat,
    onMutate: (vars) => {
      // Optimistic user message
      const userMsg: ChatMessage = {
        role: 'user',
        content: vars.message,
        timestamp: new Date().toISOString(),
      };
      setLocalMessages(prev => [...prev, userMsg]);
      setIsTyping(true);
    },
    onSuccess: (res) => {
      const data = res.data.data;
      if (!currentConversationId) {
        setCurrentConversationId(data.conversationId);
      }
      setLocalMessages(data.conversation.messages);
      setIsTyping(false);
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    },
    onError: (err) => {
      setIsTyping(false);
      toastError('AI error', getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: aiApi.deleteConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      if (currentConversationId) {
        setCurrentConversationId(null);
        setLocalMessages([]);
      }
      success('Conversation deleted');
    },
  });

  const recommendMutation = useMutation({
    mutationFn: (type: 'workout' | 'nutrition') =>
      type === 'workout' ? aiApi.recommendWorkout() : aiApi.recommendNutrition(),
    onSuccess: (res, type) => {
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: res.data.data.recommendation,
        timestamp: new Date().toISOString(),
      };
      const userMsg: ChatMessage = {
        role: 'user',
        content: type === 'workout' ? 'Generate a workout plan for me' : 'Create a nutrition plan for me',
        timestamp: new Date().toISOString(),
      };
      setLocalMessages([userMsg, aiMsg]);
    },
    onError: (err) => toastError('Failed to get recommendation', getErrorMessage(err)),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const msg = input.trim();
    setInput('');
    chatMutation.mutate({
      message: msg,
      conversationId: currentConversationId || undefined,
      language: user?.onboarding?.preferredLanguage || 'en',
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setLocalMessages([]);
  };

  const loadConversation = async (conv: AIConversation) => {
    setCurrentConversationId(conv._id);
    setLocalMessages(conv.messages);
  };

  return (
    <div className="flex gap-5 h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] animate-fade-in">
      {/* Sidebar - Conversation List */}
      <div className="hidden lg:flex flex-col w-64 flex-shrink-0 gap-3">
        <Button
          onClick={startNewConversation}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full"
        >
          New Conversation
        </Button>

        {/* Quick Actions */}
        <Card padding="sm">
          <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">Quick Actions</p>
          <div className="space-y-1">
            <button
              onClick={() => recommendMutation.mutate('workout')}
              disabled={recommendMutation.isPending}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-secondary hover:bg-surface hover:text-text-primary transition-colors text-left"
            >
              <Dumbbell className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              Get Workout Plan
            </button>
            <button
              onClick={() => recommendMutation.mutate('nutrition')}
              disabled={recommendMutation.isPending}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-secondary hover:bg-surface hover:text-text-primary transition-colors text-left"
            >
              <Salad className="w-3.5 h-3.5 text-success flex-shrink-0" />
              Get Nutrition Plan
            </button>
          </div>
        </Card>

        {/* Conversation History */}
        <Card padding="sm" className="flex-1 overflow-hidden flex flex-col">
          <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">History</p>
          <div className="flex-1 overflow-y-auto space-y-1 no-scrollbar">
            {convsLoading && (
              <div className="text-xs text-text-muted text-center py-4">Loading...</div>
            )}
            {conversations?.map((conv) => (
              <div
                key={conv._id}
                className={cn(
                  'group flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer text-left transition-colors',
                  conv._id === currentConversationId
                    ? 'bg-accent-muted text-accent'
                    : 'hover:bg-surface text-text-secondary hover:text-text-primary'
                )}
                onClick={() => loadConversation(conv)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs truncate">{conv.title}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(conv._id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-error transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {!convsLoading && (!conversations || conversations.length === 0) && (
              <p className="text-xs text-text-muted text-center py-4">No conversations yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0">
          <div className="w-10 h-10 bg-accent-muted rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="font-bold text-text-primary text-sm">REPX AI Coach</h1>
            <p className="text-xs text-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-success rounded-full inline-block animate-pulse" />
              Online · {user?.onboarding?.preferredLanguage?.toUpperCase() || 'EN'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={startNewConversation}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="lg:hidden"
            >
              New
            </Button>
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface border border-border text-text-secondary hover:text-accent hover:border-accent transition-all cursor-pointer"
              title="Configure Google Gemini API Key"
            >
              <Key className="w-3.5 h-3.5 text-accent" />
              <span>{keyStatus?.isConfigured ? 'Gemini 1.5' : 'Configure Key'}</span>
            </button>
            <span
              className="badge badge-accent text-xs cursor-pointer select-none"
              onClick={() => setIsKeyModalOpen(true)}
              title="Click to view AI engine details"
            >
              <Sparkles className="w-3 h-3" />
              {keyStatus?.isConfigured ? 'Gemini AI' : 'AI Powered'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {localMessages.length === 0 && !isTyping ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-accent-muted rounded-2xl flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-lg font-bold text-text-primary mb-2">
                Hi {user?.name?.split(' ')[0]}! I'm your AI Coach 👋
              </h2>
              <p className="text-text-secondary text-sm mb-6 max-w-sm">
                Ask me anything about workouts, nutrition, or fitness. I'll give you personalized advice based on your goals.
              </p>
              {/* Suggested prompts */}
              <div className="grid sm:grid-cols-2 gap-2 w-full max-w-md">
                {SUGGESTED_PROMPTS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.text}
                      onClick={() => {
                        setInput(p.text);
                        textareaRef.current?.focus();
                      }}
                      className="flex items-center gap-2 p-3 bg-surface border border-border rounded-xl text-left text-sm text-text-secondary hover:border-accent/30 hover:text-text-primary transition-all duration-200"
                    >
                      <Icon className="w-4 h-4 text-accent flex-shrink-0" />
                      <span>{p.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              {localMessages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {isTyping && (
                <div className="flex gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-accent" />
                  </div>
                  <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-accent rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-surface border border-border rounded-2xl overflow-hidden focus-within:border-accent/50 transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your AI coach anything... (Enter to send)"
                rows={1}
                className="w-full bg-transparent px-4 py-3 text-sm text-text-primary placeholder-text-muted resize-none outline-none max-h-32"
                style={{ minHeight: '48px' }}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              isLoading={chatMutation.isPending}
              size="icon"
              className="rounded-2xl h-12 w-12 flex-shrink-0"
              id="ai-send-btn"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-text-muted text-center mt-2">
            AI responses are for informational purposes only. Consult a professional for medical advice.
          </p>
        </div>
      </div>

      {/* API Key Modal */}
      <AiApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSuccess={() => refetchKeyStatus()}
      />
    </div>
  );
};

export default AICoachPage;
