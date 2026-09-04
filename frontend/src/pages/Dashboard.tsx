import { useEffect, useRef, useState } from "react";
import { DashboardHeader } from "../components/DashboardHeader";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { MonitoringDetails } from "../components/MonitoringDetails";
import {
  MonitoringFilters,
  type FilterState,
} from "../components/MonitoringFilters";
import {
  MonitoringTable,
  type SortDirection,
  type SortKey,
} from "../components/MonitoringTable";
import { SummaryCards } from "../components/SummaryCards";
import {
  getTodayMonitoring,
  isMockDataEnabled,
} from "../services/monitoringApi";
import type {
  MonitoringItem,
  MonitoringResponse,
} from "../types/monitoring";

const EMPTY_FILTERS: FilterState = {
  search: "",
  status: "",
  folder: "",
  project: "",
  job: "",
};

const REFRESH_INTERVAL_MS = 60_000;
const DURATION_TICK_MS = 30_000;

function itemKey(item: MonitoringItem): string {
  return `${item.job_id}|${item.step_id}|${item.schedule_id}|${item.expected_time}`;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function durationSeconds(
  item: MonitoringItem,
  nowMs: number,
): number | null {
  if (!item.package_start_time) {
    return null;
  }

  const start = new Date(item.package_start_time).getTime();

  if (Number.isNaN(start)) {
    return null;
  }

  const endValue =
    item.status === "RUNNING" || item.status === "STOPPING"
      ? nowMs
      : item.package_end_time
        ? new Date(item.package_end_time).getTime()
        : null;

  if (endValue === null || Number.isNaN(endValue)) {
    return null;
  }

  return Math.floor((endValue - start) / 1000);
}

function compareItems(
  a: MonitoringItem,
  b: MonitoringItem,
  sortKey: SortKey,
  sortDirection: SortDirection,
  nowMs: number,
): number {
  const direction = sortDirection === "asc" ? 1 : -1;
  let result = 0;

  switch (sortKey) {
    case "expected_time":
    case "package_start_time": {
      const aTime = a[sortKey] ? new Date(a[sortKey] as string).getTime() : 0;
      const bTime = b[sortKey] ? new Date(b[sortKey] as string).getTime() : 0;
      result = aTime - bTime;
      break;
    }
    case "duration": {
      const aDur = durationSeconds(a, nowMs);
      const bDur = durationSeconds(b, nowMs);
      result = (aDur ?? -1) - (bDur ?? -1);
      break;
    }
    case "package_name":
    case "job_name":
    case "status":
      result = a[sortKey].localeCompare(b[sortKey]);
      break;
    default:
      result = 0;
  }

  if (result === 0) {
    result = a.expected_time.localeCompare(b.expected_time);
  }

  return result * direction;
}

function matchesSearch(item: MonitoringItem, search: string): boolean {
  if (!search.trim()) {
    return true;
  }

  const q = search.trim().toLowerCase();
  const fields = [
    item.package_name,
    item.job_name,
    item.step_name,
    item.project_name,
    item.folder_name,
    item.schedule_name,
  ];

  return fields.some((field) => field.toLowerCase().includes(q));
}

export function Dashboard() {
  const [data, setData] = useState<MonitoringResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("expected_time");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const inFlightRef = useRef(false);
  const dataRef = useRef<MonitoringResponse | null>(null);
  const isMockMode = isMockDataEnabled();

  dataRef.current = data;

  async function loadMonitoring() {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    const hasData = dataRef.current !== null;

    if (hasData) {
      setIsRefreshing(true);
    } else {
      setInitialLoading(true);
    }

    try {
      const response = await getTodayMonitoring();
      setData(response);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load monitoring data.";
      setError(message);
    } finally {
      inFlightRef.current = false;
      setInitialLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadMonitoring();

    const refreshId = window.setInterval(() => {
      void loadMonitoring();
    }, REFRESH_INTERVAL_MS);

    const tickId = window.setInterval(() => {
      setNowMs(Date.now());
    }, DURATION_TICK_MS);

    return () => {
      window.clearInterval(refreshId);
      window.clearInterval(tickId);
    };
  }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  }

  function handleSelectStatus(status: string | null) {
    setFilters((prev) => ({
      ...prev,
      status: status ?? "",
    }));
  }

  const items = data?.items ?? [];

  const filteredItems = items
    .filter((item) => matchesSearch(item, filters.search))
    .filter((item) => !filters.status || item.status === filters.status)
    .filter((item) => !filters.folder || item.folder_name === filters.folder)
    .filter((item) => !filters.project || item.project_name === filters.project)
    .filter((item) => !filters.job || item.job_name === filters.job)
    .slice()
    .sort((a, b) => compareItems(a, b, sortKey, sortDirection, nowMs));

  const statuses = uniqueSorted(items.map((item) => item.status));
  const folders = uniqueSorted([
    ...(data?.monitored_folders ?? []),
    ...items.map((item) => item.folder_name),
  ]);
  const projects = uniqueSorted(items.map((item) => item.project_name));
  const jobs = uniqueSorted(items.map((item) => item.job_name));

  const selectedItem =
    selectedKey === null
      ? null
      : (items.find((item) => itemKey(item) === selectedKey) ?? null);

  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHeader
          monitoringDate={data?.date ?? null}
          lastRefresh={lastRefresh}
          isRefreshing={isRefreshing}
          isMockMode={isMockMode}
          onRefresh={() => {
            void loadMonitoring();
          }}
        />

        <main className="mt-6 space-y-4">
          {initialLoading && !data ? (
            <LoadingState />
          ) : error && !data ? (
            <ErrorState
              message="Unable to load monitoring data."
              onRetry={() => {
                void loadMonitoring();
              }}
            />
          ) : data && data.count === 0 ? (
            <div className="rounded-lg border border-dashed border-surface-border bg-white px-6 py-16 text-center shadow-panel">
              <p className="text-sm font-medium text-ink">
                No monitored packages for today
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                There are no scheduled package occurrences in the configured
                folders for this date.
              </p>
            </div>
          ) : data ? (
            <>
              {error && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <span>
                    Refresh failed. Showing last successful data. {error}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void loadMonitoring();
                    }}
                    className="font-medium underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              <SummaryCards
                summary={data.summary}
                total={data.count}
                activeStatus={filters.status || null}
                onSelectStatus={handleSelectStatus}
              />

              <MonitoringFilters
                filters={filters}
                statuses={statuses}
                folders={folders}
                projects={projects}
                jobs={jobs}
                shownCount={filteredItems.length}
                totalCount={data.count}
                onChange={setFilters}
                onClear={() => setFilters(EMPTY_FILTERS)}
              />

              <MonitoringTable
                items={filteredItems}
                sortKey={sortKey}
                sortDirection={sortDirection}
                nowMs={nowMs}
                onSort={handleSort}
                onSelect={(item) => setSelectedKey(itemKey(item))}
              />
            </>
          ) : null}
        </main>
      </div>

      <MonitoringDetails
        item={selectedItem}
        nowMs={nowMs}
        onClose={() => setSelectedKey(null)}
      />
    </div>
  );
}
