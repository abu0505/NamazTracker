import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePrayer } from '../contexts/prayer-context';
import { 
  getWeeklyData, 
  getTodayCompletedCount, 
  getCalendarWeekData, 
  getCalendarMonthData,
  getWeekStart,
  formatDateRange
} from '../lib/prayer-utils';
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
  const { todayPrayers } = usePrayer();
  const [viewType, setViewType] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCalendarData();
  }, [viewType, currentDate, todayPrayers]);

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      if (viewType === 'week') {
        const weekStart = getWeekStart(currentDate);
        const data = await getCalendarWeekData(weekStart);
        setCalendarData(data);
      } else {
        const data = await getCalendarMonthData(currentDate);
        setCalendarData(data);
      }
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewType === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'text-primary';
    if (percentage >= 80) return 'text-secondary';
    if (percentage >= 50) return 'text-accent';
    if (percentage > 0) return 'text-destructive';
    return 'text-muted';
  };

  const dateRange = formatDateRange(viewType, viewType === 'week' ? getWeekStart(currentDate) : currentDate);

  return (
    <section className="glass-card rounded-2xl p-6">
      {/* Header with toggle and navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewType('week')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              viewType === 'week' 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}
            data-testid="button-view-week"
          >
            Week
          </button>
          <button
            onClick={() => setViewType('month')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              viewType === 'month' 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}
            data-testid="button-view-month"
          >
            Month
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-muted/20 rounded-full transition-colors"
            data-testid="button-calendar-prev"
            aria-label="Previous period"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-muted/20 rounded-full transition-colors"
            data-testid="button-calendar-next"
            aria-label="Next period"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {isLoading ? (
        <div className="animate-pulse">
          <div className="grid grid-cols-7 gap-2">
            {[...Array(viewType === 'week' ? 7 : 35)].map((_, i) => (
              <div key={i} className="h-20 bg-muted/30 rounded-lg" />
            ))}
          </div>
        </div>
      ) : viewType === 'week' ? (
        <div className="grid grid-cols-7 gap-3" data-testid="calendar-week-view">
          {calendarData.map((day: any, index: number) => (
            <div 
              key={day.date} 
              className="text-center"
              data-testid={`calendar-day-${index}`}
            >
              <div className="text-xs font-medium text-muted-foreground mb-2" data-testid={`text-day-name-${index}`}>
                {day.dayName}
              </div>
              <div className={cn(
                "w-full p-3 rounded-lg flex flex-col items-center justify-center gap-2",
                day.isToday ? "bg-primary/10 border-2 border-primary" : "bg-muted/30"
              )}>
                <div className="text-lg font-bold text-foreground" data-testid={`text-day-number-${index}`}>
                  {day.dayNumber}
                </div>
                
                {/* Circular progress indicator */}
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
                    <circle 
                      cx="20" 
                      cy="20" 
                      r="16" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      fill="transparent"
                      className="text-muted/30"
                    />
                    <circle 
                      cx="20" 
                      cy="20" 
                      r="16" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      fill="transparent" 
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 16}`}
                      strokeDashoffset={`${2 * Math.PI * 16 * (1 - day.completionPercentage / 100)}`}
                      className={cn(
                        "transition-all",
                        getProgressColor(day.completionPercentage)
                      )}
                      data-testid={`progress-circle-${index}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-foreground" data-testid={`text-percentage-${index}`}>
                      {day.completionPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div data-testid="calendar-month-view">
          {/* Month view header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Month calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarData.map((day: any, index: number) => (
              <div 
                key={day.date}
                className={cn(
                  "aspect-square p-2 rounded-lg flex flex-col items-center justify-center gap-1",
                  day.isToday && "bg-primary/10 border-2 border-primary",
                  !day.isToday && day.isCurrentMonth && "bg-muted/30",
                  !day.isCurrentMonth && "bg-transparent opacity-40"
                )}
                data-testid={`calendar-month-day-${index}`}
              >
                <div className={cn(
                  "text-sm font-medium",
                  day.isToday ? "text-primary font-bold" : "text-foreground"
                )} data-testid={`text-month-day-${index}`}>
                  {day.dayNumber}
                </div>
                
                {/* Circular progress indicator */}
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                    <circle 
                      cx="16" 
                      cy="16" 
                      r="12" 
                      stroke="currentColor" 
                      strokeWidth="3" 
                      fill="transparent"
                      className="text-muted/30"
                    />
                    <circle 
                      cx="16" 
                      cy="16" 
                      r="12" 
                      stroke="currentColor" 
                      strokeWidth="3" 
                      fill="transparent" 
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 12}`}
                      strokeDashoffset={`${2 * Math.PI * 12 * (1 - day.completionPercentage / 100)}`}
                      className={cn(
                        "transition-all",
                        getProgressColor(day.completionPercentage)
                      )}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[0.6rem] font-semibold text-foreground">
                      {day.completionPercentage > 0 ? day.completionPercentage : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date Range Footer */}
      <div className="mt-6 text-center text-sm text-muted-foreground" data-testid="text-date-range">
        {dateRange}
      </div>
    </section>
  );
}
