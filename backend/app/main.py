from fastapi import FastAPI

from app.database import get_connection
from app.routers.monitoring import router as monitoring_router

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="SSIS Monitoring API",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(monitoring_router)


@app.get("/")
def root():
    return {
        "message": "SSIS Monitoring API is running"
    }


@app.get("/test-db")
def test_database():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                @@SERVERNAME AS server_name,
                DB_NAME() AS database_name,
                GETDATE() AS server_time
        """)

        row = cursor.fetchone()

        return {
            "status": "connected",
            "server": row.server_name,
            "database": row.database_name,
            "server_time": row.server_time
        }

    finally:
        connection.close()