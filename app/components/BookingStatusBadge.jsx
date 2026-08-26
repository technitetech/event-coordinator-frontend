export default function BookingStatusBadge({ status }) {
  const normalized = (status || "pending").toLowerCase();

  const STATUS_CONFIG = {
    pending: { label: "Pending Confirmation", bg: "#FEF3C7", text: "#92400E", dot: "#D97706" },
    confirmed: { label: "Confirmed", bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
    checked_in: { label: "Checked In", bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
    checked_out: { label: "Checked Out", bg: "#E5E7EB", text: "#374151", dot: "#6B7280" },
    seated: { label: "Seated", bg: "#E0E7FF", text: "#3730A3", dot: "#6366F1" },
    completed: { label: "Completed", bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
    cancelled: { label: "Cancelled", bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
    no_show: { label: "No Show", bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
    received: { label: "Received", bg: "#FEF3C7", text: "#92400E", dot: "#D97706" },
    preparing: { label: "In Kitchen", bg: "#FFEDD5", text: "#9A3412", dot: "#F97316" },
    ready: { label: "Ready to Serve", bg: "#CFFAFE", text: "#155E75", dot: "#06B6D4" },
    served: { label: "Served", bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  };

  const conf = STATUS_CONFIG[normalized] || STATUS_CONFIG.pending;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold uppercase tracking-wider"
      style={{ backgroundColor: conf.bg, color: conf.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: conf.dot }}
      />
      {conf.label}
    </span>
  );
}
