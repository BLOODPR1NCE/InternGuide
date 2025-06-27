import pytest
from backend.models import Test, Question, User, db
from werkzeug.security import generate_password_hash

@pytest.fixture
def test_creator_token(app, client):
    with app.app_context():
        creator = User(
            name='Test',
            surname='Creator',
            login='testcreator',
            password=generate_password_hash('creatorpass'),
            role='curator'
        )
        db.session.add(creator)
        db.session.commit()
        
        # Login to get token
        response = client.post('/auth/login', json={
            'login': 'testcreator',
            'password': 'creatorpass'
        })
        return response.json['token']

def test_create_test(client, test_creator_token):
    headers = {'Authorization': f'Bearer {test_creator_token}'}
    test_data = {
        'title': 'New Test',
        'description': 'Test description',
        'questions': [
            {
                'text': 'Question 1',
                'points': 2,
                'options': {'A': 'Option A', 'B': 'Option B'},
                'correct_option': 'A'
            }
        ]
    }
    
    response = client.post('/tests/tests', json=test_data, headers=headers)
    assert response.status_code == 201
    assert 'created' in response.json['message'].lower()
    
def test_get_tests(client, test_creator_token):
    headers = {'Authorization': f'Bearer {test_creator_token}'}
    response = client.get('/tests/tests', headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json['tests'], list)

def test_get_test_details(client, test_creator_token):
    headers = {'Authorization': f'Bearer {test_creator_token}'}
    # First create a test
    with client.application.app_context():
        creator = User.query.filter_by(login='testcreator').first()
        test = Test(title='Sample Test', creator_id=creator.user_id, max_score=10)
        db.session.add(test)
        db.session.commit()
        test_id = test.test_id
    
    response = client.get(f'/tests/tests/{test_id}', headers=headers)
    assert response.status_code == 200
    assert 'title' in response.json['test']