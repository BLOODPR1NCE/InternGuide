import pytest
from datetime import datetime
from backend.models import db, User, Material, Test, Question, Progress
from backend import create_app
from werkzeug.security import generate_password_hash, check_password_hash

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

def test_user_model(app):
    with app.app_context():
        user = User(
            name='John',
            surname='Doe',
            login='johndoe',
            password='hashed_password',
            role='trainee'
        )
        db.session.add(user)
        db.session.commit()
        
        assert user.user_id is not None
        assert user.registration_date is not None
        assert user.role == 'trainee'

def test_material_model(app):
    with app.app_context():
        user = User(
            name='Author',
            surname='User',
            login='author',
            password='hashed_password',
            role='curator'
        )
        db.session.add(user)
        db.session.commit()
        
        material = Material(
            title='Test Material',
            author_id=user.user_id,
            content='Test content',
            category='Test category'
        )
        db.session.add(material)
        db.session.commit()
        
        assert material.material_id is not None
        assert material.upload_date is not None
        assert material.author == user
        assert material.title == 'Test Material'

def test_test_model(app):
    with app.app_context():
        user = User(
            name='Test',
            surname='Creator',
            login='creator',
            password='hashed_password',
            role='curator'
        )
        db.session.add(user)
        db.session.commit()
        
        test = Test(
            title='Test Title',
            creator_id=user.user_id,
            description='Test description',
            max_score=10
        )
        db.session.add(test)
        db.session.commit()
        
        assert test.test_id is not None
        assert test.creation_date is not None
        assert test.creator == user
        assert test.title == 'Test Title'
        assert test.description == 'Test description'

def test_question_model(app):
    with app.app_context():
        user = User(
            name='Test',
            surname='Creator',
            login='creator',
            password='hashed_password',
            role='curator'
        )
        db.session.add(user)
        db.session.commit()
        
        test = Test(
            title='Test Title',
            creator_id=user.user_id,
            description='Test description',
            max_score=10
        )
        db.session.add(test)
        db.session.commit()
        
        question = Question(
            test_id=test.test_id,
            text='Test question',
            points=2,
            option_a='Option A',
            option_b='Option B',
            correct_option='A'
        )
        db.session.add(question)
        db.session.commit()
        
        assert question.question_id is not None
        assert question.test == test
        assert str(question) == '<Question 1>'

def test_progress_model(app):
    with app.app_context():
        user = User(
            name='John',
            surname='Doe',
            login='johndoe',
            password='hashed_password',
            role='trainee'
        )
        db.session.add(user)
        db.session.commit()
        
        test = Test(
            title='Test Title',
            creator_id=user.user_id,
            description='Test description',
            max_score=10
        )
        db.session.add(test)
        db.session.commit()
        
        progress = Progress(
            user_id=user.user_id,
            test_id=test.test_id,
            score=8,
            status='completed'
        )
        db.session.add(progress)
        db.session.commit()
        
        assert progress.progress_id is not None
        assert progress.completion_date is not None
        assert progress.user == user
        assert progress.test == test
        assert progress.status == 'completed'