interface ProgressBarProps {
  value: number;
}

export const ProgressBar = ({ value }: ProgressBarProps) => (
  <div className="w-full rounded-full bg-surface/50 p-[3px]">
    <div
      className="h-2 w-full rounded-full bg-accent transition-all"
      style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
    />
  </div>
);
