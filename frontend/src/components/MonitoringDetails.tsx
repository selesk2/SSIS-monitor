import { X } from "lucide-react";
import type { MonitoringItem } from "../types/monitoring";
import { displayValue, formatDateTime, formatDuration } from "../utils/dateTime";
import { isRunningStatus } from "../utils/status";
import { StatusBadge } from "./StatusBadge";

interface MonitoringDetailsProps {
  item: MonitoringItem | null;
  nowMs: number;
  onClose: () => void;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 border-b border-surface-border py-2 last:border-b-0 sm:grid-cols-[180px_1fr]">
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className="break-words text-sm text-ink">{value}</dd>
    </div>
  );
}

export function MonitoringDetails({
  item,
  nowMs,
  onClose,
}: MonitoringDetailsProps) {
  if (!item) {
    return null;
  }

  const running = isRunningStatus(item.status);
  const duration = formatDuration(
    item.package_start_time,
    running ? null : item.package_end_time,
    nowMs,
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/30"
        aria-label="Close details"
        onClick={onClose}
      />

      <aside
        className="relative flex h-full w-full max-w-lg flex-col border-l border-surface-border bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-surface-border px-5 py-4">
          <div>
            <h2 id="details-title" className="text-base font-semibold text-ink">
              Package details
            </h2>
            <p className="mt-1 text-xs text-ink-muted">{item.package_name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-muted hover:bg-surface-muted hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Monitoring Status
            </span>
            <StatusBadge status={item.status} showIcon />
          </div>

          <dl>
            <DetailRow label="Package" value={displayValue(item.package_name)} />
            <DetailRow label="Project" value={displayValue(item.project_name)} />
            <DetailRow label="Folder" value={displayValue(item.folder_name)} />
            <DetailRow label="Job" value={displayValue(item.job_name)} />
            <DetailRow label="Schedule" value={displayValue(item.schedule_name)} />
            <DetailRow
              label="Expected Time"
              value={formatDateTime(item.expected_time)}
            />
            <DetailRow
              label="Job Start Time"
              value={formatDateTime(item.job_start_time)}
            />
            <DetailRow label="Job Status" value={displayValue(item.job_status)} />
            <DetailRow
              label="Job Run Source"
              value={displayValue(item.job_run_source)}
            />
            <DetailRow
              label="Running Job"
              value={displayValue(item.running_job)}
            />
            <DetailRow
              label="Running Job Start Time"
              value={formatDateTime(item.running_job_start_time)}
            />
            <DetailRow label="Step ID" value={displayValue(item.step_id)} />
            <DetailRow label="Step Name" value={displayValue(item.step_name)} />
            <DetailRow
              label="Step Start Time"
              value={formatDateTime(item.step_start_time)}
            />
            <DetailRow label="Step Status" value={displayValue(item.step_status)} />
            <DetailRow
              label="SSIS Execution ID"
              value={displayValue(item.execution_id)}
            />
            <DetailRow
              label="Package Start Time"
              value={formatDateTime(item.package_start_time)}
            />
            <DetailRow
              label="Package End Time"
              value={formatDateTime(item.package_end_time)}
            />
            <DetailRow label="Duration" value={duration} />
            <DetailRow
              label="SSIS Status Code"
              value={displayValue(item.ssis_status_code)}
            />
            <DetailRow label="Job ID" value={displayValue(item.job_id)} />
            <DetailRow
              label="Job Instance ID"
              value={displayValue(item.job_instance_id)}
            />
            <DetailRow
              label="Step Instance ID"
              value={displayValue(item.step_instance_id)}
            />
            <DetailRow
              label="Schedule ID"
              value={displayValue(item.schedule_id)}
            />
          </dl>
        </div>
      </aside>
    </div>
  );
}
