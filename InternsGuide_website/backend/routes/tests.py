from flask import Blueprint, request, jsonify
from backend.models import Test, Question, db
from backend.utils import token_required, curator_required

tests_bp = Blueprint('tests', __name__)

@tests_bp.route('/tests', methods=['GET'])
@token_required
def get_tests(current_user):
    tests = Test.query.all()
    
    output = []
    for test in tests:
        test_data = {
            'test_id': test.test_id,
            'title': test.title,
            'creator': f"{test.creator.name} {test.creator.surname}",
            'description': test.description,
            'max_score': test.max_score,
            'question_count': len(test.questions),
            'creator_id': test.creator_id
        }
        output.append(test_data)
    
    return jsonify({'tests': output}), 200

@tests_bp.route('/tests/<int:test_id>', methods=['GET'])
@token_required
def get_test(current_user, test_id):
    test = Test.query.get_or_404(test_id)
    
    test_data = {
        'test_id': test.test_id,
        'title': test.title,
        'description': test.description,
        'max_score': test.max_score,
        'questions': []
    }
    
    for question in test.questions:
        question_data = {
            'question_id': question.question_id,
            'text': question.text,
            'points': question.points,
            'options': {
                'A': question.option_a,
                'B': question.option_b,
                'C': question.option_c,
                'D': question.option_d
            },
            'correct_option': question.correct_option
        }
        test_data['questions'].append(question_data)
    
    return jsonify({'test': test_data}), 200

@tests_bp.route('/tests', methods=['POST'])
@token_required
@curator_required
def create_test(current_user):
    data = request.get_json()
    
    new_test = Test(
        title=data['title'],
        creator_id=current_user.user_id,
        description=data.get('description'),
        max_score=sum(q['points'] for q in data['questions'])
    )
    
    db.session.add(new_test)
    db.session.commit()
    
    for question in data['questions']:
        new_question = Question(
            test_id=new_test.test_id,
            text=question['text'],
            points=question['points'],
            option_a=question['options']['A'],
            option_b=question['options']['B'],
            option_c=question['options'].get('C'),
            option_d=question['options'].get('D'),
            correct_option=question['correct_option']
        )
        db.session.add(new_question)
    
    db.session.commit()
    
    return jsonify({'message': 'Test created!', 'test_id': new_test.test_id}), 201

@tests_bp.route('/tests/<int:test_id>', methods=['PUT'])
@token_required
@curator_required
def update_test(current_user, test_id):
    test = Test.query.get_or_404(test_id)
    
    if test.creator_id != current_user.user_id and current_user.role != 'admin':
        return jsonify({'message': 'You can only edit your own tests!'}), 403
    
    data = request.get_json()
    
    test.title = data.get('title', test.title)
    test.description = data.get('description', test.description)
    
    # Удаляем старые вопросы
    Question.query.filter_by(test_id=test_id).delete()
    
    # Добавляем новые вопросы
    test.max_score = sum(q['points'] for q in data['questions'])
    for question in data['questions']:
        new_question = Question(
            test_id=test.test_id,
            text=question['text'],
            points=question['points'],
            option_a=question['options']['A'],
            option_b=question['options']['B'],
            option_c=question['options'].get('C'),
            option_d=question['options'].get('D'),
            correct_option=question['correct_option']
        )
        db.session.add(new_question)
    
    db.session.commit()
    
    return jsonify({'message': 'Test updated!'}), 200

@tests_bp.route('/tests/<int:test_id>', methods=['DELETE'])
@token_required
def delete_test(current_user, test_id):
    test = Test.query.get_or_404(test_id)
    
    if test.creator_id != current_user.user_id and current_user.role != 'admin':
        return jsonify({'message': 'You can only delete your own tests!'}), 403
    
    db.session.delete(test)
    db.session.commit()
    
    return jsonify({'message': 'Test deleted!'}), 200