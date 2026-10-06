import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from "lucide-react";
import type { MonitoringItem } from "../types/monitoring";
import { formatDuration, formatTime } from "../utils/dateTime";
import { isRunningStatus } from "../utils/status";
import { StatusBadge } from "./StatusBadge";

export type SortKey =
  | "expected_time"
  | "package_name"
  | "job_name"
  | "status"
  | "package_start_time"
  | "duration";

export type SortDirection = "asc" | "desc";

interface MonitoringTableProps {
  items: MonitoringItem[];
  sortKey: SortKey;
  sortDirection: SortDirection;
  nowMs: number;
  onSort: (key: SortKey) => void;
  onSelect: (item: MonitoringItem) => void;
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active) {
    return <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-ink-soft" aria-hidden />;
  }

  return direction === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 shrink-0 text-sky-700" aria-hidden />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 shrink-0 text-sky-700" aria-hidden />
  );
}

function SortableHeader({
  label,
  columnKey,
  sortKey,
  sortDirection,
  onSort,
  className = "",
}: {
  label: string;
  columnKey: SortKey;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sortKey === columnKey;

  return (
    <th className={`px-2 py-2 text-left font-medium ${className}`}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-ink-muted hover:text-ink"
      >
        {label}
        <SortIcon active={active} direction={sortDirection} />
      </button>
    </th>
  );
}

const wrapCell = "break-words whitespace-normal align-top";
const compactCell =
  "whitespace-nowrap align-top font-mono text-xs tabular-nums text-ink";

export function MonitoringTable({
  items,
  sortKey,
  sortDirection,
  nowMs,
  onSort,
  onSelect,
}: MonitoringTableProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-surface-border bg-white shadow-panel">
      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 py-10 text-center">
          <div>
            <p className="text-sm font-medium text-ink">
              No packages match the current filters
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Adjust search or filter criteria to see monitoring results.
            </p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable]">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-[9%]" />
              <col className="w-[7%]" />
              <col className="w-[22%]" />
              <col className="w-[18%]" />
              <col className="w-[6%]" />
              <col className="w-[12%]" />
              <col className="w-[7%]" />
              <col className="w-[7%]" />
              <col className="w-[7%]" />
              <col className="w-[5%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 border-b border-surface-border bg-surface-muted">
              <tr>
                <SortableHeader
                  label="Status"
                  columnKey="status"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
                <SortableHeader
                  label="Expected"
                  columnKey="expected_time"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
                <SortableHeader
                  label="Package"
                  columnKey="package_name"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
                <SortableHeader
                  label="Job"
                  columnKey="job_name"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
                <th className="px-2 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                  Step
                </th>
                <th className="px-2 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                  Folder
                </th>
                <SortableHeader
                  label="Start"
                  columnKey="package_start_time"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
                <th className="px-2 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                  End
                </th>
                <SortableHeader
                  label="Duration"
                  columnKey="duration"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
                <th className="px-2 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const running = isRunningStatus(item.status);
                const durationEnd = running ? null : item.package_end_time;
                const rowKey = `${item.job_id}-${item.step_id}-${item.schedule_id}-${item.expected_time}`;

                return (
                  <tr
                    key={rowKey}
                    className="border-b border-surface-border last:border-b-0 hover:bg-sky-50/40"
                  >
                    <td className="px-2 py-2 align-top">
                      <StatusBadge status={item.status} showIcon />
                    </td>
                    <td className={`px-2 py-2 ${compactCell}`}>
                      {formatTime(item.expected_time)}
                    </td>
                    <td className={`px-2 py-2 ${wrapCell}`}>
                      <div className="font-medium leading-snug text-ink">
                        {item.package_name}
                      </div>
                      <div className="mt-0.5 text-xs leading-snug text-ink-muted">
                        {item.project_name}
                      </div>
                    </td>
                    <td className={`px-2 py-2 ${wrapCell}`}>
                      <div className="leading-snug text-ink">{item.job_name}</div>
                      <div className="mt-0.5 text-xs leading-snug text-ink-muted">
                        {item.schedule_name}
                      </div>
                    </td>
                    <td className={`px-2 py-2 ${wrapCell} text-ink`}>
                      {item.step_name}
                    </td>
                    <td className={`px-2 py-2 ${wrapCell} text-ink`}>
                      {item.folder_name}
                    </td>
                    <td className={`px-2 py-2 ${compactCell}`}>
                      {formatTime(item.package_start_time)}
                    </td>
                    <td className={`px-2 py-2 ${compactCell}`}>
                      {formatTime(item.package_end_time)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 align-top text-xs tabular-nums text-ink">
                      {formatDuration(
                        item.package_start_time,
                        durationEnd,
                        nowMs,
                      )}
                    </td>
                    <td className="px-1 py-2 align-top text-right">
                      <button
                        type="button"
                        onClick={() => onSelect(item)}
                        className="inline-flex items-center justify-center rounded-md border border-surface-border bg-white p-1.5 text-ink hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-sky-300"
                        aria-label={`View details for ${item.package_name}`}
                        title="View details"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
