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

export function checkAchievements(prayers: DailyPrayers, weekProgress: number) {
  const achievements: Array<{ title: string; description: string }> = [];
  
  // Check if all prayers for today are completed
  const todayCompleted = getTodayCompletedCount(prayers);
  if (todayCompleted === 5) {
    achievements.push({
      title: "Perfect Day",
      description: "All 5 prayers completed today!"
    });
  }
  
  // Check if week is completed
  if (weekProgress === 100) {
    achievements.push({
      title: "Perfect Week",
      description: "All 35 prayers completed this week!"
    });
  }
  
  return achievements;
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
