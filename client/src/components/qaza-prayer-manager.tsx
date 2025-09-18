import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Save, X, Sun, Cloud, Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { apiService, convertPrayerRecordToDailyPrayers } from '@/lib/api-service';
import { prayerNames } from '@/lib/prayer-utils';
import { PrayerType, PrayerRecord } from '@shared/schema';
import { DailyPrayers } from '@/contexts/prayer-context';
import { apiRequest } from '@/lib/queryClient';
import { createAuthAwareQuery } from '@/lib/authUtils';

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

const defaultPrayers: DailyPrayers = {
  fajr: { completed: false, onTime: false },
  dhuhr: { completed: false, onTime: false },
  asr: { completed: false, onTime: false },
  maghrib: { completed: false, onTime: false },
  isha: { completed: false, onTime: false },
};

export function QazaPrayerManager() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [editedPrayers, setEditedPrayers] = useState<DailyPrayers>(defaultPrayers);
  const [originalPrayers, setOriginalPrayers] = useState<DailyPrayers>(defaultPrayers);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectedDateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  // Fetch prayer data for selected date
  const { data: prayerRecord, isLoading: isLoadingPrayers, refetch } = useQuery<PrayerRecord | null>({
    queryKey: ['/api/prayers', selectedDateString],
    queryFn: createAuthAwareQuery(() => apiService.getPrayerRecord(selectedDateString)),
    enabled: !!selectedDateString,
    staleTime: 0, // Always refetch to get latest data
  });

  // Save prayer changes mutation
  const savePrayersMutation = useMutation({
    mutationFn: async (data: { date: string; prayers: DailyPrayers }) => {
      const response = await apiRequest('POST', '/api/prayers', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Changes Saved! ✅",
        description: "Prayer record has been updated successfully.",
      });
      
      // Invalidate and refetch relevant queries for cache consistency
      queryClient.invalidateQueries({ queryKey: ['/api/prayers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/analytics/trend'] });
      queryClient.invalidateQueries({ queryKey: ['/analytics/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/analytics/data'] });
      
      // Update original prayers to reflect saved state
      setOriginalPrayers(editedPrayers);
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Failed to save prayer record:', error);
      toast({
        title: "Save Failed ❌",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update prayers when data is fetched
  useEffect(() => {
    if (prayerRecord) {
      const prayers = convertPrayerRecordToDailyPrayers(prayerRecord);
      if (prayers) {
        setEditedPrayers(prayers);
        setOriginalPrayers(prayers);
        setHasChanges(false);
      }
    } else if (selectedDateString) {
      // No data for this date, use default prayers
      setEditedPrayers(defaultPrayers);
      setOriginalPrayers(defaultPrayers);
      setHasChanges(false);
    }
  }, [prayerRecord, selectedDateString]);

  // Check if prayers have changed from original
  useEffect(() => {
    const changed = Object.keys(editedPrayers).some(prayer => {
      const prayerKey = prayer as PrayerType;
      return editedPrayers[prayerKey].completed !== originalPrayers[prayerKey].completed;
    });
    setHasChanges(changed);
  }, [editedPrayers, originalPrayers]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date && date <= new Date()) {
      setSelectedDate(date);
      setIsDatePickerOpen(false);
    }
  };

  const togglePrayer = (prayer: PrayerType) => {
    const currentTime = new Date().toISOString();
    setEditedPrayers(prev => ({
      ...prev,
      [prayer]: {
        ...prev[prayer],
        completed: !prev[prayer].completed,
        completedAt: !prev[prayer].completed ? currentTime : undefined,
      }
    }));
  };

  const handleSave = () => {
    if (!selectedDateString) return;
    
    savePrayersMutation.mutate({
      date: selectedDateString,
      prayers: editedPrayers,
    });
  };

  const handleCancel = () => {
    setEditedPrayers(originalPrayers);
    setHasChanges(false);
  };

  const isPastDate = (date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2" data-testid="text-qaza-title">
          Qaza Prayer Management
        </h2>
        <p className="text-muted-foreground" data-testid="text-qaza-description">
          Select a past date to view and edit prayer records
        </p>
      </div>

      {/* Date Picker */}
      <div className="flex justify-center">
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal glass-card",
                !selectedDate && "text-muted-foreground"
              )}
              data-testid="button-date-picker"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" data-testid="popover-calendar">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date > new Date() || date < new Date('2020-01-01')}
              initialFocus
              data-testid="calendar-date-picker"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Prayer Status Display */}
      {selectedDate && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold" data-testid="text-selected-date">
              Prayer Status for {format(selectedDate, "MMMM d, yyyy")}
            </h3>
          </div>

          {/* Loading State */}
          {isLoadingPrayers ? (
            <div className="animate-pulse space-y-4" data-testid="loading-prayers">
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
          ) : (
            /* Prayer List */
            <div className="space-y-3">
              {Object.entries(editedPrayers).map(([prayer, status]) => {
                const prayerKey = prayer as PrayerType;
                const Icon = prayerIcons[prayerKey];
                
                return (
                  <div
                    key={prayer}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:bg-muted/50",
                      status.completed ? "bg-primary/5" : "bg-muted/30"
                    )}
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
                        <p className="text-sm text-muted-foreground" data-testid={`text-prayer-status-${prayer}`}>
                          {status.completed ? 'Completed' : 'Missed'}
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      checked={status.completed}
                      onCheckedChange={() => togglePrayer(prayerKey)}
                      className="h-5 w-5"
                      data-testid={`checkbox-prayer-${prayer}`}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          {selectedDate && !isLoadingPrayers && (
            <div className="flex justify-center gap-3 pt-4">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={!hasChanges || savePrayersMutation.isPending}
                className="min-w-[100px]"
                data-testid="button-cancel"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || savePrayersMutation.isPending}
                className="min-w-[100px]"
                data-testid="button-save"
              >
                {savePrayersMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {savePrayersMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      )}

      {!selectedDate && (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg" data-testid="text-no-date-selected">
            Select a date to manage prayer records
          </p>
        </div>
      )}
    </div>
  );
}