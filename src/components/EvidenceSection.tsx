interface EvidenceSectionProps {
  title: string;
  items: string[];
  variant: "for" | "against";
}

export default function EvidenceSection({
  title,
  items,
  variant,
}: EvidenceSectionProps) {
  if (!items || items.length === 0) return null;

  const iconColor = variant === "for" ? "text-green-600" : "text-amber-600";
  const borderColor =
    variant === "for" ? "border-green-200" : "border-amber-200";
  const bgColor = variant === "for" ? "bg-green-50" : "bg-amber-50";

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-4`}>
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`mt-0.5 ${iconColor}`}>
              {variant === "for" ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              )}
            </span>
            <span className="text-sm text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
