from datetime import datetime, timedelta


def normalize_datetime(value):
    if value is None:
        return None

    if isinstance(value, str):
        return datetime.fromisoformat(value)

    return value


def find_matching_job_run(
    expected_time: datetime,
    job_id: str,
    job_runs: list[dict],
    tolerance_minutes: int = 15
):
    candidates = []

    for run in job_runs:

        if run["job_id"].upper() != job_id.upper():
            continue

        run_time = normalize_datetime(
            run["run_datetime"]
        )

        if not run_time:
            continue

        difference = abs(
            (run_time - expected_time).total_seconds()
        )

        if difference <= tolerance_minutes * 60:
            candidates.append(
                (difference, run)
            )

    if not candidates:
        return None

    candidates.sort(
        key=lambda item: item[0]
    )

    return candidates[0][1]


def find_matching_step_run(
    job_id: str,
    step_id: int,
    expected_time: datetime,
    step_runs: list[dict],
    job_run: dict | None = None,
    max_hours: int = 12
):
    """
    İlgili SQL Agent Job çalışmasına ait Step History
    kaydını bulur.
    """

    candidates = []

    if job_run:
        search_start = normalize_datetime(
            job_run["run_datetime"]
        )
    else:
        search_start = expected_time - timedelta(
            minutes=15
        )

    search_end = search_start + timedelta(
        hours=max_hours
    )

    for step_run in step_runs:

        if (
            step_run["job_id"].upper()
            != job_id.upper()
        ):
            continue

        if step_run["step_id"] != step_id:
            continue

        run_time = normalize_datetime(
            step_run["run_datetime"]
        )

        if not run_time:
            continue

        if run_time < search_start:
            continue

        if run_time >= search_end:
            continue

        candidates.append(
            (run_time, step_run)
        )

    if not candidates:
        return None

    candidates.sort(
        key=lambda item: item[0]
    )

    return candidates[0][1]

def find_matching_running_job(
    expected_time: datetime,
    job_id: str,
    running_jobs: list[dict],
    tolerance_minutes: int = 15
):
    candidates = []

    for run in running_jobs:

        if run["job_id"].upper() != job_id.upper():
            continue

        start_time = normalize_datetime(
            run["start_execution_date"]
        )

        if not start_time:
            continue

        difference = abs(
            (start_time - expected_time).total_seconds()
        )

        if difference <= tolerance_minutes * 60:
            candidates.append(
                (difference, run)
            )

    if not candidates:
        return None

    candidates.sort(
        key=lambda item: item[0]
    )

    return candidates[0][1]



def find_package_execution(
    folder_name: str,
    project_name: str,
    package_name: str,
    expected_time: datetime,
    executions: list[dict],
    used_execution_ids: set,
    job_run: dict | None = None,
    step_run: dict | None = None,
    fallback_minutes: int = 60
):
    """
    Öncelik sırası:

    1. SQL Agent Step başlangıç zamanı
    2. SQL Agent Job başlangıç zamanı
    3. Schedule expected_time

    üzerinden SSISDB execution eşleştirir.
    """

    candidates = []

    # --------------------------------------------------
    # Arama referans zamanını belirle
    # --------------------------------------------------

    if step_run:

        reference_time = normalize_datetime(
            step_run["run_datetime"]
        )

        # Step ile SSIS execution başlangıcı normalde
        # birbirine çok yakın olacaktır.
        search_start = (
            reference_time
            - timedelta(minutes=2)
        )

        search_end = (
            reference_time
            + timedelta(minutes=10)
        )

    elif job_run:

        reference_time = normalize_datetime(
            job_run["run_datetime"]
        )

        search_start = reference_time

        # Multi-step Job'lar uzun sürebildiği için
        # geniş tutuyoruz.
        search_end = (
            reference_time
            + timedelta(hours=12)
        )

    else:

        reference_time = expected_time

        search_start = (
            expected_time
            - timedelta(minutes=2)
        )

        search_end = (
            expected_time
            + timedelta(
                minutes=fallback_minutes
            )
        )

    # --------------------------------------------------
    # Uygun SSIS execution'ları bul
    # --------------------------------------------------

    for execution in executions:

        if (
            execution["execution_id"]
            in used_execution_ids
        ):
            continue

        if (
            execution["folder_name"]
            != folder_name
        ):
            continue

        if (
            execution["project_name"]
            != project_name
        ):
            continue

        if (
            execution["package_name"]
            != package_name
        ):
            continue

        start_time = normalize_datetime(
            execution["start_time"]
        )

        if not start_time:
            continue

        if start_time < search_start:
            continue

        if start_time >= search_end:
            continue

        difference = abs(
            (
                start_time
                - reference_time
            ).total_seconds()
        )

        candidates.append(
            (
                difference,
                start_time,
                execution
            )
        )

    if not candidates:
        return None

    candidates.sort(
        key=lambda item: (
            item[0],
            item[1]
        )
    )

    selected = candidates[0][2]

    used_execution_ids.add(
        selected["execution_id"]
    )

    return selected