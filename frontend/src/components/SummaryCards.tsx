import type { MonitoringSummary } from "../types/monitoring";
import {
  SUMMARY_CARD_STATUSES,
  getStatusMeta,
  type SummaryCardStatus,
} from "../utils/status";

interface SummaryCardsProps {
  summary: MonitoringSummary;
  total: number;
  activeStatus: string | null;
  onSelectStatus: (status: string | null) => void;
}

interface CardDef {
  key: string;
  label: string;
  value: number;
  statusFilter: string | null;
  accent: string;
}

export function SummaryCards({
  summary,
  total,
  activeStatus,
  onSelectStatus,
}: SummaryCardsProps) {
  const cards: CardDef[] = [
    {
      key: "TOTAL",
      label: "Total",
      value: total,
      statusFilter: null,
      accent: "border-slate-300",
    },
    ...SUMMARY_CARD_STATUSES.map((status: SummaryCardStatus) => {
      const meta = getStatusMeta(status);
      return {
        key: status,
        label: meta.label,
        value: summary[status] ?? 0,
        statusFilter: status,
        accent: meta.className.split(" ").find((c) => c.startsWith("border-")) ?? "border-slate-200",
      };
    }),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const isActive =
          card.statusFilter === null
            ? activeStatus === null
            : activeStatus === card.statusFilter;

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelectStatus(card.statusFilter)}
            className={`rounded-lg border bg-white px-3.5 py-3 text-left shadow-panel transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 ${
              isActive
                ? `${card.accent} ring-1 ring-sky-300`
                : "border-surface-border hover:border-slate-300"
            }`}
          >
            <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {card.label}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-ink">
              {card.value}
            </div>
          </button>
        );
      })}
    </div>
  );
}
