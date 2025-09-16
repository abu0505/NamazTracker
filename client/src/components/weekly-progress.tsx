import { usePrayer } from '../contexts/prayer-context';
import { getWeeklyData, getTodayCompletedCount } from '../lib/prayer-utils';
import { cn } from '@/lib/utils';

export function WeeklyProgress() {
  const { todayPrayers, weekProgress, currentStreak, qazaCount } = usePrayer();
  const weeklyData = getWeeklyData();
  
  // Calculate progress ring
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (weekProgress / 100) * circumference;

  const todayCompleted = getTodayCompletedCount(todayPrayers);
  const completedPrayers = Math.round((weekProgress / 100) * 35);

  return (
    <section className="grid md:grid-cols-2 gap-6 mb-8">
      {/* Weekly Progress Circle */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 text-center" data-testid="text-weekly-progress-title">
          This Week's Progress
        </h3>
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="progress-ring w-32 h-32" viewBox="0 0 120 120">
              <circle 
                cx="60" 
                cy="60" 
                r="54" 
                stroke="var(--muted)" 
                strokeWidth="8" 
                fill="transparent"
              />
              <circle 
                className="progress-ring-circle" 
                cx="60" 
                cy="60" 
                r="54" 
                stroke="var(--primary)" 
                strokeWidth="8" 
                fill="transparent" 
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                data-testid="progress-ring-circle"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary" data-testid="text-week-percentage">
                  {weekProgress}%
                </div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <span data-testid="text-completed-prayers">{completedPrayers}</span> of{' '}
          <span data-testid="text-total-weekly-prayers">35</span> prayers
        </div>
      </div>

      {/* Quick Stats */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4" data-testid="text-quick-stats-title">Quick Stats</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Today's Prayers</span>
            <span className="font-semibold text-primary" data-testid="text-today-completed">
              {todayCompleted}/5
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Current Streak</span>
            <span className="font-semibold text-secondary" data-testid="text-current-streak">
              {currentStreak} days
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Qaza Counter</span>
            <span className="font-semibold text-destructive" data-testid="text-qaza-count">
              {qazaCount} prayers
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Weekly Progress</span>
            <span className="font-semibold text-accent" data-testid="text-weekly-progress">
              {weekProgress}%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WeeklyOverview() {
  const { todayPrayers } = usePrayer(); // Add context to trigger re-renders
  const weeklyData = getWeeklyData();

  const getStatusColor = (percentage: number) => {
    if (percentage === 100) return 'bg-primary';
    if (percentage >= 80) return 'bg-secondary';
    if (percentage >= 50) return 'bg-accent';
    if (percentage > 0) return 'bg-destructive';
    return 'bg-muted';
  };

  return (
    <section className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4" data-testid="text-weekly-overview-title">
        This Week Overview
      </h3>
      <div className="grid grid-cols-7 gap-2">
        {weeklyData.map((day, index) => (
          <div key={day.date} className="text-center">
            <div className="text-xs text-muted-foreground mb-2" data-testid={`text-day-${index}`}>
              {day.day}
            </div>
            <div className="w-full h-20 bg-muted/30 rounded-lg flex flex-col items-center justify-center gap-1">
              <div className="text-xs font-medium" data-testid={`text-day-completed-${index}`}>
                {day.completed}
              </div>
              <div className="text-xs text-muted-foreground">of 5</div>
              <div 
                className={cn(
                  "w-2 h-2 rounded-full",
                  getStatusColor(day.percentage),
                  day.percentage === 0 && "opacity-50"
                )}
                data-testid={`status-indicator-${index}`}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
