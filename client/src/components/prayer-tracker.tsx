import { Sun, Cloud, Star } from 'lucide-react';
import { usePrayer } from '../contexts/prayer-context';
import { prayerNames, prayerTimes } from '../lib/prayer-utils';
import { PrayerType } from '@shared/schema';
import { cn } from '@/lib/utils';

const prayerIcons = {
  fajr: Sun,
  dhuhr: Sun,
  asr: Cloud,
  maghrib: Star,
  isha: Star,
};

const prayerColors = {
  fajr: 'bg-primary/10 text-primary',
  dhuhr: 'bg-secondary/10 text-secondary',
  asr: 'bg-accent/10 text-accent',
  maghrib: 'bg-destructive/10 text-destructive',
  isha: 'bg-primary/10 text-primary',
};

export function PrayerTracker() {
  const { todayPrayers, togglePrayer, isLoading } = usePrayer();

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div>
                  <div className="w-16 h-4 bg-muted rounded"></div>
                  <div className="w-24 h-3 bg-muted/70 rounded mt-2"></div>
                </div>
              </div>
              <div className="w-6 h-6 bg-muted rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-center" data-testid="text-todays-prayers">
        Today's Prayers
      </h3>
      <div className="space-y-4">
        {Object.entries(todayPrayers).map(([prayer, status]) => {
          const prayerKey = prayer as PrayerType;
          const Icon = prayerIcons[prayerKey];
          
          return (
            <div
              key={prayer}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:bg-muted/50 cursor-pointer",
                status.completed ? "bg-primary/5" : "bg-muted/30"
              )}
              onClick={() => togglePrayer(prayerKey)}
              data-testid={`prayer-item-${prayer}`}
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", prayerColors[prayerKey])}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground" data-testid={`text-prayer-name-${prayer}`}>
                    {prayerNames[prayerKey]}
                  </h4>
                  <p className="text-sm text-muted-foreground" data-testid={`text-prayer-time-${prayer}`}>
                    {prayer === 'fajr' && 'Dawn Prayer'} • {prayerTimes[prayerKey]}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={status.completed}
                onChange={() => togglePrayer(prayerKey)}
                className="prayer-checkbox"
                data-testid={`checkbox-prayer-${prayer}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
