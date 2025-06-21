from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
from backend.models import User
from backend import db
from backend.config import Config

auth_bp = Blueprint('auth', __name__)


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
            
        if not token:
            return jsonify({'message': 'Требуется токен авторизации'}), 401
            
        try:
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                raise ValueError('Пользователь не найден')
        except Exception as e:
            return jsonify({'message': f'Неверный токен: {str(e)}'}), 401
            
        return f(current_user, *args, **kwargs)
        
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'Необходимо передать данные'}), 400
        
        required_fields = ['name', 'surname', 'login', 'password']
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'Не все обязательные поля заполнены'}), 400
        
        if User.query.filter_by(login=data['login']).first():
            return jsonify({'message': 'Пользователь с таким логином уже существует'}), 400
        
        hashed_password = generate_password_hash(
            data['password'],
            method='pbkdf2:sha256',
            salt_length=16
        )
        
        new_user = User(
            name=data['name'],
            surname=data['surname'],
            login=data['login'],
            password=hashed_password,
            role=data.get('role', 'trainee')
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({'message': 'Пользователь успешно зарегистрирован'}), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Ошибка регистрации: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    data = request.get_json()
    
    if not data or not data.get('login') or not data.get('password'):
        return jsonify({'message': 'Login and password required'}), 400
    
    user = User.query.filter_by(login=data['login']).first()
    
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    token = jwt.encode({
        'user_id': user.user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, Config.SECRET_KEY, algorithm="HS256")
    
    return jsonify({
        'token': token,
        'user': {
            'user_id': user.user_id,
            'name': user.name,
            'surname': user.surname,
            'role': user.role,
            'login': user.login
        }
    }), 200