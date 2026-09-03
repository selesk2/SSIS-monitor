MONITORED_PACKAGES_QUERY = """
SELECT DISTINCT
    j.job_id,
    j.name AS job_name,
    j.enabled AS job_enabled,
 
    js.step_id,
    js.step_name,
    js.subsystem,
    js.command,
 
    sch.schedule_id,
    sch.name AS schedule_name,
    sch.enabled AS schedule_enabled,
 
    sch.freq_type,
    sch.freq_interval,
    sch.freq_subday_type,
    sch.freq_subday_interval,
    sch.freq_relative_interval,
    sch.freq_recurrence_factor,
    sch.active_start_date,
    sch.active_end_date,
    sch.active_start_time,
    sch.active_end_time
 
FROM msdb.dbo.sysjobs j
 
INNER JOIN msdb.dbo.sysjobsteps js
    ON j.job_id = js.job_id
 
INNER JOIN msdb.dbo.sysjobschedules jsch
    ON j.job_id = jsch.job_id
 
INNER JOIN msdb.dbo.sysschedules sch
    ON jsch.schedule_id = sch.schedule_id
 
WHERE
    j.enabled = 1
    AND sch.enabled = 1
    AND js.subsystem = 'SSIS'
    AND js.command LIKE '%/ISSERVER%'
 
ORDER BY
    j.name,
    js.step_id,
    sch.schedule_id;
"""

TODAY_JOB_RUNS_QUERY = """
DECLARE @Today INT =
    CONVERT(INT, CONVERT(VARCHAR(8), GETDATE(), 112));

SELECT
    j.job_id,
    j.name AS job_name,
    h.instance_id,

    DATETIMEFROMPARTS(
        h.run_date / 10000,
        (h.run_date % 10000) / 100,
        h.run_date % 100,
        h.run_time / 10000,
        (h.run_time % 10000) / 100,
        h.run_time % 100,
        0
    ) AS run_datetime,

    h.run_duration,

    CASE h.run_status
        WHEN 0 THEN 'FAILED'
        WHEN 1 THEN 'SUCCESS'
        WHEN 2 THEN 'RETRY'
        WHEN 3 THEN 'CANCELED'
        WHEN 4 THEN 'IN_PROGRESS'
        ELSE 'UNKNOWN'
    END AS job_status,

    h.message

FROM msdb.dbo.sysjobs j

INNER JOIN msdb.dbo.sysjobhistory h
    ON j.job_id = h.job_id

WHERE
    j.enabled = 1
    AND h.step_id = 0
    AND h.run_date = @Today

ORDER BY
    run_datetime DESC;
"""

TODAY_JOB_STEP_RUNS_QUERY = """
DECLARE @Today INT =
    CONVERT(INT, CONVERT(VARCHAR(8), GETDATE(), 112));

SELECT
    j.job_id,
    j.name AS job_name,

    h.instance_id,
    h.step_id,
    h.step_name,

    DATETIMEFROMPARTS(
        h.run_date / 10000,
        (h.run_date % 10000) / 100,
        h.run_date % 100,
        h.run_time / 10000,
        (h.run_time % 10000) / 100,
        h.run_time % 100,
        0
    ) AS run_datetime,

    h.run_duration,

    CASE h.run_status
        WHEN 0 THEN 'FAILED'
        WHEN 1 THEN 'SUCCESS'
        WHEN 2 THEN 'RETRY'
        WHEN 3 THEN 'CANCELED'
        WHEN 4 THEN 'IN_PROGRESS'
        ELSE 'UNKNOWN'
    END AS step_status,

    h.message

FROM msdb.dbo.sysjobs j

INNER JOIN msdb.dbo.sysjobhistory h
    ON j.job_id = h.job_id

WHERE
    j.enabled = 1
    AND h.step_id > 0
    AND h.run_date = @Today

ORDER BY
    j.name,
    run_datetime,
    h.step_id;
"""


CURRENT_RUNNING_JOBS_QUERY = """
SELECT
    j.job_id,
    j.name AS job_name,

    a.start_execution_date,
    a.stop_execution_date,

    a.last_executed_step_id,
    a.last_executed_step_date

FROM msdb.dbo.sysjobactivity a

INNER JOIN msdb.dbo.sysjobs j
    ON a.job_id = j.job_id

WHERE
    a.session_id = (
        SELECT MAX(session_id)
        FROM msdb.dbo.syssessions
    )

    AND a.start_execution_date IS NOT NULL
    AND a.stop_execution_date IS NULL

ORDER BY
    a.start_execution_date;
"""

TODAY_JOB_ACTIVITY_QUERY = """
SELECT
    a.session_id,
    j.job_id,
    j.name AS job_name,

    a.run_requested_date,
    a.run_requested_source,

    a.start_execution_date,
    a.stop_execution_date,

    a.last_executed_step_id,
    a.last_executed_step_date,

    a.next_scheduled_run_date

FROM msdb.dbo.sysjobactivity a

INNER JOIN msdb.dbo.sysjobs j
    ON a.job_id = j.job_id

WHERE
    a.start_execution_date >= CAST(GETDATE() AS date)
    AND a.start_execution_date < DATEADD(
        day,
        1,
        CAST(GETDATE() AS date)
    )

ORDER BY
    a.start_execution_date;
"""