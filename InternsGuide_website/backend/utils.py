from functools import wraps
from flask import jsonify, request
import jwt
from backend.config import Config
from backend.models import User

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                raise ValueError('User not found')
        except Exception as e:
            return jsonify({'message': f'Token is invalid: {str(e)}'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({'message': 'Admin access required!'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

def curator_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role not in ['curator', 'admin']:
            return jsonify({'message': 'Curator access required!'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

def generate_password_hash(password):
    from werkzeug.security import generate_password_hash as _generate_password_hash
    return _generate_password_hash(password)

def check_password_hash(hashed_password, password):
    from werkzeug.security import check_password_hash as _check_password_hash
    return _check_password_hash(hashed_password, password)