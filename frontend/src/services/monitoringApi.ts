import { monitoringMockResponse } from "../mocks/monitoringMock";
import type { MonitoringResponse } from "../types/monitoring";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL as string | undefined
)?.replace(/\/$/, "") || "http://127.0.0.1:8000";

const USE_MOCK_DATA =
  String(import.meta.env.VITE_USE_MOCK_DATA).toLowerCase() === "true";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchTodayMonitoring(): Promise<MonitoringResponse> {
  const response = await fetch(`${API_BASE_URL}/api/monitoring/today`);

  if (!response.ok) {
    throw new Error(
      `Monitoring API request failed (${response.status} ${response.statusText})`,
    );
  }

  return (await response.json()) as MonitoringResponse;
}

/**
 * Returns today's monitoring payload.
 * Mock vs real API selection is centralized here only.
 */
export async function getTodayMonitoring(): Promise<MonitoringResponse> {
  if (USE_MOCK_DATA) {
    await delay(250);
    return structuredClone(monitoringMockResponse);
  }

  return fetchTodayMonitoring();
}

export function isMockDataEnabled(): boolean {
  return USE_MOCK_DATA;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
