# AGENTS.md

## Project Overview

This repository contains an internal SSIS Monitoring application.

The application monitors selected SSIS packages that are scheduled through SQL Server Agent.

The backend is already implemented with FastAPI and reads monitoring data from:

- SQL Server Agent schedules
- SQL Server Agent Job history
- SQL Server Agent Step history
- SQL Server Agent currently running job activity
- SSISDB package executions

The backend combines these sources to determine the monitoring status of each expected package occurrence.

The frontend must treat the backend as the source of truth.

---

# Important Working Rules

Before making any change:

1. Inspect the existing repository.
2. Read the existing backend code.
3. Preserve all currently working functionality.
4. Do not assume file contents.
5. Do not rewrite working code unnecessarily.
6. Prefer small, maintainable changes.
7. Do not introduce unnecessary dependencies.
8. Do not modify monitoring business logic unless explicitly requested.

The existing backend is working and should not be redesigned as part of frontend work.

---

# Repository Structure

Expected structure:

```text
SSIS-monitor/
│
├── AGENTS.md
│
├── backend/
│   └── app/
│       ├── main.py
│       ├── database.py
│       ├── routers/
│       ├── queries/
│       └── services/
│
└── frontend/
```

If the `frontend` directory does not yet exist, create it.

Do not move or rename the existing backend structure without explicit instruction.

---

# Backend Technology

Backend stack:

- Python 3.11
- FastAPI
- pyodbc
- python-dotenv
- SQL Server
- SQL Server Agent
- SSIS Catalog / SSISDB

The frontend should normally not modify these components.

---

# Monitoring Scope

The application does NOT monitor every SQL Server Agent Job.

It monitors SSIS packages that:

1. exist in configured SSISDB folders, and
2. are executed through enabled SQL Server Agent schedules.

The configured folders are currently similar to:

- NovaregV2
- OfficialReporting-KFH-Basel
- OfficialReporting-MSK
- OfficialReporting-MIS

Do not hard-code these folders in the frontend.

Always use the folders returned by the backend API.

---

# Monitoring Model

The backend monitoring chain is:

```text
SQL Agent Schedule
        ↓
SQL Agent Job
        ↓
SQL Agent Step
        ↓
SSISDB Execution
        ↓
Final Monitoring Status
```

An important domain rule:

A SQL Agent schedule belongs to a Job, not directly to an individual SSIS Step.

Therefore, if one Job contains multiple SSIS steps:

```text
Schedule: 07:10

Job starts: 07:10

Step 1
Package A
07:10 → 10:39

Step 2
Package B
10:39 → 12:03
```

the second package is still correctly associated with the 07:10 scheduled Job occurrence.

The frontend MUST NOT treat a large difference between `expected_time` and `package_start_time` as a failure, delay, or anomaly.

The backend already performs the matching.

---

# Source of Truth

The final field `item.status` returned from the backend is the authoritative monitoring result.

The frontend MUST NOT recalculate package monitoring status.

The following fields are diagnostic only:

- `job_status`
- `step_status`
- `ssis_status_code`
- `running_job`

Do not use these fields to override `item.status`.

---

# Main Monitoring Endpoint

Primary endpoint:

```http
GET /api/monitoring/today
```

During local development the backend normally runs at:

```text
http://127.0.0.1:8000
```

The frontend must keep the backend base URL configurable.

Use an environment variable such as:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_USE_MOCK_DATA=true
```

Do not hard-code the backend URL throughout components.

---

# Main API Response

The main endpoint returns approximately:

```json
{
  "date": "2026-09-03",
  "monitored_folders": [
    "NovaregV2",
    "OfficialReporting-KFH-Basel",
    "OfficialReporting-MSK",
    "OfficialReporting-MIS"
  ],
  "summary": {
    "SUCCESS": 24,
    "FAILED": 2,
    "NOT_DUE": 13
  },
  "count": 39,
  "items": [
    {
      "job_id": "GUID",
      "job_name": "OFFICIAL REPORTING - KFH - Basel",
      "step_id": 2,
      "step_name": "2",
      "folder_name": "OfficialReporting-KFH-Basel",
      "project_name": "Official Reporting - KFH Basel",
      "package_name": "OfficialReporting_KFH_Basel2Financials.dtsx",
      "schedule_id": 155,
      "schedule_name": "sch01",
      "expected_time": "2026-09-03T07:10:00",
      "job_instance_id": 8991434,
      "job_start_time": "2026-09-03T07:10:00",
      "job_status": "SUCCESS",
      "job_run_source": "SCHEDULE",
      "running_job": false,
      "running_job_start_time": null,
      "step_instance_id": 8991433,
      "step_start_time": "2026-09-03T10:39:40",
      "step_status": "SUCCESS",
      "execution_id": 2745770,
      "package_start_time": "2026-09-03T10:39:40.490694",
      "package_end_time": "2026-09-03T12:03:12.185724",
      "ssis_status_code": 7,
      "status": "SUCCESS"
    }
  ]
}
```

Do not assume every field is always populated.

Several fields can be `null`.

---

# Supported Monitoring Statuses

The frontend must be able to display at least:

```text
SUCCESS
FAILED
RUNNING
NOT_RUN
NOT_DUE
WAITING
CANCELED
ENDED_UNEXPECTEDLY
EXECUTION_MISSING
NOT_EXECUTED
PENDING
STOPPING
COMPLETED
UNKNOWN
```

Do not assume that only statuses currently visible in today's API response can occur.

---

# Status Meaning

Typical meanings:

### SUCCESS
The package execution completed successfully.

### FAILED
The package or relevant SQL Agent Step failed.

### RUNNING
The package or relevant Job is currently running.

### NOT_RUN
The scheduled occurrence should already have started, the grace period has passed, but the Job did not start.

### NOT_DUE
The scheduled time has not arrived yet.

### WAITING
The scheduled time arrived but the configured grace period has not yet expired.

### NOT_EXECUTED
The Job ran but the package Step was not executed.

### EXECUTION_MISSING
The SQL Agent Step reports success but the matching SSISDB execution could not be found.

### CANCELED
Execution was canceled.

### ENDED_UNEXPECTEDLY
SSIS execution ended unexpectedly.

---

# Manual Execution Assumption

For the current environment:

Scheduled Jobs/packages in the monitoring scope are not manually executed.

Do not add unnecessary frontend behavior for distinguishing manual package executions unless explicitly requested later.

The backend may still expose `job_run_source` for diagnostic purposes.

---

# Frontend Technology

Use:

- React
- TypeScript
- Vite
- Tailwind CSS

A lightweight icon package such as `lucide-react` is acceptable.

Avoid large UI libraries unless there is a clear benefit.

Do not use Redux for the initial version.

React hooks are sufficient.

TanStack Query may be used if it clearly improves implementation, but keep the solution simple.

---

# Frontend Architecture

Prefer a maintainable structure similar to:

```text
frontend/
│
├── src/
│   ├── components/
│   │   ├── DashboardHeader.tsx
│   │   ├── SummaryCards.tsx
│   │   ├── MonitoringFilters.tsx
│   │   ├── MonitoringTable.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── MonitoringDetails.tsx
│   │   ├── LoadingState.tsx
│   │   └── ErrorState.tsx
│   │
│   ├── pages/
│   │   └── Dashboard.tsx
│   │
│   ├── services/
│   │   └── monitoringApi.ts
│   │
│   ├── types/
│   │   └── monitoring.ts
│   │
│   ├── utils/
│   │   ├── dateTime.ts
│   │   └── status.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── .env.example
├── package.json
└── vite.config.ts
```

This structure may be adjusted if there is a clearly better reason.

Keep API access, status presentation rules, and date formatting centralized.

---

# TypeScript Rules

Use proper TypeScript interfaces/types.

At minimum define concepts such as:

- `MonitoringResponse`
- `MonitoringItem`
- `MonitoringSummary`

Avoid `any`.

All nullable backend fields must be represented correctly.

The application must compile successfully with TypeScript.

---

# API Layer

Centralize API access.

For example:

```text
services/monitoringApi.ts
```

with a function such as:

```text
getTodayMonitoring()
```

Do not place duplicate fetch logic across multiple UI components.

Prefer the browser `fetch` API unless another dependency is justified.

---

# Dashboard Requirements

The primary application screen is a monitoring dashboard.

It should contain:

1. Header
2. Summary cards
3. Filters/search
4. Monitoring table
5. Row details modal or side panel

Desktop is the primary use case.

The design should still behave reasonably on smaller screens.

---

# Header

Display:

```text
SSIS Monitoring
```

Suggested subtitle:

```text
SQL Server Agent & SSIS Package Monitoring
```

Also show:

- monitoring date returned by API
- last refresh time
- manual Refresh button

---

# Summary Cards

Display at least:

```text
Total
Success
Failed
Running
Not Run
Not Due
```

Missing summary keys must be treated as zero.

For example:

```ts
summary.SUCCESS ?? 0
```

If practical, clicking a summary card should filter the monitoring table.

Clicking `Total` should clear the status filter.

---

# Filters

Provide:

- free-text search
- status filter
- folder filter
- project filter
- Job filter
- Clear Filters action

Search should cover at least:

- `package_name`
- `job_name`
- `step_name`
- `project_name`
- `folder_name`
- `schedule_name`

Filters must work together.

Show a result count such as:

```text
Showing 12 of 39
```

---

# Monitoring Table

Recommended columns:

```text
Status
Expected Time
Package
Job
Step
Folder
Package Start
Package End
Duration
```

Optional secondary fields:

```text
Schedule
Project
Job Status
Step Status
```

Do not overload the primary table with every backend field.

Use a details panel/modal for diagnostic information.

Horizontal scrolling is acceptable when needed.

Default sort:

```text
expected_time ascending
```

If practical, support column sorting for:

- Expected Time
- Package
- Job
- Status
- Package Start
- Duration

---

# Date and Time Formatting

Backend values are ISO date/time strings.

For today's dashboard, display times primarily as:

```text
HH:mm:ss
```

Example:

```text
07:10:00
10:39:40
```

Avoid repeating the full date unnecessarily in every table row.

Use full timestamps in the details view when helpful.

---

# Duration

Duration may be calculated in the frontend for display purposes only.

Use:

- `package_start_time`
- `package_end_time`

Example output:

```text
42 sec
3 min 12 sec
1 hr 23 min
```

For a RUNNING package, the frontend may calculate elapsed time between `package_start_time` and current time.

This calculation is display-only.

Do not use duration to change monitoring status.

---

# Row Details

Every table row should provide a details action or be clickable.

Display:

```text
Monitoring Status

Package
Project
Folder

Job
Schedule

Expected Time

Job Start Time
Job Status
Job Run Source

Running Job
Running Job Start Time

Step ID
Step Name
Step Start Time
Step Status

SSIS Execution ID

Package Start Time
Package End Time

SSIS Status Code
```

Use `-` for null or unavailable values.

Do not fabricate error information.

---

# Status Presentation

Centralize status metadata in one file such as:

```text
utils/status.ts
```

Suggested semantic presentation:

### SUCCESS
Green

### FAILED
Red

### ENDED_UNEXPECTEDLY
Red

### RUNNING
Blue

### STOPPING
Blue

### WAITING
Amber

### PENDING
Amber

### NOT_RUN
Strong warning / red

### NOT_EXECUTED
Strong warning

### EXECUTION_MISSING
Strong warning

### NOT_DUE
Neutral gray

### CANCELED
Orange / warning

### UNKNOWN
Gray

Do not scatter status color logic throughout components.

---

# Running Packages

Running packages should be visually easy to recognize.

A subtle icon or indicator is sufficient.

Avoid aggressive animation.

If useful, update running elapsed duration locally every 30-60 seconds.

Do not call the backend only to update a duration counter.

---

# Refresh Behavior

Automatically refresh monitoring data every:

```text
60 seconds
```

Also provide a manual Refresh button.

Do not create overlapping API requests.

During background refresh:

- keep existing data visible
- show a subtle loading/refresh state

Do not blank the entire dashboard if previous data already exists.

---

# Loading State

On first load, show a professional loading state.

Avoid large full-screen animations.

---

# Error Handling

If the backend cannot be reached:

show a clear dashboard-level error message.

Example:

```text
Unable to load monitoring data.
```

Provide:

```text
Retry
```

The application must not crash.

---

# Empty State

If:

```text
count = 0
```

show a friendly empty state rather than an empty table.

---

# Visual Design

The application is an internal enterprise/banking operational dashboard.

Prefer:

- clean layout
- light mode
- white/light surfaces
- subtle borders
- readable typography
- restrained shadows
- compact information density
- professional monitoring-table design
- clear status badges

Avoid:

- excessive gradients
- glassmorphism
- oversized decorative graphics
- flashy animation
- consumer/social-app styling

Dark mode is not required for the initial implementation.

---

# Backend Changes

Do not modify backend behavior unless required for frontend connectivity.

If CORS prevents frontend access:

1. verify that CORS is actually the cause
2. make the smallest possible backend change
3. preserve existing behavior
4. clearly report exactly what was changed

Do not refactor backend monitoring logic during frontend implementation.

---

# Build and Validation Requirements

Before considering a frontend task complete:

1. Run the frontend locally if possible.
2. Connect to the actual FastAPI endpoint.
3. Confirm actual API data renders.
4. Confirm filters work.
5. Confirm status badges work.
6. Confirm details view works.
7. Confirm refresh works.
8. Check browser/runtime errors.
9. Check TypeScript errors.
10. Run:

```bash
npm run build
```

11. Fix all build errors.

Do not declare the frontend complete while the production build is failing.

---

# Change Discipline

Do not make unrelated changes.

Do not delete working functionality.

Do not rename backend endpoints without explicit instruction.

Do not duplicate monitoring business logic in the frontend.

Prefer readable and maintainable code over clever abstractions.

When finished, provide a concise report containing:

- files created
- files modified
- commands used
- how to run the frontend
- any backend changes made
- assumptions made
- build result

# Development Environment Limitation

Development may continue on machines that cannot access SRVSSIS2016.

Agents must not assume that the real SQL Server or SSIS backend is reachable.

Frontend work must remain possible without live database connectivity.

Use a dedicated mock-data development mode when needed, but preserve the real API integration.

Mock data must never replace the production backend architecture.

Lack of SRVSSIS2016 connectivity is not a reason to modify or simplify backend monitoring logic.