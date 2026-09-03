TODAY_SSIS_EXECUTIONS_QUERY = """
SELECT
    execution_id,
    folder_name,
    project_name,
    package_name,

    CAST(start_time AS datetime2) AS start_time,
    CAST(end_time AS datetime2) AS end_time,

    status

FROM SSISDB.catalog.executions

WHERE
    CAST(start_time AS date) = CAST(GETDATE() AS date)

ORDER BY
    start_time DESC;
"""