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
  Filler,
} from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import { getTrendDataForPeriod, getAnalyticsDataForPeriod, getPeriodSummary } from '../lib/prayer-utils';
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
  BarElement,
  Filler
);

export function AnalyticsCharts() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  const timePeriods = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  // Fetch trend data for the selected period
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['/analytics/trend', selectedPeriod],
    queryFn: () => getTrendDataForPeriod(selectedPeriod),
  });

  // Fetch analytics data for the selected period
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/analytics/data', selectedPeriod],
    queryFn: () => getAnalyticsDataForPeriod(selectedPeriod),
  });

  // Fetch summary statistics for the selected period
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['/analytics/summary', selectedPeriod],
    queryFn: () => getPeriodSummary(selectedPeriod),
  });

  const isLoading = trendLoading || analyticsLoading || summaryLoading;

  // Main trend chart data
  const mainChartData = {
    labels: trendData?.labels || [],
    datasets: [
      {
        label: 'Completed Prayers',
        data: trendData?.dataPoints || [],
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
        data: analyticsData ? Object.values(analyticsData).map(prayer => 
          prayer.total > 0 ? Math.round((prayer.completed / prayer.total) * 100) : 0
        ) : [0, 0, 0, 0, 0],
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

  // Period comparison chart data (reuses trend data for consistency)
  const comparisonData = {
    labels: trendData?.labels || [],
    datasets: [
      {
        label: 'Prayers Completed',
        data: trendData?.dataPoints || [],
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

  // Statistics from summary data
  const totalPrayers = summaryData?.totalPrayers || 0;
  const totalPossible = summaryData?.totalPossible || 0;
  const successRate = summaryData?.successRate || 0;
  const totalQaza = summaryData?.qazaPrayers || 0;

  // Dynamic titles based on period
  const comparisonTitle = selectedPeriod === 'week' 
    ? 'Weekly Comparison' 
    : selectedPeriod === 'month' 
    ? 'Monthly Comparison' 
    : 'Yearly Comparison';

  const trendTitle = `Prayer Completion Trend (${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)})`;

  if (isLoading) {
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

        {/* Loading Skeletons */}
        <div className="glass-card rounded-2xl p-6">
          <div className="h-6 bg-muted rounded mb-4 w-48 animate-pulse"></div>
          <div className="h-64 bg-muted rounded animate-pulse"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="h-6 bg-muted rounded mb-4 w-32 animate-pulse"></div>
            <div className="h-48 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="h-6 bg-muted rounded mb-4 w-32 animate-pulse"></div>
            <div className="h-48 bg-muted rounded animate-pulse"></div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6 text-center">
              <div className="h-8 bg-muted rounded mb-4 mx-auto w-8 animate-pulse"></div>
              <div className="h-6 bg-muted rounded mb-2 w-24 mx-auto animate-pulse"></div>
              <div className="h-8 bg-muted rounded mb-2 w-16 mx-auto animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-32 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
          {trendTitle}
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
            {comparisonTitle}
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
