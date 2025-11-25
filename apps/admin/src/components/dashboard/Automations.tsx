import { Card } from '../ui/Card';

export function Automations() {
  // Mock data - würde später aus API kommen
  const automations = [
    { id: 'auto-routing', label: 'SLA Routing', value: '92% on target', trend: '+4%' },
    { id: 'auto-replies', label: 'Auto Replies', value: '68 deflected', trend: '+9' },
    { id: 'sentiment-alerts', label: 'Sentiment Alerts', value: '5 triggered', trend: '-2' }
  ];

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-3">Automations</h2>
      <div className="space-y-2">
        {automations.map((automation) => (
          <div key={automation.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-4 py-3">
            <div>
              <p className="text-text">{automation.label}</p>
              {automation.trend && (
                <p className={`text-xs ${automation.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {automation.trend}
                </p>
              )}
            </div>
            <span className="font-semibold text-text">{automation.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
