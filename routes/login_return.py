from flask import Blueprint

login_bp = Blueprint('login', __name__)

@login_bp.route('/login-error')
def login_error():
    return 'login failed'