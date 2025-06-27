import pytest
from datetime import datetime
from backend.models import Material, User, db
from werkzeug.security import generate_password_hash

@pytest.fixture
def test_curator(app, client):
    with app.app_context():
        user = User(
            name='Curator',
            surname='Test',
            login='curator',
            password=generate_password_hash('curatorpass'),
            role='curator'
        )
        db.session.add(user)
        db.session.commit()
        
        # Login to get token
        response = client.post('/auth/login', json={
            'login': 'curator',
            'password': 'curatorpass'
        })
        return {
        'token': response.json['token'],
        'user_id': user.user_id
    }

def test_create_material(client, test_curator):
    headers = {'Authorization': f'Bearer {test_curator["token"]}'}
    response = client.post('/materials/materials', json={
        'title': 'New Material',
        'content': 'Test content',
        'category': 'Test category'
    }, headers=headers)
    
    assert response.status_code == 201
    assert 'created' in response.json['message'].lower()

def test_get_materials(client, test_curator):
    headers = {'Authorization': f'Bearer {test_curator["token"]}'}
    response = client.get('/materials/materials', headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json['materials'], list)

def test_update_material(client, test_curator):
    # First create a material
    with client.application.app_context():
        curator = User.query.filter_by(login='curator').first()
        material = Material(
            title='Test Material',
            author_id=curator.user_id,
            content='Old content',
            category='Old category'
        )
        db.session.add(material)
        db.session.commit()
        material_id = material.material_id
    
    headers = {'Authorization': f'Bearer {test_curator["token"]}'}
    response = client.put(f'/materials/materials/{material_id}', json={
        'title': 'Updated Title',
        'content': 'Updated content'
    }, headers=headers)
    
    assert response.status_code == 200
    assert 'материал успешно обновлен' in response.json['message'].lower()