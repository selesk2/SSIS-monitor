export function LoadingState() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-lg border border-surface-border bg-white p-10 shadow-panel">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
      <p className="text-sm font-medium text-ink">Loading monitoring data…</p>
      <p className="text-xs text-ink-muted">
        Fetching scheduled package status for today
      </p>
    </div>
  );
}
