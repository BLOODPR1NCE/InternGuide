import pytest
from datetime import datetime, timedelta
import jwt
from flask import jsonify
from backend.config import Config
from backend.models import User, db
from werkzeug.security import generate_password_hash
from backend.routes.auth import token_required 

# Добавим временный маршрут для тестов
@pytest.fixture(autouse=True)
def add_protected_route(app):
    @app.route('/protected-route')
    @token_required
    def protected_route(current_user):
        return jsonify({'message': 'Success'})

def test_register_success(client):
    # Очистка перед тестом
    with client.application.app_context():
        User.query.filter_by(login='newuser').delete()
        db.session.commit()

    response = client.post('/auth/register', json={
        'name': 'New',
        'surname': 'User',
        'login': 'newuser',
        'password': 'newpassword'
    })
    assert response.status_code == 201
    assert 'успешно зарегистрирован' in response.json['message']

def test_register_missing_fields(client):
    response = client.post('/auth/register', json={
        'name': 'New',
        'surname': 'User',
        'login': 'newuser'
        # Нет пароля
    })
    assert response.status_code == 400
    assert 'обязательные поля' in response.json['message']

def test_login_success(client, test_user):
    response = client.post('/auth/login', json={
        'login': 'testuser',
        'password': 'testpassword'
    })
    assert response.status_code == 200
    assert 'token' in response.json
    assert response.json['user']['login'] == 'testuser'

def test_login_invalid_credentials(client, test_user):
    response = client.post('/auth/login', json={
        'login': 'testuser',
        'password': 'wrongpassword'
    })
    assert response.status_code == 401
    assert 'Invalid credentials' in response.json['message']

def test_protected_route_success(client, test_user):
    token = jwt.encode({
        'user_id': test_user.user_id,
        'exp': datetime.utcnow() + timedelta(hours=1)
    }, Config.SECRET_KEY, algorithm="HS256")
    
    response = client.get('/protected-route', headers={
        'Authorization': f'Bearer {token}'
    })
    assert response.status_code == 200
    assert response.json['message'] == 'Success'

def test_protected_route_missing_token(client):
    response = client.get('/protected-route')
    assert response.status_code == 401
    assert 'Требуется токен' in response.json['message']

def test_protected_route_invalid_token(client):
    response = client.get('/protected-route', headers={
        'Authorization': 'Bearer invalidtoken'
    })
    assert response.status_code == 401
    assert 'Неверный токен' in response.json['message']