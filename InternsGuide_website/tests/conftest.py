import pytest
from backend import create_app
from backend.models import User, db  # Добавлен импорт User
from werkzeug.security import generate_password_hash

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SECRET_KEY'] = 'test-secret-key'
    
    from backend.routes.auth import auth_bp
    from backend.routes.materials import materials_bp
    from backend.routes.progress import progress_bp
    from backend.routes.tests import tests_bp
    from backend.routes.users import users_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(materials_bp, url_prefix='/materials')
    app.register_blueprint(progress_bp, url_prefix='/progress')
    app.register_blueprint(tests_bp, url_prefix='/tests')
    app.register_blueprint(users_bp, url_prefix='/users')
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture(autouse=True)
def cleanup_db(app):
    with app.app_context():
        db.session.remove()
        db.drop_all()
        db.create_all()
        
@pytest.fixture
def test_user(app):
    with app.app_context():
        user = User(
            name='Test',
            surname='User',  # Обязательное поле
            login='testuser',
            password=generate_password_hash('testpassword'),
            role='trainee'
        )
        db.session.add(user)
        db.session.commit()
        yield user
        db.session.delete(user)
        db.session.commit()