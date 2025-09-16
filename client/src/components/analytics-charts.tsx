import { useState } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { getWeeklyData, getPrayerAnalytics, getTodayCompletedCount } from '../lib/prayer-utils';
import { usePrayer } from '../contexts/prayer-context';
import { cn } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

export function AnalyticsCharts() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const { todayPrayers } = usePrayer();
  
  const weeklyData = getWeeklyData();
  const prayerAnalytics = getPrayerAnalytics();

  const timePeriods = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  // Main trend chart data
  const mainChartData = {
    labels: weeklyData.map(day => day.day),
    datasets: [
      {
        label: 'Completed Prayers',
        data: weeklyData.map(day => day.completed),
        borderColor: 'hsl(158, 70%, 20%)',
        backgroundColor: 'hsla(158, 70%, 20%, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const mainChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        grid: {
          color: 'hsl(214.3, 31.8%, 91.4%)',
        },
      },
      x: {
        grid: {
          color: 'hsl(214.3, 31.8%, 91.4%)',
        },
      },
    },
  };

  // Prayer distribution chart data
  const distributionData = {
    labels: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
    datasets: [
      {
        data: Object.values(prayerAnalytics).map(prayer => 
          prayer.total > 0 ? Math.round((prayer.completed / prayer.total) * 100) : 0
        ),
        backgroundColor: [
          'hsl(158, 70%, 20%)',
          'hsl(28, 80%, 45%)',
          'hsl(199, 89%, 48%)',
          'hsl(0, 84.2%, 60.2%)',
          'hsl(158, 60%, 30%)',
        ],
      },
    ],
  };

  const distributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  // Weekly comparison chart data
  const comparisonData = {
    labels: weeklyData.map(day => day.day),
    datasets: [
      {
        label: 'Prayers Completed',
        data: weeklyData.map(day => day.completed),
        backgroundColor: 'hsl(158, 70%, 20%)',
        borderRadius: 8,
      },
    ],
  };

  const comparisonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
      },
    },
  };

  // Calculate statistics
  const totalPrayers = Object.values(prayerAnalytics).reduce((sum, prayer) => sum + prayer.completed, 0);
  const totalPossible = Object.values(prayerAnalytics).reduce((sum, prayer) => sum + prayer.total, 0);
  const successRate = totalPossible > 0 ? Math.round((totalPrayers / totalPossible) * 100) : 0;
  const totalQaza = totalPossible - totalPrayers;

  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex justify-center gap-2">
          {timePeriods.map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                selectedPeriod === period.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              data-testid={`period-${period.value}`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4" data-testid="text-prayer-completion-trend">
          Prayer Completion Trend
        </h3>
        <div className="h-64">
          <Line data={mainChartData} options={mainChartOptions} />
        </div>
      </div>

      {/* Prayer-specific Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4" data-testid="text-prayer-distribution">
            Prayer Distribution
          </h3>
          <div className="h-48">
            <Doughnut data={distributionData} options={distributionOptions} />
          </div>
        </div>
        
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4" data-testid="text-weekly-comparison">
            Weekly Comparison
          </h3>
          <div className="h-48">
            <Bar data={comparisonData} options={comparisonOptions} />
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">🤲</div>
          <h4 className="text-lg font-semibold mb-2" data-testid="text-total-prayers-title">
            Total Prayers
          </h4>
          <p className="text-2xl font-bold text-primary" data-testid="text-total-prayers">
            {totalPrayers}
          </p>
          <p className="text-sm text-muted-foreground">Since tracking started</p>
        </div>
        
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">📊</div>
          <h4 className="text-lg font-semibold mb-2" data-testid="text-success-rate-title">
            Success Rate
          </h4>
          <p className="text-2xl font-bold text-secondary" data-testid="text-success-rate">
            {successRate}%
          </p>
          <p className="text-sm text-muted-foreground">Overall completion rate</p>
        </div>
        
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">⏰</div>
          <h4 className="text-lg font-semibold mb-2" data-testid="text-qaza-prayers-title">
            Qaza Prayers
          </h4>
          <p className="text-2xl font-bold text-destructive" data-testid="text-total-qaza">
            {totalQaza}
          </p>
          <p className="text-sm text-muted-foreground">Need to be completed</p>
        </div>
      </div>
    </div>
  );
}
