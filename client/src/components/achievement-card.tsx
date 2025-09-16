import { Trophy, Star, Medal, Calendar } from 'lucide-react';
import { Achievement } from '@shared/schema';
import { cn } from '@/lib/utils';

interface AchievementCardProps {
  achievement: Achievement;
  index: number;
}

const achievementIcons = {
  perfect_week: Trophy,
  streak_milestone: Star,
  perfect_month: Medal,
  consistency: Calendar,
};

const achievementGradients = [
  'from-primary to-accent',
  'from-secondary to-destructive',
  'from-accent to-primary',
  'from-destructive to-secondary',
];

export function AchievementCard({ achievement, index }: AchievementCardProps) {
  const Icon = achievementIcons[achievement.type as keyof typeof achievementIcons] || Trophy;
  const gradient = achievementGradients[index % achievementGradients.length];

  return (
    <div 
      className="glass-card rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
      data-testid={`achievement-card-${index}`}
    >
      <div className="text-center mb-4">
        <div className={cn(
          "w-16 h-16 bg-gradient-to-br rounded-full flex items-center justify-center mx-auto mb-3",
          gradient
        )}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h4 className="font-semibold text-foreground" data-testid={`achievement-title-${index}`}>
          {achievement.title}
        </h4>
        <p className="text-sm text-muted-foreground" data-testid={`achievement-description-${index}`}>
          {achievement.description}
        </p>
      </div>
      <div className="border-t pt-4 text-sm text-muted-foreground space-y-1">
        <p data-testid={`achievement-date-${index}`}>
          <strong>Date:</strong> {new Date(achievement.earnedDate).toLocaleDateString()}
        </p>
        {achievement.metadata?.weekNumber && achievement.metadata?.year && (
          <p data-testid={`achievement-week-${index}`}>
            <strong>Week:</strong> {achievement.metadata.weekNumber} of {achievement.metadata.year}
          </p>
        )}
        {achievement.metadata?.onTimePrayers !== undefined && (
          <p data-testid={`achievement-ontime-${index}`}>
            <strong>On-time:</strong> {achievement.metadata.onTimePrayers} prayers
          </p>
        )}
        {achievement.metadata?.qazaPrayers !== undefined && (
          <p data-testid={`achievement-qaza-${index}`}>
            <strong>Qaza:</strong> {achievement.metadata.qazaPrayers} prayers
          </p>
        )}
      </div>
    </div>
  );
}

interface MilestoneProgressProps {
  title: string;
  description: string;
  current: number;
  target: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export function MilestoneProgress({ title, description, current, target, icon: Icon, color }: MilestoneProgressProps) {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div className="flex items-center justify-between" data-testid={`milestone-${title.toLowerCase().replace(' ', '-')}`}>
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-medium" data-testid={`milestone-title-${title.toLowerCase().replace(' ', '-')}`}>
            {title}
          </p>
          <p className="text-sm text-muted-foreground" data-testid={`milestone-description-${title.toLowerCase().replace(' ', '-')}`}>
            {description}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-medium", color.replace('bg-', 'text-'))} data-testid={`milestone-progress-${title.toLowerCase().replace(' ', '-')}`}>
          {current}/{target}
        </p>
        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-300", color)}
            style={{ width: `${percentage}%` }}
            data-testid={`milestone-bar-${title.toLowerCase().replace(' ', '-')}`}
          />
        </div>
      </div>
    </div>
  );
}
