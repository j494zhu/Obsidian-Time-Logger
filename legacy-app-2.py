import os
from flask import Flask, render_template, request, redirect, session, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin, LoginManager, login_user, logout_user, current_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, date

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///finance.db"
db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

app.secret_key = "dlB93f60saldD0"

# --- 辅助函数：计算“逻辑日期” ---
def get_logical_date(dt_obj):
    """
    如果时间在 00:00 到 06:00 之间，算作前一天。
    例如: 1月30日 03:00 -> 逻辑上是 1月29日
    """
    if dt_obj.hour < 6:
        return (dt_obj - timedelta(days=1)).date()
    return dt_obj.date()

# --- 数据库模型 ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False) # 记得保持255
    expenses = db.relationship('Expenses', backref='user', lazy=True)

class Expenses(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    desc = db.Column(db.String, nullable=False)
    start_time = db.Column(db.String, nullable=False)
    end_time = db.Column(db.String, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.now)
    
    # 新增字段：归档控制
    is_archived = db.Column(db.Boolean, default=False) 
    archive_date = db.Column(db.Date, nullable=True)   # 记录这条数据属于哪一个"逻辑日"

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# 每次应用启动自动建表（省去手动create_all）
with app.app_context():
    db.create_all()

# --- 路由逻辑 ---

@app.route('/', methods=["POST", "GET"])
@login_required
def index():
    # 1. POST: 添加新记录
    if request.method == 'POST':
        item_desc = request.form.get('desc')
        item_start = request.form.get('start_time')
        item_end = request.form.get('end_time')
        
        # 新增的记录，默认属于当前的"逻辑日"
        logical_date = get_logical_date(datetime.now())
        
        try:
            item = Expenses(
                desc=item_desc, 
                start_time=item_start, 
                end_time=item_end, 
                user_id=current_user.id,
                is_archived=False,           # 默认在首页显示
                archive_date=logical_date    # 标记它属于哪一天
            )
            db.session.add(item)
            db.session.commit()
            return redirect('/')
        except Exception as e:
            return f'Error: {str(e)}'

    # 2. GET: 首页展示
    else:
        # [核心逻辑] 自动检查：是否已经是"新的一天"了？
        # 如果现在的逻辑日期 > 某些未归档记录的逻辑日期，说明那些记录该过期了
        now = datetime.now()
        current_logical_date = get_logical_date(now)
        
        # 查出所有还停留在首页(is_archived=False)的记录
        active_items = Expenses.query.filter_by(user_id=current_user.id, is_archived=False).all()
        
        items_to_archive = False
        for item in active_items:
            # 计算这条记录属于哪一天
            item_logical_date = get_logical_date(item.timestamp)
            
            # 如果这条记录属于"昨天"或更早，且现在已经过了凌晨6点(也就是进入了新的逻辑日)
            if item_logical_date < current_logical_date:
                item.is_archived = True
                item.archive_date = item_logical_date # 确保它的归档日期正确
                items_to_archive = True
        
        if items_to_archive:
            db.session.commit()
        
        # 重新获取剩下的、属于今天的记录
        expenses = Expenses.query.filter_by(user_id=current_user.id, is_archived=False).order_by(Expenses.timestamp.desc()).all()
        
        return render_template('index.html', expenses=expenses)

@app.route('/end_day', methods=['POST'])
@login_required
def end_day():
    """手动结束今天：把首页所有内容强制归档"""
    active_items = Expenses.query.filter_by(user_id=current_user.id, is_archived=False).all()
    
    current_logical_date = get_logical_date(datetime.now())
    
    for item in active_items:
        item.is_archived = True
        # 如果是手动结束，归档日期就按当前的逻辑日期算
        item.archive_date = current_logical_date
        
    db.session.commit()
    return redirect('/')

@app.route('/history')
@login_required
def history():
    """历史记录页面：按日期分组显示"""
    # 获取所有已归档的记录，按日期倒序排列
    archived_items = Expenses.query.filter_by(user_id=current_user.id, is_archived=True).order_by(Expenses.archive_date.desc(), Expenses.timestamp.desc()).all()
    
    # 在 Python 里按日期分组数据，方便前端渲染
    # 格式: { date_obj: [item1, item2], ... }
    from itertools import groupby
    
    grouped_history = {}
    for date, items in groupby(archived_items, key=lambda x: x.archive_date):
        grouped_history[date] = list(items)
        
    return render_template('history.html', grouped_history=grouped_history)

# 删除功能保持不变
@app.route('/delete/<int:id>', methods=['POST'])
@login_required
def delete(id):
    del_item = Expenses.query.get_or_404(id)
    if (del_item.user_id != current_user.id):
        return "Unauthorized"
    try:
        db.session.delete(del_item)
        db.session.commit()
        # 智能跳转：如果在历史页删的，回历史页；在首页删的，回首页
        if del_item.is_archived:
            return redirect('/history')
        return redirect('/')
    except:
        return "Error deleting item"

# 注册、登录、注销、cana-sp-access 路由请保持你原来的代码，不用动
# ... (Register, Login, Logout, SP-Access routes) ...
@app.route('/register', methods=['POST', 'GET'])
def register():
    # ... (保持原来的代码) ...
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user:
            return "Username is occupied."
        # Hash password
        new_user = User(username=username, password=generate_password_hash(password, method='pbkdf2:sha256'))
        db.session.add(new_user)
        db.session.commit()
        return redirect('/login')
    else:
        return render_template('register.html')

@app.route('/login', methods=['POST', 'GET'])
def login():
    # ... (保持原来的代码) ...
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect('/')
        return "Invalid credentials"
    else:
        return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect('/login')

@app.route('/cana-sp-access', methods=['GET'])
def sp_access():
    target_user = User.query.filter_by(username="juncheng").first()
    if not target_user: return "User not found"
    
    # 【修改点】去掉 is_archived=False，这样历史记录也能被捞出来
    # 只看该用户的所有记录，按时间倒序，取前 20 条（防止数据太多页面爆炸）
    items = Expenses.query.filter_by(user_id=target_user.id)\
                          .order_by(Expenses.timestamp.desc())\
                          .limit(50)\
                          .all()
                          
    return render_template('index.html', expenses=items, readonly=True, display_user=target_user)

if __name__ == '__main__':
    app.run(debug=True)