import pytest
import jwt
from flask import Flask, jsonify, request
from backend.utils import token_required, admin_required, curator_required
from backend.models import User, db
from backend.config import Config
from datetime import datetime

@pytest.fixture
def app():
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

def test_token_required_success(app):
    with app.app_context():
        # Create test user
        user = User(
            name='Test',
            surname='User',
            login='testuser',
            password='hashed_password',
            role='trainee'
        )
        db.session.add(user)
        db.session.commit()
        
        # Generate token
        token = jwt.encode({
            'user_id': user.user_id,
            'exp': datetime.utcnow()
        }, Config.SECRET_KEY, algorithm="HS256")
        
        # Create test route
        @app.route('/protected')
        @token_required
        def protected_route(current_user):
            return jsonify({'message': 'Success', 'user_id': current_user.user_id})
        
        # Test with valid token
        with app.test_client() as client:
            response = client.get(
                '/protected',
                headers={'Authorization': f'Bearer {token}'}
            )
            assert response.status_code == 200
            assert response.json['message'] == 'Success'
            assert response.json['user_id'] == user.user_id

def test_token_required_missing_token(app):
    with app.app_context():
        @app.route('/protected')
        @token_required
        def protected_route(current_user):
            return jsonify({'message': 'Success'})
        
        with app.test_client() as client:
            response = client.get('/protected')
            assert response.status_code == 401
            assert response.json['message'] == 'Token is missing!'

def test_admin_required_success(app):
    with app.app_context():
        # Create admin user
        admin = User(
            name='Admin',
            surname='User',
            login='admin',
            password='hashed_password',
            role='admin'
        )
        db.session.add(admin)
        db.session.commit()
        
        # Create test route
        @app.route('/admin')
        @token_required
        @admin_required
        def admin_route(current_user):
            return jsonify({'message': 'Admin access granted'})
        
        # Generate token
        token = jwt.encode({
            'user_id': admin.user_id,
            'exp': datetime.utcnow()
        }, Config.SECRET_KEY, algorithm="HS256")
        
        # Test with admin user
        with app.test_client() as client:
            response = client.get(
                '/admin',
                headers={'Authorization': f'Bearer {token}'}
            )
            assert response.status_code == 200
            assert response.json['message'] == 'Admin access granted'

def test_admin_required_denied(app):
    with app.app_context():
        # Create regular user
        user = User(
            name='Regular',
            surname='User',
            login='regular',
            password='hashed_password',
            role='trainee'
        )
        db.session.add(user)
        db.session.commit()
        
        # Create test route
        @app.route('/admin')
        @token_required
        @admin_required
        def admin_route(current_user):
            return jsonify({'message': 'Admin access granted'})
        
        # Generate token
        token = jwt.encode({
            'user_id': user.user_id,
            'exp': datetime.utcnow()
        }, Config.SECRET_KEY, algorithm="HS256")
        
        # Test with non-admin user
        with app.test_client() as client:
            response = client.get(
                '/admin',
                headers={'Authorization': f'Bearer {token}'}
            )
            assert response.status_code == 403
            assert response.json['message'] == 'Admin access required!'

def test_curator_required_success(app):
    with app.app_context():
        # Create curator user
        curator = User(
            name='Curator',
            surname='User',
            login='curator',
            password='hashed_password',
            role='curator'
        )
        db.session.add(curator)
        db.session.commit()
        
        # Create test route
        @app.route('/curator')
        @token_required
        @curator_required
        def curator_route(current_user):
            return jsonify({'message': 'Curator access granted'})
        
        # Generate token
        token = jwt.encode({
            'user_id': curator.user_id,
            'exp': datetime.utcnow()
        }, Config.SECRET_KEY, algorithm="HS256")
        
        # Test with curator user
        with app.test_client() as client:
            response = client.get(
                '/curator',
                headers={'Authorization': f'Bearer {token}'}
            )
            assert response.status_code == 200
            assert response.json['message'] == 'Curator access granted'