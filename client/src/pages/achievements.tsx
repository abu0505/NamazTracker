import { useState, useEffect } from 'react';
import { Flame, Clock, Mountain, Calendar } from 'lucide-react';
import { AchievementCard, MilestoneProgress } from '../components/achievement-card';
import { usePrayer } from '../contexts/prayer-context';
import { Achievement } from '@shared/schema';

export default function Achievements() {
  const { currentStreak } = usePrayer();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    // Load achievements from localStorage
    const stored = localStorage.getItem('achievements');
    if (stored) {
      setAchievements(JSON.parse(stored));
    }

    const storedBestStreak = localStorage.getItem('bestStreak');
    if (storedBestStreak) {
      setBestStreak(parseInt(storedBestStreak));
    }
  }, []);

  // Mock milestones data
  const milestones = [
    {
      title: "100 Days Streak",
      description: "Complete prayers for 100 consecutive days",
      current: currentStreak,
      target: 100,
      icon: Calendar,
      color: "bg-primary",
    },
    {
      title: "Early Bird",
      description: "Complete Fajr for 30 consecutive days",
      current: Math.min(currentStreak, 7), // Mock data
      target: 30,
      icon: Clock,
      color: "bg-secondary",
    },
    {
      title: "Perfect Month",
      description: "Complete all prayers in a month",
      current: 78, // Mock data
      target: 150,
      icon: Mountain,
      color: "bg-accent",
    },
  ];

  return (
    <div className="space-y-8" data-testid="page-achievements">
      <h2 className="text-2xl font-bold text-center" data-testid="text-achievements-title">
        Achievements
      </h2>
      
      {/* Current Streak Card */}
      <div className="glass-card rounded-2xl p-6 text-center animate-float">
        <div className="w-20 h-20 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Flame className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2" data-testid="text-current-streak-title">
          Current Streak
        </h3>
        <p className="text-3xl font-bold text-primary mb-2" data-testid="text-current-streak-value">
          {currentStreak} Days
        </p>
        <p className="text-muted-foreground">
          Keep going! Your best streak is{' '}
          <span className="font-semibold" data-testid="text-best-streak">
            {Math.max(bestStreak, currentStreak)} days
          </span>
        </p>
      </div>

      {/* Achievement Cards Grid */}
      {achievements.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement, index) => (
            <AchievementCard 
              key={achievement.id} 
              achievement={achievement} 
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2" data-testid="text-no-achievements">
            No Achievements Yet
          </h3>
          <p className="text-muted-foreground">
            Complete your first perfect week to unlock your first achievement!
          </p>
        </div>
      )}

      {/* Milestone Progress */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4" data-testid="text-milestones-title">
          Milestones
        </h3>
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <MilestoneProgress
              key={milestone.title}
              title={milestone.title}
              description={milestone.description}
              current={milestone.current}
              target={milestone.target}
              icon={milestone.icon}
              color={milestone.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
