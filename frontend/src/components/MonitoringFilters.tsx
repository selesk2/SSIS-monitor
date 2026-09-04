import { Search, X } from "lucide-react";
import { getStatusMeta } from "../utils/status";

export interface FilterState {
  search: string;
  status: string;
  folder: string;
  project: string;
  job: string;
}

interface MonitoringFiltersProps {
  filters: FilterState;
  statuses: string[];
  folders: string[];
  projects: string[];
  jobs: string[];
  shownCount: number;
  totalCount: number;
  onChange: (next: FilterState) => void;
  onClear: () => void;
}

const selectClass =
  "w-full rounded-md border border-surface-border bg-white px-2.5 py-2 text-sm text-ink shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200";

export function MonitoringFilters({
  filters,
  statuses,
  folders,
  projects,
  jobs,
  shownCount,
  totalCount,
  onChange,
  onClear,
}: MonitoringFiltersProps) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "" ||
    filters.folder !== "" ||
    filters.project !== "" ||
    filters.job !== "";

  return (
    <section className="rounded-lg border border-surface-border bg-white p-4 shadow-panel">
      <div className="grid gap-3 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
            aria-hidden
          />
          <input
            type="search"
            value={filters.search}
            onChange={(e) =>
              onChange({ ...filters, search: e.target.value })
            }
            placeholder="Search package, job, step, project…"
            className="w-full rounded-md border border-surface-border bg-white py-2 pl-9 pr-3 text-sm text-ink shadow-sm placeholder:text-ink-soft focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className={selectClass}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {getStatusMeta(status).label}
            </option>
          ))}
        </select>

        <select
          value={filters.folder}
          onChange={(e) => onChange({ ...filters, folder: e.target.value })}
          className={selectClass}
          aria-label="Filter by folder"
        >
          <option value="">All folders</option>
          {folders.map((folder) => (
            <option key={folder} value={folder}>
              {folder}
            </option>
          ))}
        </select>

        <select
          value={filters.project}
          onChange={(e) => onChange({ ...filters, project: e.target.value })}
          className={selectClass}
          aria-label="Filter by project"
        >
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project} value={project}>
              {project}
            </option>
          ))}
        </select>

        <select
          value={filters.job}
          onChange={(e) => onChange({ ...filters, job: e.target.value })}
          className={selectClass}
          aria-label="Filter by job"
        >
          <option value="">All jobs</option>
          {jobs.map((job) => (
            <option key={job} value={job}>
              {job}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-muted">
          Showing{" "}
          <span className="font-medium text-ink">{shownCount}</span> of{" "}
          <span className="font-medium text-ink">{totalCount}</span>
        </p>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Clear Filters
          </button>
        )}
      </div>
    </section>
  );
}
