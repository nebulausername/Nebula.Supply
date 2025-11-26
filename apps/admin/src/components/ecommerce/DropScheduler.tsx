import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { useDrops, useUpdateDrop } from '../../lib/api/hooks';
import { Clock, Flame, MoveRight, Power, Sparkles, TimerReset, Calendar, Repeat, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

interface ScheduledDrop {
  id: string;
  name: string;
  status: string;
  access: string;
  start: number;
  end: number;
  durationHours: number;
  countdownMs: number;
  badge?: string;
  flavorTag?: string;
}

const generateSchedule = (drop: any, index: number): ScheduledDrop => {
  const now = Date.now();
  const baseStart = drop.deadlineAt ? Date.parse(drop.deadlineAt) - 1000 * 60 * 60 * 24 : now + index * 1000 * 60 * 60 * 24;
  const baseEnd = drop.deadlineAt ? Date.parse(drop.deadlineAt) : baseStart + 1000 * 60 * 60 * 24 * (drop.progress ? Math.max(1, drop.progress * 5) : 2);
  const start = isNaN(baseStart) ? now + index * 1000 * 60 * 60 * 24 : baseStart;
  const end = isNaN(baseEnd) ? start + 1000 * 60 * 60 * 24 * 2 : baseEnd;
  const durationHours = Math.max(1, Math.round((end - start) / (1000 * 60 * 60)));
  const countdownMs = Math.max(0, start - now);

  return {
    id: drop.id,
    name: drop.name,
    status: drop.status,
    access: drop.access,
    start,
    end,
    durationHours,
    countdownMs,
    badge: drop.badge,
    flavorTag: drop.flavorTag
  };
};

const formatDuration = (hours: number) => {
  if (hours < 24) return `${hours} Stunden`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days} Tage${remainingHours ? ` ${remainingHours} h` : ''}`;
};

const formatCountdown = (ms: number) => {
  if (ms <= 0) return 'Live';
  const minutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
};

export const DropScheduler: React.FC = () => {
  const { data: dropsResponse } = useDrops({ limit: 100 });
  const drops: any[] = useMemo(() => {
    if (!dropsResponse) return [];
    if (Array.isArray((dropsResponse as any).data)) return (dropsResponse as any).data;
    if ((dropsResponse as any).data?.data) return (dropsResponse as any).data.data;
    return [];
  }, [dropsResponse]);

  const [now, setNow] = useState(Date.now());
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [autoActivation, setAutoActivation] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const updateDropMutation = useUpdateDrop();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const map: Record<string, boolean> = {};
    drops.forEach((drop) => {
      map[drop.id] = drop.status !== 'active';
    });
    setAutoActivation(map);
  }, [drops]);

  const scheduledDrops: ScheduledDrop[] = useMemo(() => drops.map(generateSchedule), [drops]);

  const filteredDrops = useMemo(() => {
    if (!scheduledDrops.length) return [];
    const horizon = range === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    return scheduledDrops.filter((drop) => drop.start < now + horizon);
  }, [scheduledDrops, range, now]);

  const rangeStart = useMemo(() => {
    if (!filteredDrops.length) return now;
    return Math.min(now, ...filteredDrops.map((drop) => drop.start));
  }, [filteredDrops, now]);

  const rangeEnd = useMemo(() => {
    if (!filteredDrops.length) return now + (range === '7d' ? 7 : 30) * 24 * 60 * 60 * 1000;
    return Math.max(...filteredDrops.map((drop) => drop.end));
  }, [filteredDrops, range]);

  const totalRange = Math.max(1, rangeEnd - rangeStart);

  const recommendations = useMemo(() => {
    return filteredDrops
      .filter((drop) => drop.status !== 'active')
      .slice(0, 5)
      .map((drop) => ({
        id: drop.id,
        name: drop.name,
        suggestedStart: new Date(drop.start - 1000 * 60 * 60 * 6).toISOString(),
        reason: drop.flavorTag ? `Flavor ${drop.flavorTag} performt stark (` + drop.flavorTag + `)` : 'Hohe Nachfrage / neues Fenster',
        countdown: formatCountdown(drop.countdownMs)
      }));
  }, [filteredDrops]);

  // Detect conflicts
  const conflicts = useMemo(() => {
    const conflictsList: Array<{ drop1: ScheduledDrop; drop2: ScheduledDrop }> = [];
    for (let i = 0; i < filteredDrops.length; i++) {
      for (let j = i + 1; j < filteredDrops.length; j++) {
        const drop1 = filteredDrops[i];
        const drop2 = filteredDrops[j];
        // Check if time ranges overlap
        if (
          (drop1.start <= drop2.start && drop2.start < drop1.end) ||
          (drop2.start <= drop1.start && drop1.start < drop2.end)
        ) {
          conflictsList.push({ drop1, drop2 });
        }
      }
    }
    return conflictsList;
  }, [filteredDrops]);

  // Calendar view helper
  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  }, []);

  const calendarDays = useMemo(() => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedDate);
    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      const dropsOnDay = filteredDrops.filter(
        drop => {
          const dropDate = new Date(drop.start);
          return dropDate.getDate() === day && 
                 dropDate.getMonth() === selectedDate.getMonth() &&
                 dropDate.getFullYear() === selectedDate.getFullYear();
        }
      );
      days.push({ day, date, drops: dropsOnDay });
    }
    return days;
  }, [selectedDate, filteredDrops, getDaysInMonth]);

  return (
    <Card className="p-6 border border-white/10 bg-slate-950/40 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-white">Smart Drop Scheduler</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2">
            Visualisiere Releases, plane Launches mit Auto-Aktivierung und nutze AI-basierte Empfehlungen für optimale Drop Slots.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('timeline')}
            >
              Timeline
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Kalender
            </Button>
          </div>
          <Select value={range} onValueChange={(value: '7d' | '30d') => setRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Next 7 Days</SelectItem>
              <SelectItem value="30d">Next 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="border-white/10 text-white/70">
            <Clock className="w-3 h-3 mr-1" /> {new Date(now).toLocaleString('de-DE')}
          </Badge>
        </div>
      </div>

      {/* Conflict Warning */}
      {conflicts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-orange-500/20 border border-orange-500/50 rounded-lg flex items-center gap-2"
        >
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <span className="text-sm text-orange-300">
            {conflicts.length} Konflikt{conflicts.length !== 1 ? 'e' : ''} erkannt - Überlappende Zeitfenster
          </span>
        </motion.div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card className="p-4 mb-6 bg-black/25 border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">
              {selectedDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}
              >
                ←
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedDate(new Date())}
              >
                Heute
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}
              >
                →
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {calendarDays.map((dayData, index) => (
              <div
                key={index}
                className={cn(
                  "min-h-[80px] p-2 border border-white/10 rounded",
                  dayData && dayData.drops.length > 0 && "bg-purple-500/10 border-purple-500/30"
                )}
              >
                {dayData && (
                  <>
                    <div className="text-sm font-medium mb-1">{dayData.day}</div>
                    {dayData.drops.map(drop => (
                      <div
                        key={drop.id}
                        className="text-xs bg-purple-500/20 rounded px-1 py-0.5 mb-1 truncate"
                        title={drop.name}
                      >
                        {drop.name}
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="relative border border-white/10 rounded-xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 px-4 py-6">
        <div className="absolute left-8 right-8 top-4 flex justify-between text-[11px] text-muted-foreground uppercase tracking-wide">
          <span>Jetzt</span>
          <span>{range === '7d' ? '7 Tage' : '30 Tage'} Horizont</span>
        </div>
        <div className="mt-8 h-40 relative">
          <div className="absolute inset-0 border-t border-dashed border-white/10" />
          {filteredDrops.map((drop) => {
            const left = Math.max(0, ((drop.start - rangeStart) / totalRange) * 100);
            const width = Math.max(12, ((drop.end - drop.start) / totalRange) * 100);
            const live = drop.start <= now && now <= drop.end;
            return (
              <div
                key={drop.id}
                className="absolute top-6"
                style={{ left: `${left}%`, width: `${width}%`, minWidth: '12%' }}
              >
                <div
                  className={cn(
                    'rounded-lg border px-4 py-3 shadow-lg transition-all duration-300',
                    live ? 'border-green-400/60 bg-green-500/10' : 'border-white/15 bg-white/5 hover:border-white/30'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white truncate">{drop.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{formatDuration(drop.durationHours)}</p>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px]', live ? 'border-green-400/40 text-green-200' : 'border-white/20 text-white/70')}>
                      {live ? 'Live' : formatCountdown(drop.countdownMs)}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr,1fr]">
        <Card className="p-5 border border-white/10 bg-black/25">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-white">Auto Activation & Monitoring</h4>
              <p className="text-xs text-muted-foreground">Auto-Launch toggles und Quick Actions je Drop</p>
            </div>
            <Badge variant="outline" className="border-white/15 text-white/70">{filteredDrops.length} geplant</Badge>
          </div>
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredDrops.map((drop) => (
              <div key={drop.id} className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{drop.name}</p>
                    <p className="text-xs text-muted-foreground">Access: {drop.access} · Status: {drop.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-purple-400/40 text-purple-200 text-[11px]">{formatCountdown(drop.countdownMs)}</Badge>
                    <button
                      className={cn(
                        'relative inline-flex h-6 w-10 items-center rounded-full border transition-colors duration-200',
                        autoActivation[drop.id] ? 'bg-green-500/30 border-green-400/50' : 'bg-white/10 border-white/20'
                      )}
                      onClick={() => setAutoActivation((prev) => ({ ...prev, [drop.id]: !prev[drop.id] }))}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
                          autoActivation[drop.id] ? 'translate-x-4' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><TimerReset className="w-3 h-3" /> Start: {new Date(drop.start).toLocaleString('de-DE')}</span>
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> Ende: {new Date(drop.end).toLocaleString('de-DE')}</span>
                  {drop.flavorTag && <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Flavor: {drop.flavorTag}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="xs" className="gap-1 text-[11px]" disabled={!autoActivation[drop.id]}>
                    <Power className="w-3 h-3" /> Auto Launch
                  </Button>
                  <Button variant="outline" size="xs" className="gap-1 text-[11px]">
                    <MoveRight className="w-3 h-3" /> Reschedule
                  </Button>
                </div>
              </div>
            ))}
            {filteredDrops.length === 0 && (
              <div className="text-sm text-muted-foreground py-12 text-center">
                Keine Drops im ausgewählten Zeitraum.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5 border border-white/10 bg-black/15">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-white">Smart Recommendations</h4>
              <p className="text-xs text-muted-foreground">AI-basierte Startfenster & Aktionen</p>
            </div>
            <Badge variant="outline" className="border-white/15 text-white/70">{recommendations.length} Tipps</Badge>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{rec.name}</p>
                  <Badge variant="outline" className="border-green-400/40 text-green-200 text-[11px]">{rec.countdown}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Suggested Start: {new Date(rec.suggestedStart).toLocaleString('de-DE')}</p>
                <p className="text-xs text-muted-foreground mt-1">Reason: {rec.reason}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Button size="xs" className="gap-1 text-[11px]">
                    <Sparkles className="w-3 h-3" /> Apply Suggestion
                  </Button>
                  <Button size="xs" variant="outline" className="gap-1 text-[11px]">
                    <Power className="w-3 h-3" /> Auto Activate
                  </Button>
                </div>
              </div>
            ))}
            {recommendations.length === 0 && (
              <div className="text-sm text-muted-foreground py-10 text-center">
                Keine Empfehlungen aktuell – plane manuell oder optimiere Zeitfenster.
              </div>
            )}
          </div>
        </Card>
      </div>
    </Card>
  );
};

