export type TimelineItem = {
  time: string;
  text: string;
  type: "success" | "warning" | "info";
};

interface TimelineProps {
  items: TimelineItem[];
}

const colors: Record<TimelineItem["type"], string> = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-accent"
};

export const Timeline = ({ items }: TimelineProps) => (
  <ol className="space-y-4">
    {items.map((item) => (
      <li key={item.time} className="flex items-start gap-3">
        <div className={`mt-1 h-2 w-2 rounded-full ${colors[item.type]}`} aria-hidden />
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">{item.time}</p>
          <p className="text-sm text-text">{item.text}</p>
        </div>
      </li>
    ))}
  </ol>
);
