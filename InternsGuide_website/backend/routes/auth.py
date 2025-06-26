from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
from backend.models import User, Progress
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

@auth_bp.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
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
    
    
@auth_bp.route('/update-profile', methods=['POST'])
@token_required
def update_profile(current_user):
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'Необходимо передать данные'}), 400
        
        # Обновляем основные данные
        if 'name' in data:
            current_user.name = data['name']
        if 'surname' in data:
            current_user.surname = data['surname']
        if 'login' in data:
            current_user.login = data['login']
        
        # Обновляем пароль, если он предоставлен
        if 'password' in data and data['password']:
            current_user.password = generate_password_hash(
                data['password'],
                method='pbkdf2:sha256',
                salt_length=16
            )
            
        
        db.session.commit()
        
        # Генерируем новый токен с обновленными данными пользователя
        token = jwt.encode({
            'user_id': current_user.user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, Config.SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            'message': 'Данные профиля успешно обновлены',
            'token': token,
            'user': {
                'user_id': current_user.user_id,
                'name': current_user.name,
                'surname': current_user.surname,
                'role': current_user.role,
                'login': current_user.login,
                'password': current_user.password
            }
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Ошибка обновления профиля: {str(e)}'}), 500

@auth_bp.route('/delete-account', methods=['DELETE'])
@token_required
def delete_account(current_user):
    try:
        # Удаляем все связанные данные пользователя (прогресс, материалы, тесты)
        # В зависимости от вашей бизнес-логики может потребоваться дополнительная обработка
        
        # Удаляем пользователя
        db.session.delete(current_user)
        db.session.commit()
        
        return jsonify({'message': 'Аккаунт успешно удалён'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Ошибка удаления аккаунта: {str(e)}'}), 500
    
@auth_bp.route('/progress/stats', methods=['GET'])
@token_required
def get_progress_stats(current_user):
    try:
        # Подсчет пройденных материалов
        completed_materials = db.session.query(Progress).filter(
            Progress.user_id == current_user.user_id,
            Progress.material_id.isnot(None),
            Progress.status == 'completed'
        ).count()

        # Подсчет пройденных тестов
        completed_tests = db.session.query(Progress).filter(
            Progress.user_id == current_user.user_id,
            Progress.test_id.isnot(None),
            Progress.status == 'completed'
        ).count()

        return jsonify({
            'completedMaterials': completed_materials,
            'completedTests': completed_tests
        }), 200

    except Exception as e:
        return jsonify({'message': f'Ошибка получения статистики: {str(e)}'}), 500
    
    
    
# Добавим в auth.py новые маршруты для администратора

@auth_bp.route('/admin/users', methods=['GET', 'POST'])
@token_required
def admin_users(current_user):
    if current_user.role != 'admin':
        return jsonify({'message': 'Доступ запрещен'}), 403
    
    if request.method == 'GET':
        # Получение списка пользователей
        search = request.args.get('search', '')
        query = User.query
        
        if search:
            search = f'%{search}%'
            query = query.filter(
                (User.name.ilike(search)) |
                (User.surname.ilike(search)) |
                (User.login.ilike(search))
            )
        
        users = query.order_by(User.user_id).all()
        
        users_data = []
        for user in users:
            users_data.append({
                'user_id': user.user_id,
                'name': user.name,
                'surname': user.surname,
                'login': user.login,
                'role': user.role
            })
        
        return jsonify(users_data), 200
    
    elif request.method == 'POST':
        # Создание нового пользователя
        try:
            data = request.get_json()
            
            required_fields = ['name', 'surname', 'login', 'password', 'role']
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
                role=data['role']
            )
            
            db.session.add(new_user)
            db.session.commit()
            
            return jsonify({
                'message': 'Пользователь успешно создан',
                'user_id': new_user.user_id
            }), 201
        
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'Ошибка создания пользователя: {str(e)}'}), 500

@auth_bp.route('/admin/users/<int:user_id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
def admin_user(current_user, user_id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Доступ запрещен'}), 403
    
    user = User.query.get_or_404(user_id)
    
    if request.method == 'GET':
        return jsonify({
        'user_id': user.user_id,
        'name': user.name,
        'surname': user.surname,
        'login': user.login,
        'password': '********', 
        'role': user.role,
    }), 200
    
    elif request.method == 'PUT':
        try:
            data = request.get_json()
            
            if 'name' in data:
                user.name = data['name']
            if 'surname' in data:
                user.surname = data['surname']
            if 'login' in data:
                if User.query.filter(User.login == data['login'], User.user_id != user_id).first():
                    return jsonify({'message': 'Пользователь с таким логином уже существует'}), 400
                user.login = data['login']
            if 'password' in data and data['password']:
                user.password = generate_password_hash(
                    data['password'],
                    method='pbkdf2:sha256',
                    salt_length=16
                )
            if 'role' in data:
                user.role = data['role']
            
            db.session.commit()
            
            return jsonify({'message': 'Пользователь успешно обновлен'}), 200
        
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'Ошибка обновления пользователя: {str(e)}'}), 500
    
    elif request.method == 'DELETE':
        try:
            # Проверяем, что администратор не удаляет сам себя
            if user.user_id == current_user.user_id:
                return jsonify({'message': 'Вы не можете удалить свой собственный аккаунт'}), 400
            
            db.session.delete(user)
            db.session.commit()
            
            return jsonify({'message': 'Пользователь успешно удален'}), 200
        
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'Ошибка удаления пользователя: {str(e)}'}), 500