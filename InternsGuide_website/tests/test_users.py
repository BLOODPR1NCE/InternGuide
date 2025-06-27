import pytest
from backend.models import User, db
from werkzeug.security import generate_password_hash

@pytest.fixture
def admin_token(app, client):
    with app.app_context():
        admin = User(
            name='Admin',
            surname='User',
            login='admin',
            password=generate_password_hash('adminpass'),
            role='admin'
        )
        db.session.add(admin)
        db.session.commit()
        
        # Login to get token
        response = client.post('/auth/login', json={
            'login': 'admin',
            'password': 'adminpass'
        })
        return response.json['token']

def test_get_users(client, admin_token):
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = client.get('/users/users', headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json['users'], list)

def test_update_user_profile(client):
    # First create a test user
    with client.application.app_context():
        user = User(
            name='Test',
            surname='User',
            login='testuser',
            password=generate_password_hash('testpass'),
        )
        db.session.add(user)
        db.session.commit()
        user_id = user.user_id
    
    # Login to get token
    login_response = client.post('/auth/login', json={
        'login': 'testuser',
        'password': 'testpass'
    })
    assert 'token' in login_response.json
    token = login_response.json['token']
    
    headers = {'Authorization': f'Bearer {token}'}
    update_response = client.put(f'/users/users/{user_id}', json={
        'name': 'Updated Name'
    }, headers=headers)
    
    assert update_response.status_code == 200
    assert 'updated' in update_response.json['message'].lower()