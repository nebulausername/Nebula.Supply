interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
}

export const KpiCard = ({ label, value, delta }: KpiCardProps) => (
  <div className="rounded-2xl border border-white/5 bg-surface/70 p-6 shadow-card">
    <p className="text-sm uppercase tracking-wide text-muted">{label}</p>
    <p className="mt-3 text-3xl font-semibold text-text">{value}</p>
    {delta && <p className="text-xs text-success">{delta}</p>}
  </div>
);
