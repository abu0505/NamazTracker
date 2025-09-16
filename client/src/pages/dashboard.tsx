import { PrayerTracker } from '../components/prayer-tracker';
import { WeeklyProgress, WeeklyOverview } from '../components/weekly-progress';

export default function Dashboard() {
  return (
    <div className="space-y-8" data-testid="page-dashboard">
      <section>
        <h2 className="text-2xl font-bold mb-6 text-center" data-testid="text-page-title">
          Today's Prayers
        </h2>
        <PrayerTracker />
      </section>

      <WeeklyProgress />
      <WeeklyOverview />
    </div>
  );
}
