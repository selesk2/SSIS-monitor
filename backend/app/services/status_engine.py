from datetime import datetime, timedelta


SSIS_STATUS_MAP = {
    1: "CREATED",
    2: "RUNNING",
    3: "CANCELED",
    4: "FAILED",
    5: "PENDING",
    6: "ENDED_UNEXPECTEDLY",
    7: "SUCCESS",
    8: "STOPPING",
    9: "COMPLETED"
}


def get_monitoring_status(
    expected_time: datetime,
    job_run: dict | None,
    running_job: dict | None,
    step_run: dict | None,
    execution: dict | None,
    now: datetime,
    grace_minutes: int = 10
):
    """
    Package occurrence için nihai monitoring durumunu belirler.

    Öncelik:

    1. SSIS execution
    2. SQL Agent Step sonucu
    3. Halen çalışan SQL Agent Job
    4. Schedule zamanı
    5. Tamamlanmış SQL Agent Job sonucu
    """

    # --------------------------------------------------
    # 1. SSIS execution varsa en güçlü bilgi
    # --------------------------------------------------

    if execution:

        status_code = execution["status"]

        return SSIS_STATUS_MAP.get(
            status_code,
            "UNKNOWN"
        )

    # --------------------------------------------------
    # 2. SQL Agent Step kaydı varsa
    # --------------------------------------------------

    if step_run:

        step_status = step_run["status"]

        if step_status == "FAILED":
            return "FAILED"

        if step_status == "CANCELED":
            return "CANCELED"

        if step_status == "IN_PROGRESS":
            return "RUNNING"

        if step_status == "SUCCESS":
            return "EXECUTION_MISSING"

    # --------------------------------------------------
    # 3. Job şu anda çalışıyorsa
    # --------------------------------------------------

    if running_job:
        return "RUNNING"

    # --------------------------------------------------
    # 4. Henüz schedule zamanı gelmedi
    # --------------------------------------------------

    if now < expected_time:
        return "NOT_DUE"

    # --------------------------------------------------
    # 5. Grace period
    # --------------------------------------------------

    if now < expected_time + timedelta(
        minutes=grace_minutes
    ):
        return "WAITING"

    # --------------------------------------------------
    # 6. Job hiç başlamadı
    # --------------------------------------------------

    if not job_run:
        return "NOT_RUN"

    # --------------------------------------------------
    # 7. Job çalıştı ama package step çalışmadı
    # --------------------------------------------------

    job_status = job_run["status"]

    if job_status == "FAILED":
        return "NOT_EXECUTED"

    if job_status == "CANCELED":
        return "NOT_EXECUTED"

    if job_status == "IN_PROGRESS":
        return "RUNNING"

    return "NOT_EXECUTED"