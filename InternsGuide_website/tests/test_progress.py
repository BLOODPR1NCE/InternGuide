import pytest
from backend.models import Progress, User, Material, Test, db
from werkzeug.security import generate_password_hash

@pytest.fixture
def test_data(app, client):
    with app.app_context():
        # Создаем пользователей с обязательным surname
        author = User(
            name='Author',
            surname='AuthorSurname',  # Обязательное поле
            login='author',
            password=generate_password_hash('pass'),
            role='curator'
        )
        db.session.add(author)
        db.session.commit()
        
        user = User(
            name='Progress',
            surname='TestSurname',  # Обязательное поле
            login='progresstest',
            password=generate_password_hash('testpass'),
            role='trainee'
        )
        db.session.add(user)
        db.session.commit()
        
        # Создаем материал с указанием автора
        material = Material(
            title='Test Material',
            author_id=author.user_id,
            content='Test content'
        )
        db.session.add(material)
        
        # Создаем тест
        test = Test(
            title='Test Test',
            creator_id=author.user_id,
            max_score=10
        )
        db.session.add(test)
        
        db.session.commit()
        
        # Получаем токен для пользователя
        login_res = client.post('/auth/login', json={
            'login': 'progresstest',
            'password': 'testpass'
        })
        token = login_res.json['token']
        
        yield {
            'user_id': user.user_id,
            'material_id': material.material_id,
            'test_id': test.test_id,
            'token': token
        }

def test_track_material_progress(client, test_data):
    headers = {'Authorization': f'Bearer {test_data["token"]}'}
    response = client.post(
        f'/progress/progress/material/{test_data["material_id"]}',
        headers=headers
    )
    assert response.status_code == 200

def test_track_test_progress(client, test_data):
    headers = {'Authorization': f'Bearer {test_data["token"]}'}
    response = client.post(
        f'/progress/progress/test/{test_data["test_id"]}',
        json={'score': 8},
        headers=headers
    )
    assert response.status_code == 200
    assert 'updated' in response.json['message'].lower()

def test_get_user_progress(client, test_data):
    headers = {'Authorization': f'Bearer {test_data["token"]}'}
    response = client.get('/progress/progress', headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json['progress'], list)