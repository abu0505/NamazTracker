import { DailyPrayers } from '../contexts/prayer-context';
import { apiService, convertPrayerRecordToDailyPrayers } from './api-service';

export const prayerNames = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export const prayerTimes = {
  fajr: '5:30 AM',
  dhuhr: '12:45 PM',
  asr: '4:15 PM',
  maghrib: '7:20 PM',
  isha: '8:45 PM',
};

export const prayerIcons = {
  fajr: '🌅',
  dhuhr: '☀️',
  asr: '🌤️',
  maghrib: '🌅',
  isha: '⭐',
};

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getWeekDates(): string[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
  
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push(date.toISOString().split('T')[0]);
  }
  
  return weekDates;
}

export function getMonthDates(): string[] {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const monthDates: string[] = [];
  for (let d = firstDay; d <= lastDay; d.setDate(d.getDate() + 1)) {
    monthDates.push(d.toISOString().split('T')[0]);
  }
  
  return monthDates;
}

export function getYearDates(): string[] {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), 0, 1);
  const lastDay = new Date(today.getFullYear(), 11, 31);
  
  const yearDates: string[] = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    yearDates.push(d.toISOString().split('T')[0]);
  }
  
  return yearDates;
}

// Get date range for a specific time period
export function getDateRangeForPeriod(period: 'week' | 'month' | 'year', referenceDate?: Date): { startDate: string; endDate: string; dates: string[] } {
  const today = referenceDate || new Date();
  
  switch (period) {
    case 'week': {
      const monday = new Date(today);
      monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
      
      const weekDates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        weekDates.push(date.toISOString().split('T')[0]);
      }
      
      return {
        startDate: weekDates[0],
        endDate: weekDates[6],
        dates: weekDates
      };
    }
    
    case 'month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const monthDates: string[] = [];
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        monthDates.push(d.toISOString().split('T')[0]);
      }
      
      return {
        startDate: monthDates[0],
        endDate: monthDates[monthDates.length - 1],
        dates: monthDates
      };
    }
    
    case 'year': {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      const lastDay = new Date(today.getFullYear(), 11, 31);
      
      const yearDates: string[] = [];
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        yearDates.push(d.toISOString().split('T')[0]);
      }
      
      return {
        startDate: yearDates[0],
        endDate: yearDates[yearDates.length - 1],
        dates: yearDates
      };
    }
    
    default:
      throw new Error(`Unsupported period: ${period}`);
  }
}

// Get analytics data for a specific time period
export async function getAnalyticsDataForPeriod(period: 'week' | 'month' | 'year') {
  try {
    const { startDate, endDate, dates } = getDateRangeForPeriod(period);
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    const prayerStats = {
      fajr: { completed: 0, total: 0 },
      dhuhr: { completed: 0, total: 0 },
      asr: { completed: 0, total: 0 },
      maghrib: { completed: 0, total: 0 },
      isha: { completed: 0, total: 0 },
    };
    
    dates.forEach(date => {
      const record = records.find(r => r.date === date);
      if (record && record.prayers) {
        const prayers = convertPrayerRecordToDailyPrayers(record);
        if (prayers) {
          Object.entries(prayers).forEach(([prayerName, prayer]) => {
            const prayerKey = prayerName as keyof typeof prayerStats;
            prayerStats[prayerKey].total++;
            if (prayer.completed) {
              prayerStats[prayerKey].completed++;
            }
          });
        }
      } else {
        // Count missing days as incomplete
        Object.keys(prayerStats).forEach(prayer => {
          prayerStats[prayer as keyof typeof prayerStats].total++;
        });
      }
    });
    
    return prayerStats;
  } catch (error) {
    console.error('Failed to get analytics data from API:', error);
    // Fallback to local storage for the requested period
    const { dates } = getDateRangeForPeriod(period);
    const prayerStats = {
      fajr: { completed: 0, total: 0 },
      dhuhr: { completed: 0, total: 0 },
      asr: { completed: 0, total: 0 },
      maghrib: { completed: 0, total: 0 },
      isha: { completed: 0, total: 0 },
    };
    
    dates.forEach(date => {
      const stored = localStorage.getItem(`prayers-${date}`);
      if (stored) {
        const prayers: DailyPrayers = JSON.parse(stored);
        Object.entries(prayers).forEach(([prayerName, prayer]) => {
          const prayerKey = prayerName as keyof typeof prayerStats;
          prayerStats[prayerKey].total++;
          if (prayer.completed) {
            prayerStats[prayerKey].completed++;
          }
        });
      } else {
        Object.keys(prayerStats).forEach(prayer => {
          prayerStats[prayer as keyof typeof prayerStats].total++;
        });
      }
    });
    
    return prayerStats;
  }
}

// Get trend chart data for a specific time period
export async function getTrendDataForPeriod(period: 'week' | 'month' | 'year') {
  try {
    const { startDate, endDate, dates } = getDateRangeForPeriod(period);
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    // Generate labels based on period
    let labels: string[];
    let dataPoints: number[];
    
    if (period === 'week') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      dataPoints = dates.map(date => {
        const record = records.find(r => r.date === date);
        if (record && record.prayers) {
          const prayers = convertPrayerRecordToDailyPrayers(record);
          return prayers ? getTodayCompletedCount(prayers) : 0;
        }
        return 0;
      });
    } else if (period === 'month') {
      // Group by week for month view
      const weekGroups: { [key: string]: number[] } = {};
      dates.forEach((date, index) => {
        const dateObj = new Date(date);
        const weekOfMonth = Math.ceil((dateObj.getDate() + new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getDay()) / 7);
        const weekKey = `Week ${weekOfMonth}`;
        
        if (!weekGroups[weekKey]) weekGroups[weekKey] = [];
        
        const record = records.find(r => r.date === date);
        let completed = 0;
        if (record && record.prayers) {
          const prayers = convertPrayerRecordToDailyPrayers(record);
          completed = prayers ? getTodayCompletedCount(prayers) : 0;
        }
        weekGroups[weekKey].push(completed);
      });
      
      labels = Object.keys(weekGroups);
      dataPoints = labels.map(week => {
        const weekData = weekGroups[week];
        return Math.round(weekData.reduce((sum, val) => sum + val, 0) / weekData.length);
      });
    } else {
      // Group by month for year view
      const monthGroups: { [key: string]: number[] } = {};
      dates.forEach(date => {
        const dateObj = new Date(date);
        const monthKey = dateObj.toLocaleString('default', { month: 'short' });
        
        if (!monthGroups[monthKey]) monthGroups[monthKey] = [];
        
        const record = records.find(r => r.date === date);
        let completed = 0;
        if (record && record.prayers) {
          const prayers = convertPrayerRecordToDailyPrayers(record);
          completed = prayers ? getTodayCompletedCount(prayers) : 0;
        }
        monthGroups[monthKey].push(completed);
      });
      
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      dataPoints = labels.map(month => {
        const monthData = monthGroups[month] || [];
        return monthData.length > 0 ? Math.round(monthData.reduce((sum, val) => sum + val, 0) / monthData.length) : 0;
      });
    }
    
    return {
      labels,
      dataPoints,
      period
    };
  } catch (error) {
    console.error('Failed to get trend data from API:', error);
    // Fallback to localStorage
    const { dates } = getDateRangeForPeriod(period);
    const labels = period === 'week' 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : period === 'month'
      ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dataPoints = labels.map((_, index) => {
      if (period === 'week' && index < dates.length) {
        const stored = localStorage.getItem(`prayers-${dates[index]}`);
        if (stored) {
          const prayers: DailyPrayers = JSON.parse(stored);
          return getTodayCompletedCount(prayers);
        }
      }
      return 0;
    });
    
    return { labels, dataPoints, period };
  }
}

// Get summary statistics for a time period
export async function getPeriodSummary(period: 'week' | 'month' | 'year') {
  try {
    const { startDate, endDate, dates } = getDateRangeForPeriod(period);
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    let totalPrayers = 0;
    let completedPrayers = 0;
    let onTimePrayers = 0;
    
    dates.forEach(date => {
      const record = records.find(r => r.date === date);
      if (record && record.prayers) {
        Object.values(record.prayers).forEach(prayer => {
          totalPrayers++;
          if (prayer.completed) {
            completedPrayers++;
            if (prayer.onTime) {
              onTimePrayers++;
            }
          }
        });
      } else {
        totalPrayers += 5; // 5 prayers per day
      }
    });
    
    const qazaPrayers = totalPrayers - completedPrayers;
    const successRate = totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0;
    
    return {
      totalPrayers: completedPrayers,
      totalPossible: totalPrayers,
      successRate,
      qazaPrayers,
      onTimePrayers,
      period
    };
  } catch (error) {
    console.error('Failed to get period summary from API:', error);
    return {
      totalPrayers: 0,
      totalPossible: 0,
      successRate: 0,
      qazaPrayers: 0,
      onTimePrayers: 0,
      period
    };
  }
}

export async function calculateWeekProgressFromAPI(): Promise<number> {
  try {
    const weekDates = getWeekDates();
    const startDate = weekDates[0];
    const endDate = weekDates[weekDates.length - 1];
    
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    let totalPrayers = 0;
    let completedPrayers = 0;
    
    weekDates.forEach(date => {
      const record = records.find(r => r.date === date);
      if (record && record.prayers) {
        Object.values(record.prayers).forEach(prayer => {
          totalPrayers++;
          if (prayer.completed) completedPrayers++;
        });
      } else {
        totalPrayers += 5; // 5 prayers per day if no record
      }
    });
    
    return totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0;
  } catch (error) {
    console.warn('Failed to calculate week progress from API, falling back to localStorage:', error);
    return calculateWeekProgress();
  }
}

export function calculateWeekProgress(): number {
  const weekDates = getWeekDates();
  let totalPrayers = 0;
  let completedPrayers = 0;
  
  weekDates.forEach(date => {
    const stored = localStorage.getItem(`prayers-${date}`);
    if (stored) {
      const prayers: DailyPrayers = JSON.parse(stored);
      Object.values(prayers).forEach(prayer => {
        totalPrayers++;
        if (prayer.completed) completedPrayers++;
      });
    } else {
      totalPrayers += 5; // 5 prayers per day
    }
  });
  
  return totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0;
}

export function calculateMonthProgress(): number {
  const monthDates = getMonthDates();
  let totalPrayers = 0;
  let completedPrayers = 0;
  
  monthDates.forEach(date => {
    const stored = localStorage.getItem(`prayers-${date}`);
    if (stored) {
      const prayers: DailyPrayers = JSON.parse(stored);
      Object.values(prayers).forEach(prayer => {
        totalPrayers++;
        if (prayer.completed) completedPrayers++;
      });
    } else {
      totalPrayers += 5; // 5 prayers per day
    }
  });
  
  return totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0;
}

export function getTodayCompletedCount(prayers: DailyPrayers): number {
  return Object.values(prayers).filter(prayer => prayer.completed).length;
}

// Enhanced achievement checking with multiple types
export async function checkAchievements(prayers: DailyPrayers, weekProgress: number, currentStreak: number, userStats?: any) {
  const achievements: Array<{ 
    type: string;
    title: string; 
    description: string;
    metadata?: any;
  }> = [];
  
  const todayCompleted = getTodayCompletedCount(prayers);
  const today = getTodayString();
  
  // Perfect Day Achievement
  if (todayCompleted === 5) {
    achievements.push({
      type: 'perfect_day',
      title: "Perfect Day",
      description: "All 5 prayers completed today!",
      metadata: { date: today, onTimePrayers: Object.values(prayers).filter(p => p.onTime).length }
    });
  }
  
  // Perfect Week Achievement
  if (weekProgress === 100) {
    const weekDates = getWeekDates();
    achievements.push({
      type: 'perfect_week',
      title: "Perfect Week",
      description: "All 35 prayers completed this week!",
      metadata: {
        weekNumber: getWeekNumber(new Date()),
        year: new Date().getFullYear(),
        dateRange: { start: weekDates[0], end: weekDates[6] }
      }
    });
  }
  
  // Streak Achievements
  const streakAchievements = checkStreakAchievements(currentStreak);
  achievements.push(...streakAchievements);
  
  // Prayer Count Milestones
  if (userStats) {
    const milestoneAchievements = checkPrayerMilestones(userStats.totalPrayers || 0);
    achievements.push(...milestoneAchievements);
    
    // Consistency Achievements
    const consistencyAchievements = await checkConsistencyAchievements(userStats);
    achievements.push(...consistencyAchievements);
  }
  
  // Perfect Month Achievement (check if we're at month end)
  const monthProgress = await calculateMonthProgressFromAPI();
  if (monthProgress === 100 && isEndOfMonth()) {
    achievements.push({
      type: 'perfect_month',
      title: "Perfect Month",
      description: "All prayers completed this month!",
      metadata: {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      }
    });
  }
  
  return achievements;
}

// Helper function to get week number
export function getWeekNumber(date: Date): number {
  const startDate = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil(days / 7);
}

// Check if it's the end of the month
export function isEndOfMonth(): boolean {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return tomorrow.getMonth() !== today.getMonth();
}

// Check streak-based achievements
export function checkStreakAchievements(currentStreak: number): Array<{ type: string; title: string; description: string; metadata: any }> {
  const achievements: Array<{ type: string; title: string; description: string; metadata: any }> = [];
  
  const streakMilestones = [7, 30, 50, 100, 200, 365];
  
  for (const milestone of streakMilestones) {
    if (currentStreak === milestone) {
      let title, description;
      
      switch (milestone) {
        case 7:
          title = "Week Warrior";
          description = "7-day prayer streak achieved!";
          break;
        case 30:
          title = "Monthly Master";
          description = "30-day prayer streak achieved!";
          break;
        case 50:
          title = "Consistency Champion";
          description = "50-day prayer streak achieved!";
          break;
        case 100:
          title = "Century Devotee";
          description = "100-day prayer streak achieved!";
          break;
        case 200:
          title = "Dedication Legend";
          description = "200-day prayer streak achieved!";
          break;
        case 365:
          title = "Yearly Devotee";
          description = "365-day prayer streak achieved!";
          break;
        default:
          title = `${milestone}-Day Streak`;
          description = `${milestone}-day prayer streak achieved!`;
      }
      
      achievements.push({
        type: 'streak_milestone',
        title,
        description,
        metadata: { streakDays: milestone, earnedDate: getTodayString() }
      });
      break; // Only award the current milestone
    }
  }
  
  return achievements;
}

// Check prayer count milestones
export function checkPrayerMilestones(totalPrayers: number): Array<{ type: string; title: string; description: string; metadata: any }> {
  const achievements: Array<{ type: string; title: string; description: string; metadata: any }> = [];
  
  const prayerMilestones = [50, 100, 250, 500, 1000, 2500, 5000];
  
  for (const milestone of prayerMilestones) {
    if (totalPrayers === milestone) {
      let title, description;
      
      switch (milestone) {
        case 50:
          title = "Prayer Beginner";
          description = "50 prayers completed!";
          break;
        case 100:
          title = "Prayer Enthusiast";
          description = "100 prayers completed!";
          break;
        case 250:
          title = "Prayer Devotee";
          description = "250 prayers completed!";
          break;
        case 500:
          title = "Prayer Champion";
          description = "500 prayers completed!";
          break;
        case 1000:
          title = "Prayer Master";
          description = "1000 prayers completed!";
          break;
        case 2500:
          title = "Prayer Legend";
          description = "2500 prayers completed!";
          break;
        case 5000:
          title = "Prayer Saint";
          description = "5000 prayers completed!";
          break;
        default:
          title = `${milestone} Prayers`;
          description = `${milestone} prayers completed!`;
      }
      
      achievements.push({
        type: 'prayer_milestone',
        title,
        description,
        metadata: { totalPrayers: milestone, earnedDate: getTodayString() }
      });
      break;
    }
  }
  
  return achievements;
}

// Check consistency-based achievements
export async function checkConsistencyAchievements(userStats: any): Promise<Array<{ type: string; title: string; description: string; metadata: any }>> {
  const achievements: Array<{ type: string; title: string; description: string; metadata: any }> = [];
  
  try {
    // Calculate recent consistency (last 30 days)
    const monthSummary = await getPeriodSummary('month');
    const consistencyRate = monthSummary.successRate;
    
    // Early Bird Achievement - High Fajr completion rate
    const weekSummary = await getPeriodSummary('week');
    if (weekSummary.successRate >= 90) {
      // Check if this is specifically for consistent week performance
      achievements.push({
        type: 'consistency',
        title: "Consistent Devotee",
        description: "90%+ prayer completion this week!",
        metadata: {
          consistencyRate: weekSummary.successRate,
          period: 'week',
          earnedDate: getTodayString()
        }
      });
    }
    
    // Monthly Consistency
    if (consistencyRate >= 80 && isEndOfMonth()) {
      achievements.push({
        type: 'consistency',
        title: "Monthly Consistency",
        description: "80%+ prayer completion this month!",
        metadata: {
          consistencyRate,
          period: 'month',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          earnedDate: getTodayString()
        }
      });
    }
  } catch (error) {
    console.warn('Failed to check consistency achievements:', error);
  }
  
  return achievements;
}

// Calculate month progress from API
export async function calculateMonthProgressFromAPI(): Promise<number> {
  try {
    const monthSummary = await getPeriodSummary('month');
    return monthSummary.successRate;
  } catch (error) {
    console.warn('Failed to calculate month progress from API:', error);
    return calculateMonthProgress();
  }
}

export async function getWeeklyDataFromAPI() {
  try {
    const weekDates = getWeekDates();
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const startDate = weekDates[0];
    const endDate = weekDates[weekDates.length - 1];
    
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    return weekDates.map((date, index) => {
      const record = records.find(r => r.date === date);
      let completed = 0;
      
      if (record && record.prayers) {
        const prayers = convertPrayerRecordToDailyPrayers(record);
        if (prayers) {
          completed = getTodayCompletedCount(prayers);
        }
      }
      
      return {
        day: weekDays[index],
        date,
        completed,
        total: 5,
        percentage: Math.round((completed / 5) * 100),
      };
    });
  } catch (error) {
    console.warn('Failed to get weekly data from API, falling back to localStorage:', error);
    return getWeeklyData();
  }
}

export function getWeeklyData() {
  const weekDates = getWeekDates();
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return weekDates.map((date, index) => {
    const stored = localStorage.getItem(`prayers-${date}`);
    let completed = 0;
    
    if (stored) {
      const prayers: DailyPrayers = JSON.parse(stored);
      completed = getTodayCompletedCount(prayers);
    }
    
    return {
      day: weekDays[index],
      date,
      completed,
      total: 5,
      percentage: Math.round((completed / 5) * 100),
    };
  });
}

export async function getPrayerAnalyticsFromAPI() {
  try {
    const monthDates = getMonthDates();
    const startDate = monthDates[0];
    const endDate = monthDates[monthDates.length - 1];
    
    const records = await apiService.getPrayerRecords(startDate, endDate);
    
    const prayerStats = {
      fajr: { completed: 0, total: 0 },
      dhuhr: { completed: 0, total: 0 },
      asr: { completed: 0, total: 0 },
      maghrib: { completed: 0, total: 0 },
      isha: { completed: 0, total: 0 },
    };
    
    monthDates.forEach(date => {
      const record = records.find(r => r.date === date);
      if (record && record.prayers) {
        const prayers = convertPrayerRecordToDailyPrayers(record);
        if (prayers) {
          Object.entries(prayers).forEach(([prayerName, prayer]) => {
            const prayerKey = prayerName as keyof typeof prayerStats;
            prayerStats[prayerKey].total++;
            if (prayer.completed) {
              prayerStats[prayerKey].completed++;
            }
          });
        }
      } else {
        // Count missing days as incomplete
        Object.keys(prayerStats).forEach(prayer => {
          prayerStats[prayer as keyof typeof prayerStats].total++;
        });
      }
    });
    
    return prayerStats;
  } catch (error) {
    console.warn('Failed to get prayer analytics from API, falling back to localStorage:', error);
    return getPrayerAnalytics();
  }
}

export function getPrayerAnalytics() {
  const monthDates = getMonthDates();
  const prayerStats = {
    fajr: { completed: 0, total: 0 },
    dhuhr: { completed: 0, total: 0 },
    asr: { completed: 0, total: 0 },
    maghrib: { completed: 0, total: 0 },
    isha: { completed: 0, total: 0 },
  };
  
  monthDates.forEach(date => {
    const stored = localStorage.getItem(`prayers-${date}`);
    if (stored) {
      const prayers: DailyPrayers = JSON.parse(stored);
      Object.entries(prayers).forEach(([prayerName, prayer]) => {
        const prayerKey = prayerName as keyof typeof prayerStats;
        prayerStats[prayerKey].total++;
        if (prayer.completed) {
          prayerStats[prayerKey].completed++;
        }
      });
    } else {
      // Count missing days as incomplete
      Object.keys(prayerStats).forEach(prayer => {
        prayerStats[prayer as keyof typeof prayerStats].total++;
      });
    }
  });
  
  return prayerStats;
}

export function getCurrentStreak(): number {
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) { // Check up to a year back
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    const stored = localStorage.getItem(`prayers-${dateString}`);
    if (stored) {
      const prayers: DailyPrayers = JSON.parse(stored);
      const completed = getTodayCompletedCount(prayers);
      
      if (completed === 5) {
        streak++;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  
  return streak;
}

export function getQazaCount(): number {
  // Calculate missed prayers from the past 30 days
  let qazaCount = 0;
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    const stored = localStorage.getItem(`prayers-${dateString}`);
    if (stored) {
      const prayers: DailyPrayers = JSON.parse(stored);
      Object.values(prayers).forEach(prayer => {
        if (!prayer.completed) {
          qazaCount++;
        }
      });
    } else {
      qazaCount += 5; // All 5 prayers missed if no data
    }
  }
  
  return qazaCount;
}
