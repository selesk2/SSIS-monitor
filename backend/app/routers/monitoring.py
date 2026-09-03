from datetime import date, datetime

from fastapi import APIRouter, HTTPException

from app.database import get_connection
from app.queries.executions import TODAY_SSIS_EXECUTIONS_QUERY
from app.queries.jobs import (
    MONITORED_PACKAGES_QUERY,
    TODAY_JOB_RUNS_QUERY,
    TODAY_JOB_STEP_RUNS_QUERY,
    CURRENT_RUNNING_JOBS_QUERY,
    TODAY_JOB_ACTIVITY_QUERY
)
from app.services.execution_matcher import (
    find_matching_job_run,
    find_matching_running_job,
    find_matching_step_run,
    find_package_execution
)
from app.services.monitoring_config import get_monitored_folders
from app.services.package_parser import parse_issserver_command
from app.services.schedule_engine import get_expected_runs
from app.services.status_engine import get_monitoring_status

from app.services.job_source_parser import (
    get_job_run_source
)


router = APIRouter(
    prefix="/api/monitoring",
    tags=["Monitoring"]
)


@router.get("/packages")
def get_monitored_packages():
    connection = None

    try:
        monitored_folders = get_monitored_folders()

        if not monitored_folders:
            return {
                "monitored_folders": [],
                "count": 0,
                "packages": []
            }

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(MONITORED_PACKAGES_QUERY)

        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()

        packages = []

        for row in rows:
            row_dict = dict(zip(columns, row))

            parsed = parse_issserver_command(
                row_dict["command"]
            )

            if not parsed:
                continue

            if parsed["folder_name"] not in monitored_folders:
                continue

            schedule = {
                "freq_type": row_dict["freq_type"],
                "freq_interval": row_dict["freq_interval"],
                "freq_subday_type": row_dict["freq_subday_type"],
                "freq_subday_interval": row_dict["freq_subday_interval"],
                "freq_relative_interval": row_dict["freq_relative_interval"],
                "freq_recurrence_factor": row_dict["freq_recurrence_factor"],
                "active_start_date": row_dict["active_start_date"],
                "active_end_date": row_dict["active_end_date"],
                "active_start_time": row_dict["active_start_time"],
                "active_end_time": row_dict["active_end_time"],
            }

            expected_runs = get_expected_runs(
                schedule,
                date.today()
            )

            packages.append({
                "job_id": str(row_dict["job_id"]),
                "job_name": row_dict["job_name"],
                "step_id": row_dict["step_id"],
                "step_name": row_dict["step_name"],

                "folder_name": parsed["folder_name"],
                "project_name": parsed["project_name"],
                "package_name": parsed["package_name"],

                "schedule_id": row_dict["schedule_id"],
                "schedule_name": row_dict["schedule_name"],

                "freq_type": row_dict["freq_type"],
                "freq_interval": row_dict["freq_interval"],
                "freq_subday_type": row_dict["freq_subday_type"],
                "freq_subday_interval": row_dict["freq_subday_interval"],
                "freq_relative_interval": row_dict["freq_relative_interval"],
                "freq_recurrence_factor": row_dict["freq_recurrence_factor"],

                "active_start_date": row_dict["active_start_date"],
                "active_end_date": row_dict["active_end_date"],
                "active_start_time": row_dict["active_start_time"],
                "active_end_time": row_dict["active_end_time"],

                "expected_runs_today": [
                    run.isoformat()
                    for run in expected_runs
                ]
            })

        return {
            "monitored_folders": monitored_folders,
            "count": len(packages),
            "packages": packages
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )

    finally:
        if connection:
            connection.close()


@router.get("/executions")
def get_today_executions():
    connection = None

    try:
        monitored_folders = get_monitored_folders()

        if not monitored_folders:
            return {
                "monitored_folders": [],
                "count": 0,
                "executions": []
            }

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            TODAY_SSIS_EXECUTIONS_QUERY
        )

        columns = [
            column[0]
            for column in cursor.description
        ]

        rows = cursor.fetchall()

        executions = []

        for row in rows:
            row_dict = dict(
                zip(columns, row)
            )

            if (
                row_dict["folder_name"]
                not in monitored_folders
            ):
                continue

            executions.append({
                "execution_id":
                    row_dict["execution_id"],

                "folder_name":
                    row_dict["folder_name"],

                "project_name":
                    row_dict["project_name"],

                "package_name":
                    row_dict["package_name"],

                "start_time":
                    (
                        row_dict["start_time"].isoformat()
                        if row_dict["start_time"]
                        else None
                    ),

                "end_time":
                    (
                        row_dict["end_time"].isoformat()
                        if row_dict["end_time"]
                        else None
                    ),

                "status":
                    row_dict["status"]
            })

        return {
            "monitored_folders":
                monitored_folders,

            "count":
                len(executions),

            "executions":
                executions
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )

    finally:
        if connection:
            connection.close()


@router.get("/job-runs")
def get_today_job_runs():
    connection = None

    try:
        monitored_folders = get_monitored_folders()

        connection = get_connection()
        cursor = connection.cursor()

        # --------------------------------------------------
        # Önce monitoring kapsamındaki Job'ları belirle
        # --------------------------------------------------

        cursor.execute(
            MONITORED_PACKAGES_QUERY
        )

        columns = [
            column[0]
            for column in cursor.description
        ]

        rows = cursor.fetchall()

        monitored_job_ids = set()

        for row in rows:
            row_dict = dict(
                zip(columns, row)
            )

            parsed = parse_issserver_command(
                row_dict["command"]
            )

            if not parsed:
                continue

            if parsed["folder_name"] not in monitored_folders:
                continue

            monitored_job_ids.add(
                str(row_dict["job_id"]).upper()
            )

        # --------------------------------------------------
        # Bugünkü gerçek Job çalışmalarını getir
        # --------------------------------------------------

        cursor.execute(
            TODAY_JOB_RUNS_QUERY
        )

        columns = [
            column[0]
            for column in cursor.description
        ]

        rows = cursor.fetchall()

        job_runs = []

        for row in rows:
            row_dict = dict(
                zip(columns, row)
            )

            job_id = str(
                row_dict["job_id"]
            ).upper()

            if job_id not in monitored_job_ids:
                continue

            job_runs.append({
                "job_id":
                    job_id,

                "job_name":
                    row_dict["job_name"],

                "instance_id":
                    row_dict["instance_id"],

                "run_datetime":
                    (
                        row_dict["run_datetime"].isoformat()
                        if row_dict["run_datetime"]
                        else None
                    ),

                "run_duration":
                    row_dict["run_duration"],

                "status":
                    row_dict["job_status"],

                "message":
                    row_dict["message"]
            })

        return {
            "count": len(job_runs),
            "job_runs": job_runs
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )

    finally:
        if connection:
            connection.close()


@router.get("/job-activity")
def get_today_job_activity():

    connection = None

    try:

        monitored_folders = get_monitored_folders()

        connection = get_connection()
        cursor = connection.cursor()

        # ---------------------------------------------
        # Monitoring kapsamındaki Job ID'lerini bul
        # ---------------------------------------------

        cursor.execute(
            MONITORED_PACKAGES_QUERY
        )

        columns = [
            column[0]
            for column in cursor.description
        ]

        rows = cursor.fetchall()

        monitored_job_ids = set()

        for row in rows:

            row_dict = dict(
                zip(columns, row)
            )

            parsed = parse_issserver_command(
                row_dict["command"]
            )

            if not parsed:
                continue

            if (
                parsed["folder_name"]
                not in monitored_folders
            ):
                continue

            monitored_job_ids.add(
                str(
                    row_dict["job_id"]
                ).upper()
            )

        # ---------------------------------------------
        # Bugünkü Job Activity kayıtlarını getir
        # ---------------------------------------------

        cursor.execute(
            TODAY_JOB_ACTIVITY_QUERY
        )

        columns = [
            column[0]
            for column in cursor.description
        ]

        rows = cursor.fetchall()

        activities = []

        for row in rows:

            row_dict = dict(
                zip(columns, row)
            )

            job_id = str(
                row_dict["job_id"]
            ).upper()

            if job_id not in monitored_job_ids:
                continue

            activities.append({

                "session_id":
                    row_dict["session_id"],

                "job_id":
                    job_id,

                "job_name":
                    row_dict["job_name"],

                "run_requested_date":
                    (
                        row_dict[
                            "run_requested_date"
                        ].isoformat()

                        if row_dict[
                            "run_requested_date"
                        ]

                        else None
                    ),

                "run_requested_source":
                    row_dict[
                        "run_requested_source"
                    ],

                "start_execution_date":
                    (
                        row_dict[
                            "start_execution_date"
                        ].isoformat()

                        if row_dict[
                            "start_execution_date"
                        ]

                        else None
                    ),

                "stop_execution_date":
                    (
                        row_dict[
                            "stop_execution_date"
                        ].isoformat()

                        if row_dict[
                            "stop_execution_date"
                        ]

                        else None
                    ),

                "last_executed_step_id":
                    row_dict[
                        "last_executed_step_id"
                    ],

                "last_executed_step_date":
                    (
                        row_dict[
                            "last_executed_step_date"
                        ].isoformat()

                        if row_dict[
                            "last_executed_step_date"
                        ]

                        else None
                    ),

                "next_scheduled_run_date":
                    (
                        row_dict[
                            "next_scheduled_run_date"
                        ].isoformat()

                        if row_dict[
                            "next_scheduled_run_date"
                        ]

                        else None
                    )
            })

        return {
            "count": len(activities),
            "activities": activities
        }

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )

    finally:

        if connection:
            connection.close()



@router.get("/today")
def get_today_monitoring():
    connection = None

    try:
        monitored_folders = get_monitored_folders()

        if not monitored_folders:
            return {
                "date": date.today().isoformat(),
                "monitored_folders": [],
                "summary": {},
                "count": 0,
                "items": []
            }

        connection = get_connection()
        cursor = connection.cursor()

        # ==================================================
        # 1. Schedule edilmiş SSIS package'ları getir
        # ==================================================

        cursor.execute(
            MONITORED_PACKAGES_QUERY
        )

        columns = [
            column[0]
            for column in cursor.description
        ]

        package_rows = cursor.fetchall()

        expected_packages = []

        for row in package_rows:
            row_dict = dict(
                zip(columns, row)
            )

            parsed = parse_issserver_command(
                row_dict["command"]
            )

            if not parsed:
                continue

            if parsed["folder_name"] not in monitored_folders:
                continue

            schedule = {
                "freq_type":
                    row_dict["freq_type"],

                "freq_interval":
                    row_dict["freq_interval"],

                "freq_subday_type":
                    row_dict["freq_subday_type"],

                "freq_subday_interval":
                    row_dict["freq_subday_interval"],

                "freq_relative_interval":
                    row_dict["freq_relative_interval"],

                "freq_recurrence_factor":
                    row_dict["freq_recurrence_factor"],

                "active_start_date":
                    row_dict["active_start_date"],

                "active_end_date":
                    row_dict["active_end_date"],

                "active_start_time":
                    row_dict["active_start_time"],

                "active_end_time":
                    row_dict["active_end_time"]
            }

            expected_runs = get_expected_runs(
                schedule,
                date.today()
            )

            for expected_time in expected_runs:
                expected_packages.append({
                    "job_id":
                        str(
                            row_dict["job_id"]
                        ).upper(),

                    "job_name":
                        row_dict["job_name"],

                    "step_id":
                        row_dict["step_id"],

                    "step_name":
                        row_dict["step_name"],

                    "folder_name":
                        parsed["folder_name"],

                    "project_name":
                        parsed["project_name"],

                    "package_name":
                        parsed["package_name"],

                    "schedule_id":
                        row_dict["schedule_id"],

                    "schedule_name":
                        row_dict["schedule_name"],

                    "expected_time":
                        expected_time
                })

        # ==================================================
        # 2. Bugünkü SQL Agent Job Run kayıtları
        # ==================================================

        cursor.execute(
            TODAY_JOB_RUNS_QUERY
        )

        columns = [
            column[0]
            for column in cursor.description
        ]

        job_rows = cursor.fetchall()

        job_runs = []

        for row in job_rows:
            row_dict = dict(
                zip(columns, row)
            )

            message = row_dict["message"]

            job_runs.append({
                "job_id":
                    str(
                        row_dict["job_id"]
                    ).upper(),

                "job_name":
                    row_dict["job_name"],

                "instance_id":
                    row_dict["instance_id"],

                "run_datetime":
                    row_dict["run_datetime"],

                "status":
                    row_dict["job_status"],

                "message":
                    message,

                "run_source":
                    get_job_run_source(message)
            })


        # ==================================================
        # Bugün halen çalışmakta olan SQL Agent Job'ları
        # ==================================================

        cursor.execute(
            CURRENT_RUNNING_JOBS_QUERY
        )

        columns = [
            column[0]
            for column in cursor.description
        ]

        running_job_rows = cursor.fetchall()

        running_jobs = []

        for row in running_job_rows:
            row_dict = dict(
                zip(columns, row)
            )

            running_jobs.append({
                "job_id":
                    str(
                        row_dict["job_id"]
                    ).upper(),

                "job_name":
                    row_dict["job_name"],

                "start_execution_date":
                    row_dict["start_execution_date"],

                "last_executed_step_id":
                    row_dict["last_executed_step_id"],

                "last_executed_step_date":
                    row_dict["last_executed_step_date"]
            })


        # ==================================================
        # 2.1 Bugünkü SQL Agent Step Run kayıtları
        # ==================================================

        cursor.execute(
            TODAY_JOB_STEP_RUNS_QUERY
        )

        columns = [
            column[0]
            for column in cursor.description
        ]

        step_rows = cursor.fetchall()

        step_runs = []

        for row in step_rows:
            row_dict = dict(
                zip(columns, row)
            )

            step_runs.append({
                "job_id":
                    str(
                        row_dict["job_id"]
                    ).upper(),

                "job_name":
                    row_dict["job_name"],

                "instance_id":
                    row_dict["instance_id"],

                "step_id":
                    row_dict["step_id"],

                "step_name":
                    row_dict["step_name"],

                "run_datetime":
                    row_dict["run_datetime"],

                "run_duration":
                    row_dict["run_duration"],

                "status":
                    row_dict["step_status"],

                "message":
                    row_dict["message"]
            })



        # ==================================================
        # 3. Bugünkü gerçek SSIS executions
        # ==================================================

        cursor.execute(
            TODAY_SSIS_EXECUTIONS_QUERY
        )

        columns = [
            column[0]
            for column in cursor.description
        ]

        execution_rows = cursor.fetchall()

        executions = []

        for row in execution_rows:
            row_dict = dict(
                zip(columns, row)
            )

            if (
                row_dict["folder_name"]
                not in monitored_folders
            ):
                continue

            executions.append({
                "execution_id":
                    row_dict["execution_id"],

                "folder_name":
                    row_dict["folder_name"],

                "project_name":
                    row_dict["project_name"],

                "package_name":
                    row_dict["package_name"],

                "start_time":
                    row_dict["start_time"],

                "end_time":
                    row_dict["end_time"],

                "status":
                    row_dict["status"]
            })

        # ==================================================
        # 4. Schedule ↔ Job Run ↔ Execution eşleştirme
        # ==================================================

        now = datetime.now()

        results = []

        # Aynı SSIS execution iki ayrı schedule occurrence'a
        # bağlanmasın.
        used_execution_ids = set()

        # Eski occurrence'ları önce eşleştirmek daha güvenli.
        expected_packages.sort(
            key=lambda item: item["expected_time"]
        )

        for package in expected_packages:
            expected_time = package["expected_time"]

            job_run = find_matching_job_run(
                expected_time=expected_time,
                job_id=package["job_id"],
                job_runs=job_runs
            )

            running_job = find_matching_running_job(
                expected_time=expected_time,
                job_id=package["job_id"],
                running_jobs=running_jobs
            )

            step_run = find_matching_step_run(
                job_id=package["job_id"],
                step_id=package["step_id"],
                expected_time=expected_time,
                step_runs=step_runs,
                job_run=job_run
            )

            execution = find_package_execution(
                folder_name=package["folder_name"],
                project_name=package["project_name"],
                package_name=package["package_name"],
                expected_time=expected_time,
                executions=executions,
                used_execution_ids=used_execution_ids,
                job_run=job_run,
                step_run=step_run
            )

            status = get_monitoring_status(
                expected_time=expected_time,
                job_run=job_run,
                running_job=running_job,
                step_run=step_run,
                execution=execution,
                now=now
            )

            results.append({
                "job_id":
                    package["job_id"],

                "job_name":
                    package["job_name"],

                "step_id":
                    package["step_id"],

                "step_name":
                    package["step_name"],

                "folder_name":
                    package["folder_name"],

                "project_name":
                    package["project_name"],

                "package_name":
                    package["package_name"],

                "schedule_id":
                    package["schedule_id"],

                "schedule_name":
                    package["schedule_name"],

                "expected_time":
                    expected_time.isoformat(),

                "job_instance_id":
                    (
                        job_run["instance_id"]
                        if job_run
                        else None
                    ),

                "job_start_time":
                    (
                        job_run["run_datetime"].isoformat()
                        if job_run
                        and job_run["run_datetime"]
                        else None
                    ),

                "job_status":
                    (
                        job_run["status"]
                        if job_run
                        else None
                    ),

                "job_run_source":
                    (
                        job_run["run_source"]
                        if job_run
                        else None
                    ),  

                "running_job":
                    running_job is not None,

                "running_job_start_time":
                    (
                        running_job["start_execution_date"].isoformat()
                        if running_job
                        and running_job["start_execution_date"]
                        else None
                    ),

                "step_instance_id":
                    (
                        step_run["instance_id"]
                        if step_run
                        else None
                    ),

                "step_start_time":
                    (
                        step_run["run_datetime"].isoformat()
                        if step_run
                        and step_run["run_datetime"]
                        else None
                    ),

                "step_status":
                    (
                        step_run["status"]
                        if step_run
                        else None
                    ),

                "execution_id":
                    (
                        execution["execution_id"]
                        if execution
                        else None
                    ),

                "package_start_time":
                    (
                        execution["start_time"].isoformat()
                        if execution
                        and execution["start_time"]
                        else None
                    ),

                "package_end_time":
                    (
                        execution["end_time"].isoformat()
                        if execution
                        and execution["end_time"]
                        else None
                    ),

                "ssis_status_code":
                    (
                        execution["status"]
                        if execution
                        else None
                    ),

                "status":
                    status
            })

        # ==================================================
        # 5. Summary
        # ==================================================

        summary = {}

        for result in results:
            status = result["status"]

            summary[status] = (
                summary.get(status, 0) + 1
            )

        return {
            "date":
                date.today().isoformat(),

            "monitored_folders":
                monitored_folders,

            "summary":
                summary,

            "count":
                len(results),

            "items":
                results
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )

    finally:
        if connection:
            connection.close()