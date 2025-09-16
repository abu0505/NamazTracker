import React, { createContext, useContext, useState, useEffect } from 'react';
import { PrayerType, PrayerStatus } from '@shared/schema';
import { calculateWeekProgress, getTodayString, checkAchievements } from '@/lib/prayer-utils';
import { useToast } from '@/hooks/use-toast';

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

  const loadTodayPrayers = () => {
    try {
      const today = getTodayString();
      const stored = localStorage.getItem(`prayers-${today}`);
      if (stored) {
        const prayers = JSON.parse(stored);
        setTodayPrayers(prayers);
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

  const loadUserStats = () => {
    try {
      const streak = localStorage.getItem('currentStreak');
      const qaza = localStorage.getItem('qazaCount');
      
      if (streak) setCurrentStreak(parseInt(streak));
      if (qaza) setQazaCount(parseInt(qaza));
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const saveTodayPrayers = (prayers: DailyPrayers) => {
    try {
      const today = getTodayString();
      localStorage.setItem(`prayers-${today}`, JSON.stringify(prayers));
      
      // Update week progress
      const progress = calculateWeekProgress();
      setWeekProgress(progress);
      
      // Check for achievements
      const achievements = checkAchievements(prayers, progress);
      achievements.forEach((achievement: { title: string; description: string }) => {
        toast({
          title: "Achievement Unlocked! 🏆",
          description: achievement.description,
          duration: 5000,
        });
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
