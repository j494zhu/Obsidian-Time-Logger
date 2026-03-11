from datetime import datetime, timedelta

def get_logical_date(dt):
    if (dt.hour < 6):
        return (dt - timedelta(days=1)).strftime('%Y-%m-%d')
    else:
        return dt.strftime('%Y-%m-%d')

def calculate_stats_from_logs(logs_list):
    """
    纯计算函数：传入 log 对象列表，返回统计数据。
    避免了数据库引用，解耦更彻底。
    """
    total_minutes = 0
    deep_minutes = 0
    deep_keywords = ['code', 'coding', 'study', 'math', 'cs', 'exam', 'quiz', 'write', 'algo', 'data', 'train', 'ai', 'implement', 'logic', 'work', 'study']

    for log in logs_list:
        try:
            t_start = datetime.strptime(log.start_time, "%H:%M")
            t_end = datetime.strptime(log.end_time, "%H:%M")
            
            if t_end < t_start:
                t_end += timedelta(days=1)
                
            duration = (t_end - t_start).total_seconds() / 60
            total_minutes += duration
            
            if any(k in log.desc.lower() for k in deep_keywords):
                deep_minutes += duration
        except Exception:
            continue
            
    return round(total_minutes / 60, 1), round(deep_minutes / 60, 1)

def calculate_duration(start_str, end_str):
    try:
        fmt = "%H:%M"
        t1 = datetime.strptime(start_str, fmt)
        t2 = datetime.strptime(end_str, fmt)
        if t2 < t1: # 处理跨天 (23:00 -> 01:00)
            t2 += timedelta(days=1)
        delta = t2 - t1
        return int(delta.total_seconds() / 60)
    except:
        return 0