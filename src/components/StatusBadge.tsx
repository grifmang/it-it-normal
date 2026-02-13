import { ClaimStatus, STATUS_LABELS } from "@/lib/types";

const STATUS_STYLES: Record<ClaimStatus, string> = {
  verified: "bg-green-50 text-green-700 ring-green-600/20",
  mixed: "bg-amber-50 text-amber-700 ring-amber-600/20",
  unsupported: "bg-red-50 text-red-700 ring-red-600/20",
  unresolved: "bg-gray-50 text-gray-700 ring-gray-600/20",
};

export default function StatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
