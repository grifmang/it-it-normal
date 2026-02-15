import { TimelineEvent } from "@/lib/types";

function parseTimelineDate(dateString: string): Date | null {
  const parsed = new Date(dateString);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTimelineDate(dateString: string): string {
  const parsed = parseTimelineDate(dateString);
  if (!parsed) return "Date pending verification";

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Timeline({ events }: { events: TimelineEvent[] }) {
  if (!events || events.length === 0) return null;

  const sorted = [...events].sort((a, b) => {
    const aDate = parseTimelineDate(a.date);
    const bDate = parseTimelineDate(b.date);

    if (aDate && bDate) return aDate.getTime() - bDate.getTime();
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    return 0;
  });

  return (
    <div className="relative">
      <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />
      <ul className="space-y-4">
        {sorted.map((event, i) => (
          <li key={i} className="relative flex items-start gap-4 pl-8">
            <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-blue-800 bg-white" />
            <div>
              <time className="text-xs font-semibold text-blue-800">
                {formatTimelineDate(event.date)}
              </time>
              <p className="mt-0.5 text-sm text-gray-700">
                {event.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
