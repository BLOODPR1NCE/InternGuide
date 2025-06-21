from flask import Blueprint, request, jsonify
from backend.utils import token_required, admin_required, generate_password_hash
from backend.models import User, db

users_bp = Blueprint('users', __name__)

@users_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def get_users(current_user):
    users = User.query.all()
    
    output = []
    for user in users:
        user_data = {
            'user_id': user.user_id,
            'name': user.name,
            'surname': user.surname,
            'login': user.login,
            'role': user.role,
            'registration_date': user.registration_date.strftime('%Y-%m-%d')
        }
        output.append(user_data)
    
    return jsonify({'users': output}), 200

@users_bp.route('/users/<int:user_id>', methods=['GET'])
@token_required
def get_user(current_user, user_id):
    if current_user.user_id != user_id and current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized access!'}), 403
    
    user = User.query.get_or_404(user_id)
    
    user_data = {
        'user_id': user.user_id,
        'name': user.name,
        'surname': user.surname,
        'login': user.login,
        'role': user.role,
        'registration_date': user.registration_date.strftime('%Y-%m-%d')
    }
    
    return jsonify({'user': user_data}), 200

@users_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
def update_user(current_user, user_id):
    if current_user.user_id != user_id and current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized access!'}), 403
    
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    user.name = data.get('name', user.name)
    user.surname = data.get('surname', user.surname)
    
    if 'password' in data:
        user.password = generate_password_hash(data['password'])
    
    db.session.commit()
    
    return jsonify({'message': 'User updated!'}), 200

@users_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, user_id):
    user = User.query.get_or_404(user_id)
    
    if user.role == 'admin':
        return jsonify({'message': 'Cannot delete admin user!'}), 403
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted!'}), 200

@users_bp.route('/users/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    user_data = {
        'user_id': current_user.user_id,
        'name': current_user.name,
        'surname': current_user.surname,
        'login': current_user.login,
        'role': current_user.role,
        'registration_date': current_user.registration_date.strftime('%Y-%m-%d')
    }
    return jsonify({'user': user_data}), 200