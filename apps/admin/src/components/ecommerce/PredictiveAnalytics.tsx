import React, { useCallback, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LineChart } from '../ui/charts/LineChart';
import { useRealtimeShop, ShopRealtimeEvent } from '../../lib/websocket/useRealtimeShop';
import { Sparkles, Zap } from 'lucide-react';

interface ForecastPoint {
  day: string;
  revenue: number;
  forecast: number;
  lower: number;
  upper: number;
}

const formatEuro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const generateForecast = (): ForecastPoint[] => {
  const today = new Date();
  return Array.from({ length: 14 }).map((_, index) => {
    const date = new Date(today.getTime() + index * 24 * 60 * 60 * 1000);
    const baseline = 18000 + Math.random() * 6000;
    const trend = index * 600;
    const seasonality = Math.sin(index / 3) * 2000;
    const forecast = baseline + trend + seasonality;
    return {
      day: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      revenue: baseline,
      forecast,
      lower: forecast * 0.92,
      upper: forecast * 1.08
    };
  });
};

const recommendationsSeed = [
  { title: 'Scale Paid Social +20%', impact: '+12% Revenue lift', priority: 'High' },
  { title: 'Launch VIP Bundle', impact: '+8% Conversion', priority: 'Medium' },
  { title: 'Optimize Drops CTA', impact: '+5% Session CR', priority: 'Medium' }
];

export const PredictiveAnalytics: React.FC = () => {
  const [forecastData, setForecastData] = useState<ForecastPoint[]>(generateForecast);
  const [recommendations, setRecommendations] = useState(recommendationsSeed);

  const expectedRevenue = useMemo(() => forecastData.reduce((sum, point) => sum + point.forecast, 0), [forecastData]);

  const refreshForecast = useCallback(() => {
    setForecastData(generateForecast());
  }, []);

  const handleAnalyticsUpdate = useCallback((event: ShopRealtimeEvent) => {
    if (event.type !== 'analytics:updated') return;
    setForecastData((prev) => prev.map((point, index) => index === prev.length - 1
      ? { ...point, forecast: point.forecast * 1.05, upper: point.upper * 1.06 }
      : point
    ));
    setRecommendations((prev) => [{ title: 'Upsell high performers', impact: '+3% AOV', priority: 'High' }, ...prev].slice(0, 4));
  }, []);

  useRealtimeShop({
    channels: ['analytics'],
    onAnalyticsUpdated: handleAnalyticsUpdate
  });

  return (
    <Card className="p-6 border border-white/10 bg-black/25">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-white">Predictive Analytics & Forecasting</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2">
            Forecast Werte für die nächsten 14 Tage, inklusive Confidence Interval und AI-Empfehlungen.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-white/15 text-white/70">Expected Revenue {formatEuro.format(expectedRevenue)}</Badge>
          <Button size="sm" variant="outline" className="gap-1 text-[11px]" onClick={refreshForecast}>
            <Sparkles className="w-3 h-3" /> Re-run Forecast
          </Button>
        </div>
      </div>

      <LineChart
        data={forecastData}
        xKey="day"
        lines={[
          { dataKey: 'revenue', name: 'Baseline', color: '#38bdf8', strokeWidth: 2 },
          { dataKey: 'forecast', name: 'Forecast', color: '#f97316', strokeWidth: 3 }
        ]}
        title="Revenue Forecast (14 Tage)"
        description="Baseline vs. Forecast inklusive Trend & Saisonalität"
        height={360}
        showLegend
        formatValue={(value) => formatEuro.format(value)}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {recommendations.map((rec) => (
          <div key={rec.title} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-300" /> {rec.title}
              </p>
              <Badge variant="outline" className="border-white/15 text-white/60 text-[11px]">{rec.priority}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Impact: {rec.impact}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

