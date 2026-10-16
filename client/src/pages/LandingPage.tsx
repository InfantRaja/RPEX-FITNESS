import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Dumbbell, Brain, TrendingUp, Salad, Shield,
  ChevronRight, Star, Check, ArrowRight, Play
} from 'lucide-react';
import Button from '../components/ui/Button';

const features = [
  {
    icon: Dumbbell,
    title: 'Smart Workout Tracking',
    description: 'Log every exercise, set, and rep with ease. Track strength gains and workout history.',
    color: 'text-accent bg-accent-muted',
  },
  {
    icon: Salad,
    title: 'Nutrition Intelligence',
    description: 'Monitor macros, calories, and meal timing. Get personalized nutrition plans.',
    color: 'text-info bg-info/10',
  },
  {
    icon: Brain,
    title: 'AI-Powered Coaching',
    description: 'Chat with your personal AI coach anytime. Multilingual support in 12+ languages.',
    color: 'text-success bg-success/10',
  },
  {
    icon: TrendingUp,
    title: 'Advanced Analytics',
    description: 'Visualize your progress with detailed charts. Track weight, measurements, and more.',
    color: 'text-warning bg-warning/10',
  },
  {
    icon: Zap,
    title: 'Personalized Plans',
    description: 'AI-generated workout and meal plans tailored to your goals and preferences.',
    color: 'text-error bg-error/10',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is encrypted and secure. Sign in with Google or email.',
    color: 'text-text-secondary bg-surface',
  },
];

const goals = [
  'Muscle Building', 'Fat Loss', 'Strength', 'Weight Gain', 'Maintenance', 'General Fitness',
];

const testimonials = [
  {
    name: 'Alex M.',
    goal: 'Lost 18kg in 5 months',
    text: 'REPX Tracker completely transformed my fitness journey. The AI coach is like having a personal trainer 24/7!',
    rating: 5,
  },
  {
    name: 'Sarah K.',
    goal: 'Gained 8kg muscle',
    text: 'The nutrition tracking and AI recommendations helped me finally achieve my muscle building goals.',
    rating: 5,
  },
  {
    name: 'James R.',
    goal: 'Improved strength by 40%',
    text: 'The workout logging is seamless and the analytics show me exactly where to improve. Game changer!',
    rating: 5,
  },
];

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-background" fill="currentColor" />
            </div>
            <span className="font-black text-lg">
              <span className="text-text-primary">REPX</span>
              <span className="text-accent"> Tracker</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-muted border border-accent/20 text-accent text-xs font-semibold mb-8 animate-fade-in">
            <Zap className="w-3 h-3" />
            AI-Powered Fitness Tracker
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-6 animate-slide-up text-balance">
            Track Every Rep.{' '}
            <span className="gradient-text block">Build Your Best.</span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
            The ultimate AI-powered fitness tracker. Log workouts, monitor nutrition, 
            track progress, and get personalized coaching — all in one sleek app.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link to="/register">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Start For Free
              </Button>
            </Link>
            <Button variant="secondary" size="lg" leftIcon={<Play className="w-4 h-4" />}>
              Watch Demo
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 mt-14 text-center animate-fade-in">
            {[
              { value: '50K+', label: 'Athletes' },
              { value: '2M+', label: 'Workouts Logged' },
              { value: '12+', label: 'Languages' },
              { value: '4.9★', label: 'Rating' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-3xl font-black gradient-text">{stat.value}</div>
                <div className="text-sm text-text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Goals Ticker */}
      <section className="py-8 border-y border-border overflow-hidden">
        <div className="flex gap-6 animate-none">
          <div className="flex gap-6 min-w-max">
            {[...goals, ...goals].map((goal, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border whitespace-nowrap">
                <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <span className="text-sm font-medium text-text-secondary">{goal}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Everything you need to{' '}
              <span className="gradient-text">crush your goals</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              Powerful features designed for serious athletes and beginners alike.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="card p-6 hover:border-accent/30 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-text-primary mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Real Results from Real Athletes</h2>
            <p className="text-text-secondary text-lg">Join thousands who have transformed their fitness with REPX.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-text-primary text-sm">{t.name}</p>
                  <p className="text-xs text-accent mt-0.5">{t.goal}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card p-12 border-accent/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
            <h2 className="text-4xl font-black mb-4 relative">
              Ready to Build{' '}
              <span className="gradient-text">Your Best?</span>
            </h2>
            <p className="text-text-secondary mb-8 text-lg relative">
              Join REPX Tracker today. Free to start, no credit card required.
            </p>
            <Link to="/register" className="relative">
              <Button size="lg" rightIcon={<ChevronRight className="w-5 h-5" />}>
                Start Your Journey Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center">
              <Zap className="w-3 h-3 text-background" fill="currentColor" />
            </div>
            <span className="text-sm font-bold text-text-secondary">REPX Tracker</span>
          </div>
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} REPX Tracker. Track Every Rep. Build Your Best.
          </p>
          <div className="flex gap-4 text-xs text-text-muted">
            <Link to="/login" className="hover:text-accent transition-colors">Login</Link>
            <Link to="/register" className="hover:text-accent transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
