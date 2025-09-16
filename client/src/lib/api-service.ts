import { apiRequest } from './queryClient';
import { PrayerRecord, Achievement, UserStats } from '@shared/schema';
import { DailyPrayers } from '../contexts/prayer-context';

export interface PrayerApiService {
  // Prayer records
  getPrayerRecord(date: string): Promise<PrayerRecord | null>;
  savePrayerRecord(date: string, prayers: DailyPrayers): Promise<PrayerRecord>;
  getPrayerRecords(startDate?: string, endDate?: string): Promise<PrayerRecord[]>;

  // User statistics  
  getUserStats(): Promise<UserStats>;
  updateUserStats(updates: Partial<UserStats>): Promise<UserStats>;

  // Achievements
  getAchievements(): Promise<Achievement[]>;
  createAchievement(achievement: Omit<Achievement, 'id' | 'userId' | 'createdAt'>): Promise<Achievement>;
}

class ApiService implements PrayerApiService {
  async getPrayerRecord(date: string): Promise<PrayerRecord | null> {
    try {
      const response = await fetch(`/api/prayers/${date}`, {
        credentials: 'include',
      });
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prayer record: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching prayer record:', error);
      return null;
    }
  }

  async savePrayerRecord(date: string, prayers: DailyPrayers): Promise<PrayerRecord> {
    const response = await apiRequest('POST', '/api/prayers', {
      date,
      prayers,
    });
    
    return await response.json();
  }

  async getPrayerRecords(startDate?: string, endDate?: string): Promise<PrayerRecord[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `/api/prayers${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prayer records: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching prayer records:', error);
      return [];
    }
  }

  async getUserStats(): Promise<UserStats> {
    try {
      const response = await fetch('/api/stats', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user stats: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Return default stats if API fails
      return {
        id: 'default',
        userId: 'demo-user',
        totalPrayers: 0,
        onTimePrayers: 0,
        qazaPrayers: 0,
        currentStreak: 0,
        bestStreak: 0,
        perfectWeeks: 0,
        lastStreakUpdate: null,
        updatedAt: new Date(),
      };
    }
  }

  async updateUserStats(updates: Partial<UserStats>): Promise<UserStats> {
    const response = await apiRequest('PATCH', '/api/stats', updates);
    return await response.json();
  }

  async getAchievements(): Promise<Achievement[]> {
    try {
      const response = await fetch('/api/achievements', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch achievements: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  }

  async createAchievement(achievement: Omit<Achievement, 'id' | 'userId' | 'createdAt'>): Promise<Achievement> {
    const response = await apiRequest('POST', '/api/achievements', achievement);
    return await response.json();
  }
}

export const apiService = new ApiService();

// Helper function to convert backend PrayerRecord to DailyPrayers format
export function convertPrayerRecordToDailyPrayers(record: PrayerRecord | null): DailyPrayers | null {
  if (!record || !record.prayers) {
    return null;
  }

  return {
    fajr: record.prayers.fajr,
    dhuhr: record.prayers.dhuhr,
    asr: record.prayers.asr,
    maghrib: record.prayers.maghrib,
    isha: record.prayers.isha,
  };
}

// Helper function to convert DailyPrayers to PrayerRecord prayers format
export function convertDailyPrayersToPrayerRecord(prayers: DailyPrayers): PrayerRecord['prayers'] {
  return {
    fajr: prayers.fajr,
    dhuhr: prayers.dhuhr,
    asr: prayers.asr,
    maghrib: prayers.maghrib,
    isha: prayers.isha,
  };
}