def get_job_run_source(message: str | None) -> str:
    if not message:
        return "UNKNOWN"

    normalized = message.lower()

    if "invoked by schedule" in normalized:
        return "SCHEDULE"

    if "invoked by user" in normalized:
        return "MANUAL"

    if "invoked by alert" in normalized:
        return "ALERT"

    return "UNKNOWN"