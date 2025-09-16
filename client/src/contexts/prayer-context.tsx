import React, { createContext, useContext, useState, useEffect } from 'react';
import { PrayerType, PrayerStatus } from '@shared/schema';
import { calculateWeekProgress, getTodayString, checkAchievements, getTodayCompletedCount, getWeekDates } from '@/lib/prayer-utils';
import { useToast } from '@/hooks/use-toast';
import { apiService, convertPrayerRecordToDailyPrayers } from '@/lib/api-service';

export interface DailyPrayers {
  fajr: PrayerStatus;
  dhuhr: PrayerStatus;
  asr: PrayerStatus;
  maghrib: PrayerStatus;
  isha: PrayerStatus;
}

export interface PrayerContextType {
  todayPrayers: DailyPrayers;
  weekProgress: number;
  currentStreak: number;
  qazaCount: number;
  togglePrayer: (prayer: PrayerType) => void;
  isLoading: boolean;
}

const PrayerContext = createContext<PrayerContextType | undefined>(undefined);

const defaultPrayers: DailyPrayers = {
  fajr: { completed: false, onTime: false },
  dhuhr: { completed: false, onTime: false },
  asr: { completed: false, onTime: false },
  maghrib: { completed: false, onTime: false },
  isha: { completed: false, onTime: false },
};

export function PrayerProvider({ children }: { children: React.ReactNode }) {
  const [todayPrayers, setTodayPrayers] = useState<DailyPrayers>(defaultPrayers);
  const [weekProgress, setWeekProgress] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [qazaCount, setQazaCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load today's prayers from localStorage on mount
  useEffect(() => {
    loadTodayPrayers();
    loadUserStats();
  }, []);

  const loadTodayPrayers = async () => {
    try {
      const today = getTodayString();
      
      // Try to load from API first
      const apiRecord = await apiService.getPrayerRecord(today);
      if (apiRecord) {
        const apiPrayers = convertPrayerRecordToDailyPrayers(apiRecord);
        if (apiPrayers) {
          setTodayPrayers(apiPrayers);
          // Also save to localStorage for fallback
          localStorage.setItem(`prayers-${today}`, JSON.stringify(apiPrayers));
          const progress = calculateWeekProgress();
          setWeekProgress(progress);
          setIsLoading(false);
          return;
        }
      }
      
      // Fallback to localStorage if API fails or returns null
      const stored = localStorage.getItem(`prayers-${today}`);
      if (stored) {
        const prayers = JSON.parse(stored);
        setTodayPrayers(prayers);
        // Try to sync to backend if we have localStorage data but no API data
        try {
          await apiService.savePrayerRecord(today, prayers);
        } catch (error) {
          console.warn('Failed to sync localStorage data to API:', error);
        }
      }
      
      // Calculate week progress
      const progress = calculateWeekProgress();
      setWeekProgress(progress);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load prayers:', error);
      setIsLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      // Try to load from API first
      const apiStats = await apiService.getUserStats();
      if (apiStats) {
        setCurrentStreak(apiStats.currentStreak || 0);
        setQazaCount(apiStats.qazaPrayers || 0);
        // Save to localStorage for fallback
        localStorage.setItem('currentStreak', (apiStats.currentStreak || 0).toString());
        localStorage.setItem('qazaCount', (apiStats.qazaPrayers || 0).toString());
        return;
      }
      
      // Fallback to localStorage if API fails
      const streak = localStorage.getItem('currentStreak');
      const qaza = localStorage.getItem('qazaCount');
      
      if (streak) setCurrentStreak(parseInt(streak));
      if (qaza) setQazaCount(parseInt(qaza));
    } catch (error) {
      console.error('Failed to load user stats:', error);
      // Fallback to localStorage on error
      const streak = localStorage.getItem('currentStreak');
      const qaza = localStorage.getItem('qazaCount');
      
      if (streak) setCurrentStreak(parseInt(streak));
      if (qaza) setQazaCount(parseInt(qaza));
    }
  };

  const saveTodayPrayers = async (prayers: DailyPrayers) => {
    try {
      const today = getTodayString();
      
      // Save to localStorage immediately for fast UI updates
      localStorage.setItem(`prayers-${today}`, JSON.stringify(prayers));
      
      // Try to save to API
      try {
        await apiService.savePrayerRecord(today, prayers);
      } catch (error) {
        console.warn('Failed to save prayers to API, saved to localStorage only:', error);
      }
      
      // Update week progress
      const progress = calculateWeekProgress();
      setWeekProgress(progress);
      
      // Check for achievements (prevent duplicates using localStorage)
      const achievements = checkAchievements(prayers, progress);
      const completedCount = getTodayCompletedCount(prayers);
      
      achievements.forEach(async (achievement: { title: string; description: string }) => {
        // Use different dedup keys: per day for Perfect Day, per week for Perfect Week
        let achievementKey: string;
        let shouldShow = false;
        
        if (achievement.title === "Perfect Day" && completedCount === 5) {
          achievementKey = `${achievement.title}-${today}`;
          shouldShow = !localStorage.getItem(achievementKey);
        } else if (achievement.title === "Perfect Week") {
          // Use week start date for Perfect Week deduplication
          const weekDates = getWeekDates();
          const weekStart = weekDates[0]; // Monday of current week
          achievementKey = `${achievement.title}-${weekStart}`;
          shouldShow = !localStorage.getItem(achievementKey);
        }
        
        if (shouldShow && achievementKey!) {
          localStorage.setItem(achievementKey, 'true');
          
          // Try to save achievement to API
          try {
            await apiService.createAchievement({
              type: achievement.title.toLowerCase().replace(' ', '_'),
              title: achievement.title,
              description: achievement.description,
              earnedDate: today,
              metadata: {
                onTimePrayers: completedCount,
                year: new Date().getFullYear(),
              },
            });
          } catch (error) {
            console.warn('Failed to save achievement to API:', error);
          }
          
          toast({
            title: "Achievement Unlocked! 🏆",
            description: achievement.description,
            duration: 5000,
          });
        }
      });
    } catch (error) {
      console.error('Failed to save prayers:', error);
    }
  };

  const togglePrayer = (prayer: PrayerType) => {
    const currentTime = new Date().toISOString();
    const newPrayers = {
      ...todayPrayers,
      [prayer]: {
        completed: !todayPrayers[prayer].completed,
        onTime: !todayPrayers[prayer].completed, // Assume on-time if completed now
        completedAt: !todayPrayers[prayer].completed ? currentTime : undefined,
      }
    };
    
    setTodayPrayers(newPrayers);
    saveTodayPrayers(newPrayers);
    
    // Show celebration toast
    if (newPrayers[prayer].completed) {
      toast({
        title: "Prayer Completed! ✅",
        description: `${prayer.charAt(0).toUpperCase() + prayer.slice(1)} prayer marked as completed`,
        duration: 2000,
      });
    }
  };

  return (
    <PrayerContext.Provider
      value={{
        todayPrayers,
        weekProgress,
        currentStreak,
        qazaCount,
        togglePrayer,
        isLoading,
      }}
    >
      {children}
    </PrayerContext.Provider>
  );
}

export function usePrayer() {
  const context = useContext(PrayerContext);
  if (context === undefined) {
    throw new Error('usePrayer must be used within a PrayerProvider');
  }
  return context;
}
