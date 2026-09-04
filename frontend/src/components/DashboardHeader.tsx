import { RefreshCw } from "lucide-react";
import { formatClockTime, formatMonitoringDate } from "../utils/dateTime";

interface DashboardHeaderProps {
  monitoringDate: string | null;
  lastRefresh: Date | null;
  isRefreshing: boolean;
  isMockMode: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({
  monitoringDate,
  lastRefresh,
  isRefreshing,
  isMockMode,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-surface-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          SSIS Monitoring
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          SQL Server Agent &amp; SSIS Package Monitoring
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
          <span>
            Monitoring date:{" "}
            <span className="font-medium text-ink">
              {monitoringDate ? formatMonitoringDate(monitoringDate) : "-"}
            </span>
          </span>
          <span>
            Last refresh:{" "}
            <span className="font-medium text-ink">
              {lastRefresh ? formatClockTime(lastRefresh) : "-"}
            </span>
          </span>
          {isMockMode && (
            <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
              Mock data mode
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-surface-border bg-white px-3.5 py-2 text-sm font-medium text-ink shadow-sm hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
      >
        <RefreshCw
          className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          aria-hidden
        />
        Refresh
      </button>
    </header>
  );
}
