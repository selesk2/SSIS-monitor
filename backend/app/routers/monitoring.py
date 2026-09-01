from datetime import date
from fastapi import APIRouter

router = APIRouter(
    prefix="/api/monitoring",
    tags=["Monitoring"]
)


@router.get("/today")
def get_today_monitoring():
    return {
        "date": date.today().isoformat(),
        "summary": {
            "total": 5,
            "success": 2,
            "failed": 1,
            "running": 1,
            "not_run": 1
        },
        "jobs": [
            {
                "job_name": "CustomerDaily",
                "schedule_name": "Daily 07:00",
                "expected_time": "07:00",
                "actual_time": "07:00",
                "status": "SUCCESS"
            },
            {
                "job_name": "RiskDaily",
                "schedule_name": "Daily 08:00",
                "expected_time": "08:00",
                "actual_time": "08:01",
                "status": "FAILED"
            },
            {
                "job_name": "FinanceDaily",
                "schedule_name": "Daily 09:00",
                "expected_time": "09:00",
                "actual_time": None,
                "status": "NOT_RUN"
            },
            {
                "job_name": "ReportDaily",
                "schedule_name": "Daily 10:00",
                "expected_time": "10:00",
                "actual_time": "10:00",
                "status": "SUCCESS"
            },
            {
                "job_name": "TransferHourly",
                "schedule_name": "Hourly",
                "expected_time": "11:00",
                "actual_time": "11:00",
                "status": "RUNNING"
            }
        ]
    }