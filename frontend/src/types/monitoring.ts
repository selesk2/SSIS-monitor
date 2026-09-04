export type MonitoringStatus =
  | "SUCCESS"
  | "FAILED"
  | "RUNNING"
  | "NOT_RUN"
  | "NOT_DUE"
  | "WAITING"
  | "CANCELED"
  | "ENDED_UNEXPECTEDLY"
  | "EXECUTION_MISSING"
  | "NOT_EXECUTED"
  | "PENDING"
  | "STOPPING"
  | "COMPLETED"
  | "UNKNOWN"
  | "CREATED";

export type MonitoringSummary = Partial<
  Record<MonitoringStatus, number>
>;

export interface MonitoringItem {
  job_id: string;
  job_name: string;
  step_id: number;
  step_name: string;
  folder_name: string;
  project_name: string;
  package_name: string;
  schedule_id: number;
  schedule_name: string;
  expected_time: string;
  job_instance_id: number | null;
  job_start_time: string | null;
  job_status: string | null;
  job_run_source: string | null;
  running_job: boolean;
  running_job_start_time: string | null;
  step_instance_id: number | null;
  step_start_time: string | null;
  step_status: string | null;
  execution_id: number | null;
  package_start_time: string | null;
  package_end_time: string | null;
  ssis_status_code: number | null;
  status: MonitoringStatus;
}

export interface MonitoringResponse {
  date: string;
  monitored_folders: string[];
  summary: MonitoringSummary;
  count: number;
  items: MonitoringItem[];
}
