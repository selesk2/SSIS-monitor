import type { MonitoringStatus } from "../types/monitoring";

export interface StatusMeta {
  label: string;
  className: string;
  dotClassName: string;
}

const STATUS_META: Record<MonitoringStatus, StatusMeta> = {
  SUCCESS: {
    label: "Success",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dotClassName: "bg-emerald-500",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-50 text-red-800 border-red-200",
    dotClassName: "bg-red-600",
  },
  ENDED_UNEXPECTEDLY: {
    label: "Ended Unexpectedly",
    className: "bg-red-50 text-red-800 border-red-200",
    dotClassName: "bg-red-600",
  },
  RUNNING: {
    label: "Running",
    className: "bg-sky-50 text-sky-800 border-sky-200",
    dotClassName: "bg-sky-500",
  },
  STOPPING: {
    label: "Stopping",
    className: "bg-sky-50 text-sky-800 border-sky-200",
    dotClassName: "bg-sky-500",
  },
  WAITING: {
    label: "Waiting",
    className: "bg-amber-50 text-amber-900 border-amber-200",
    dotClassName: "bg-amber-500",
  },
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-900 border-amber-200",
    dotClassName: "bg-amber-500",
  },
  NOT_RUN: {
    label: "Not Run",
    className: "bg-rose-50 text-rose-900 border-rose-300",
    dotClassName: "bg-rose-600",
  },
  NOT_EXECUTED: {
    label: "Not Executed",
    className: "bg-orange-50 text-orange-900 border-orange-300",
    dotClassName: "bg-orange-600",
  },
  EXECUTION_MISSING: {
    label: "Execution Missing",
    className: "bg-orange-50 text-orange-900 border-orange-300",
    dotClassName: "bg-orange-600",
  },
  NOT_DUE: {
    label: "Not Due",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    dotClassName: "bg-slate-400",
  },
  CANCELED: {
    label: "Canceled",
    className: "bg-orange-50 text-orange-800 border-orange-200",
    dotClassName: "bg-orange-500",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dotClassName: "bg-emerald-500",
  },
  CREATED: {
    label: "Created",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    dotClassName: "bg-slate-400",
  },
  UNKNOWN: {
    label: "Unknown",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    dotClassName: "bg-slate-400",
  },
};

const FALLBACK_META: StatusMeta = {
  label: "Unknown",
  className: "bg-slate-100 text-slate-600 border-slate-200",
  dotClassName: "bg-slate-400",
};

export function getStatusMeta(status: string): StatusMeta {
  if (status in STATUS_META) {
    return STATUS_META[status as MonitoringStatus];
  }

  return {
    ...FALLBACK_META,
    label: status || "Unknown",
  };
}

export function isRunningStatus(status: string): boolean {
  return status === "RUNNING" || status === "STOPPING";
}

export const SUMMARY_CARD_STATUSES = [
  "SUCCESS",
  "FAILED",
  "RUNNING",
  "NOT_RUN",
  "NOT_DUE",
] as const;

export type SummaryCardStatus = (typeof SUMMARY_CARD_STATUSES)[number];
