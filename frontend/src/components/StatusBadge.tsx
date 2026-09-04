import type { MonitoringStatus } from "../types/monitoring";
import { getStatusMeta, isRunningStatus } from "../utils/status";
import { Loader2 } from "lucide-react";

interface StatusBadgeProps {
  status: MonitoringStatus | string;
  showIcon?: boolean;
}

export function StatusBadge({ status, showIcon = false }: StatusBadgeProps) {
  const meta = getStatusMeta(status);
  const running = isRunningStatus(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${meta.className}`}
    >
      {showIcon && running ? (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
      ) : (
        <span
          className={`h-1.5 w-1.5 rounded-full ${meta.dotClassName}`}
          aria-hidden
        />
      )}
      {meta.label}
    </span>
  );
}
