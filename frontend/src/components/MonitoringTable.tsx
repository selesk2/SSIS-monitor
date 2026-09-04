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
    return <ArrowUpDown className="h-3.5 w-3.5 text-ink-soft" aria-hidden />;
  }

  return direction === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-sky-700" aria-hidden />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-sky-700" aria-hidden />
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
    <th className={`px-3 py-2.5 text-left font-medium ${className}`}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-ink-muted hover:text-ink"
      >
        {label}
        <SortIcon active={active} direction={sortDirection} />
      </button>
    </th>
  );
}

export function MonitoringTable({
  items,
  sortKey,
  sortDirection,
  nowMs,
  onSort,
  onSelect,
}: MonitoringTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-surface-border bg-white px-6 py-16 text-center shadow-panel">
        <p className="text-sm font-medium text-ink">No packages match the current filters</p>
        <p className="mt-1 text-xs text-ink-muted">
          Adjust search or filter criteria to see monitoring results.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-surface-border bg-white shadow-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="border-b border-surface-border bg-surface-muted">
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
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                Step
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                Folder
              </th>
              <SortableHeader
                label="Pkg Start"
                columnKey="package_start_time"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={onSort}
              />
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                Pkg End
              </th>
              <SortableHeader
                label="Duration"
                columnKey="duration"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={onSort}
              />
              <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-ink-muted">
                Details
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
                  <td className="px-3 py-2.5 align-middle">
                    <StatusBadge status={item.status} showIcon />
                  </td>
                  <td className="px-3 py-2.5 align-middle font-mono text-xs tabular-nums text-ink">
                    {formatTime(item.expected_time)}
                  </td>
                  <td className="max-w-[220px] px-3 py-2.5 align-middle">
                    <div className="truncate font-medium text-ink" title={item.package_name}>
                      {item.package_name}
                    </div>
                    <div className="truncate text-xs text-ink-muted" title={item.project_name}>
                      {item.project_name}
                    </div>
                  </td>
                  <td className="max-w-[200px] px-3 py-2.5 align-middle">
                    <div className="truncate text-ink" title={item.job_name}>
                      {item.job_name}
                    </div>
                    <div className="truncate text-xs text-ink-muted" title={item.schedule_name}>
                      {item.schedule_name}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-middle text-ink">
                    {item.step_name}
                  </td>
                  <td className="max-w-[160px] px-3 py-2.5 align-middle">
                    <div className="truncate text-ink" title={item.folder_name}>
                      {item.folder_name}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-middle font-mono text-xs tabular-nums text-ink">
                    {formatTime(item.package_start_time)}
                  </td>
                  <td className="px-3 py-2.5 align-middle font-mono text-xs tabular-nums text-ink">
                    {formatTime(item.package_end_time)}
                  </td>
                  <td className="px-3 py-2.5 align-middle text-xs tabular-nums text-ink">
                    {formatDuration(item.package_start_time, durationEnd, nowMs)}
                  </td>
                  <td className="px-3 py-2.5 align-middle text-right">
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className="inline-flex items-center gap-1 rounded-md border border-surface-border bg-white px-2 py-1 text-xs font-medium text-ink hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-sky-300"
                      aria-label={`View details for ${item.package_name}`}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
