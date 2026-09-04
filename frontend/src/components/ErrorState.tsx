interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({
  message = "Unable to load monitoring data.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50/60 p-10 text-center shadow-panel">
      <div>
        <p className="text-sm font-semibold text-red-900">{message}</p>
        <p className="mt-1 text-xs text-red-700/80">
          Check that the API is reachable, then try again.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
      >
        Retry
      </button>
    </div>
  );
}
