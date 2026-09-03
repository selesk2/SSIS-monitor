from datetime import date, datetime, time, timedelta
import calendar


# SQL Agent weekday bit değerleri
SQL_WEEKDAYS = {
    1: 6,   # Sunday   -> Python Sunday
    2: 0,   # Monday
    4: 1,   # Tuesday
    8: 2,   # Wednesday
    16: 3,  # Thursday
    32: 4,  # Friday
    64: 5,  # Saturday
}


def int_to_date(value: int | None) -> date | None:
    """
    SQL Agent YYYYMMDD integer değerini Python date'e çevirir.
    Örnek: 20260903 -> date(2026, 9, 3)
    """
    if not value:
        return None

    value = str(value).zfill(8)

    return date(
        int(value[0:4]),
        int(value[4:6]),
        int(value[6:8])
    )


def int_to_time(value: int | None) -> time:
    """
    SQL Agent HHMMSS integer değerini Python time'a çevirir.
    Örnek:
        80000  -> 08:00:00
        133000 -> 13:30:00
    """
    value = int(value or 0)

    hour = value // 10000
    minute = (value % 10000) // 100
    second = value % 100

    return time(
        hour=hour,
        minute=minute,
        second=second
    )


def is_date_in_active_range(
    target_date: date,
    active_start_date: int,
    active_end_date: int
) -> bool:

    start_date = int_to_date(active_start_date)
    end_date = int_to_date(active_end_date)

    if start_date and target_date < start_date:
        return False

    # SQL Agent çoğunlukla 99991231 kullanır
    if end_date and target_date > end_date:
        return False

    return True


def months_between(start_date: date, target_date: date) -> int:
    return (
        (target_date.year - start_date.year) * 12
        + target_date.month
        - start_date.month
    )


def is_daily_due(
    target_date: date,
    active_start_date: int,
    freq_interval: int
) -> bool:

    start_date = int_to_date(active_start_date)

    if not start_date:
        return False

    interval = max(freq_interval or 1, 1)

    days = (target_date - start_date).days

    return days >= 0 and days % interval == 0


def is_weekly_due(
    target_date: date,
    active_start_date: int,
    freq_interval: int,
    freq_recurrence_factor: int
) -> bool:

    start_date = int_to_date(active_start_date)

    if not start_date:
        return False

    # Önce gün kontrolü
    weekday_matches = False

    for sql_bit, python_weekday in SQL_WEEKDAYS.items():
        if freq_interval & sql_bit:
            if target_date.weekday() == python_weekday:
                weekday_matches = True
                break

    if not weekday_matches:
        return False

    recurrence = max(freq_recurrence_factor or 1, 1)

    days_since_start = (target_date - start_date).days

    if days_since_start < 0:
        return False

    weeks_since_start = days_since_start // 7

    return weeks_since_start % recurrence == 0


def is_monthly_due(
    target_date: date,
    active_start_date: int,
    freq_interval: int,
    freq_recurrence_factor: int
) -> bool:

    start_date = int_to_date(active_start_date)

    if not start_date:
        return False

    # Ayın belirli günü
    if target_date.day != freq_interval:
        return False

    recurrence = max(freq_recurrence_factor or 1, 1)

    months = months_between(start_date, target_date)

    return months >= 0 and months % recurrence == 0


def get_relative_monthly_dates(
    year: int,
    month: int,
    freq_interval: int
) -> list[date]:
    """
    freq_interval:
      1 = Sunday
      2 = Monday
      3 = Tuesday
      4 = Wednesday
      5 = Thursday
      6 = Friday
      7 = Saturday
      8 = Day
      9 = Weekday
     10 = Weekend day
    """

    _, days_in_month = calendar.monthrange(year, month)

    result = []

    for day_number in range(1, days_in_month + 1):
        current = date(year, month, day_number)

        # SQL Agent:
        # Sunday=1 ... Saturday=7
        sql_weekday = ((current.weekday() + 1) % 7) + 1

        if 1 <= freq_interval <= 7:
            if sql_weekday == freq_interval:
                result.append(current)

        elif freq_interval == 8:
            # Herhangi bir gün
            result.append(current)

        elif freq_interval == 9:
            # Weekday = Monday-Friday
            if current.weekday() < 5:
                result.append(current)

        elif freq_interval == 10:
            # Weekend = Saturday/Sunday
            if current.weekday() >= 5:
                result.append(current)

    return result


def is_relative_monthly_due(
    target_date: date,
    active_start_date: int,
    freq_interval: int,
    freq_relative_interval: int,
    freq_recurrence_factor: int
) -> bool:

    start_date = int_to_date(active_start_date)

    if not start_date:
        return False

    recurrence = max(freq_recurrence_factor or 1, 1)

    months = months_between(start_date, target_date)

    if months < 0 or months % recurrence != 0:
        return False

    candidate_dates = get_relative_monthly_dates(
        target_date.year,
        target_date.month,
        freq_interval
    )

    if not candidate_dates:
        return False

    # SQL Agent freq_relative_interval
    # 1=First, 2=Second, 4=Third, 8=Fourth, 16=Last

    selected_date = None

    if freq_relative_interval == 1 and len(candidate_dates) >= 1:
        selected_date = candidate_dates[0]

    elif freq_relative_interval == 2 and len(candidate_dates) >= 2:
        selected_date = candidate_dates[1]

    elif freq_relative_interval == 4 and len(candidate_dates) >= 3:
        selected_date = candidate_dates[2]

    elif freq_relative_interval == 8 and len(candidate_dates) >= 4:
        selected_date = candidate_dates[3]

    elif freq_relative_interval == 16:
        selected_date = candidate_dates[-1]

    return target_date == selected_date


def is_schedule_due_on_date(schedule: dict, target_date: date) -> bool:
    """
    Schedule'ın target_date tarihinde çalışması gerekip gerekmediğini belirler.
    """

    if not is_date_in_active_range(
        target_date,
        schedule["active_start_date"],
        schedule["active_end_date"]
    ):
        return False

    freq_type = schedule["freq_type"]

    # 1 = One time
    if freq_type == 1:
        start_date = int_to_date(schedule["active_start_date"])
        return target_date == start_date

    # 4 = Daily
    if freq_type == 4:
        return is_daily_due(
            target_date,
            schedule["active_start_date"],
            schedule["freq_interval"]
        )

    # 8 = Weekly
    if freq_type == 8:
        return is_weekly_due(
            target_date,
            schedule["active_start_date"],
            schedule["freq_interval"],
            schedule["freq_recurrence_factor"]
        )

    # 16 = Monthly
    if freq_type == 16:
        return is_monthly_due(
            target_date,
            schedule["active_start_date"],
            schedule["freq_interval"],
            schedule["freq_recurrence_factor"]
        )

    # 32 = Monthly relative
    if freq_type == 32:
        return is_relative_monthly_due(
            target_date,
            schedule["active_start_date"],
            schedule["freq_interval"],
            schedule["freq_relative_interval"],
            schedule["freq_recurrence_factor"]
        )

    return False


def generate_times_for_schedule(schedule: dict) -> list[time]:
    """
    Bir schedule'ın gün içindeki çalışma saatlerini üretir.
    """

    start_time = int_to_time(schedule["active_start_time"])
    end_time = int_to_time(schedule["active_end_time"])

    freq_subday_type = schedule["freq_subday_type"]
    freq_subday_interval = schedule["freq_subday_interval"]

    # 1 = specified time
    if freq_subday_type == 1:
        return [start_time]

    start_datetime = datetime.combine(
        date.today(),
        start_time
    )

    end_datetime = datetime.combine(
        date.today(),
        end_time
    )

    # SQL Agent subday types:
    # 2 = seconds
    # 4 = minutes
    # 8 = hours

    if freq_subday_type == 2:
        delta = timedelta(
            seconds=max(freq_subday_interval, 1)
        )

    elif freq_subday_type == 4:
        delta = timedelta(
            minutes=max(freq_subday_interval, 1)
        )

    elif freq_subday_type == 8:
        delta = timedelta(
            hours=max(freq_subday_interval, 1)
        )

    else:
        return [start_time]

    result = []

    current = start_datetime

    while current <= end_datetime:
        result.append(current.time())
        current += delta

    return result


def get_expected_runs(
    schedule: dict,
    target_date: date
) -> list[datetime]:
    """
    Verilen schedule için target_date tarihindeki
    tüm beklenen çalışma zamanlarını döndürür.
    """

    if not is_schedule_due_on_date(
        schedule,
        target_date
    ):
        return []

    times = generate_times_for_schedule(schedule)

    return [
        datetime.combine(target_date, run_time)
        for run_time in times
    ]