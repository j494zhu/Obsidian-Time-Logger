# services/streak.py
from datetime import datetime, date

def update_user_streak(user, current_date_val):
    """
    增强版打卡逻辑：自动兼容 str 和 date 类型，防止 strptime 报错。
    """
    # --- 1. 预处理 current_date_val ---
    # 如果传进来的是字符串，就解析它；如果是日期对象，直接用
    if isinstance(current_date_val, str):
        today_date = datetime.strptime(current_date_val, "%Y-%m-%d").date()
    elif isinstance(current_date_val, (datetime, date)):
        today_date = current_date_val # 已经是日期对象了，直接用
        # 如果是 datetime 类型，转为 date (去掉时分秒)
        if isinstance(today_date, datetime):
            today_date = today_date.date()
    else:
        return False # 未知类型，防御性返回

    # --- 2. 预处理 last_check_in ---
    last_val = user.last_check_in
    
    # 如果是第一次打卡 (None)
    if not last_val:
        user.streak = 1
        user.last_check_in = str(today_date) # 存入数据库时统一转为字符串
        return True

    # 尝试解析 last_val
    if isinstance(last_val, str):
        try:
            last_date = datetime.strptime(last_val, "%Y-%m-%d").date()
        except ValueError:
            # 如果数据库里的字符串格式不对，重置
            user.streak = 1
            user.last_check_in = str(today_date)
            return True
    elif isinstance(last_val, (datetime, date)):
         last_date = last_val
         if isinstance(last_date, datetime):
            last_date = last_date.date()
    else:
        # 数据异常，重置
        user.streak = 1
        user.last_check_in = str(today_date)
        return True

    # --- 3. 核心计算逻辑 (现在两个都是 date 对象了，可以直接减) ---
    delta_days = (today_date - last_date).days
    
    if delta_days == 0:
        # 同一天，什么都不做
        return False
    elif delta_days == 1:
        # 连续打卡！
        user.streak += 1
    else:
        # 断签了 (delta_days > 1 或 delta_days < 0)
        user.streak = 1
        
    # 更新最后打卡时间 (统一存为字符串)
    user.last_check_in = str(today_date)
    return True