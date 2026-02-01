import os
from flask import Flask, render_template
from flask import request, redirect
from flask import session
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin, LoginManager, login_user, logout_user, current_user
from flask_login import login_required
from werkzeug.security import generate_password_hash, check_password_hash

from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///finance.db"
db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

app.secret_key = "dlB93f60saldD0"

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)

    expenses = db.relationship('Expenses', backref='user', lazy=True)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class Expenses(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    desc = db.Column(db.String, nullable=False)
    start_time = db.Column(db.String, nullable=False)
    end_time = db.Column(db.String, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.now)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

with app.app_context():
    db.create_all()

def get_expenses():
    if not current_user.is_authenticated:
        return []
    query = Expenses.query.filter_by(user_id=current_user.id)
    expenses = query.order_by(Expenses.timestamp.desc()).all()
    
    return expenses

@app.context_processor
def inject_data():
    sort_type = session.get('sort', 'time_desc')
    return dict(expenses=get_expenses())

@app.route('/register', methods=['POST', 'GET'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        user = User.query.filter_by(username=username).first()
        if user:
            return "Username is occupied. Please choose another one."
        
        hash_password = generate_password_hash(password, method='pbkdf2:sha256')

        new_user = User(username=username, password=hash_password)
        db.session.add(new_user)
        db.session.commit()

        return redirect('/login')
    else:
        return render_template('register.html')

@app.route('/login', methods=['POST', 'GET'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()

        if (user and check_password_hash(user.password, password)):
            login_user(user)
            return redirect('/')
        else:
            return "Invalid username or password. Please try again."
    else:
        return render_template('login.html')
        
@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect('/login')


@app.route('/', methods=["POST", "GET"])
@login_required
def index():
    if (request.method == 'POST'):
        # frontend post data to backend:
        item_desc = request.form.get('desc')
        item_start = request.form.get('start_time')
        item_end = request.form.get('end_time')
        
        try:
            item = Expenses(desc=item_desc, start_time=item_start, end_time=item_end, user_id=current_user.id)
            db.session.add(item)
            db.session.commit()
            return redirect('/')
        except Exception as e:
            return f'There was an error adding your data: {str(e)}'
    else:
        return render_template('index.html')
    
        


@app.route('/delete/<int:id>', methods=['POST'])
@login_required
def delete(id):
    del_item = Expenses.query.get_or_404(id)
    if (del_item.user_id != current_user.id):
        return "ERROR!! You are not authorized to delete this item."
    
    try:
        db.session.delete(del_item)
        db.session.commit()
        return redirect('/')
    except:
        return "There is an error deleting your item. "
    
@app.route('/cana-sp-access', methods=['GET'])
def sp_access():
    target_user = User.query.filter_by(username="juncheng").first()
    if not target_user:
        return "Access denied: User not found. "
    items = Expenses.query.filter_by(user_id=target_user.id).order_by(Expenses.timestamp.desc()).all()
    return render_template('index.html', 
                           expenses=items, 
                           readonly=True, 
                           display_user=target_user)

if __name__ == '__main__':
    app.run(debug=True)
