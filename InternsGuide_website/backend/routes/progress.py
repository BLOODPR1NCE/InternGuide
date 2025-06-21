from flask import Blueprint, request, jsonify
from backend.models import Progress, Material, Test, db
from backend.utils import token_required

progress_bp = Blueprint('progress', __name__)

@progress_bp.route('/progress', methods=['GET'])
@token_required
def get_user_progress(current_user):
    progress_records = Progress.query.filter_by(user_id=current_user.user_id).all()
    
    output = []
    for record in progress_records:
        progress_data = {
            'progress_id': record.progress_id,
            'test_id': record.test_id,
            'material_id': record.material_id,
            'completion_date': record.completion_date.strftime('%Y-%m-%d'),
            'score': record.score,
            'status': record.status
        }
        
        if record.material_id:
            material = Material.query.get(record.material_id)
            progress_data['title'] = material.title
            progress_data['type'] = 'material'
        elif record.test_id:
            test = Test.query.get(record.test_id)
            progress_data['title'] = test.title
            progress_data['type'] = 'test'
        
        output.append(progress_data)
    
    return jsonify({'progress': output}), 200

@progress_bp.route('/progress/material/<int:material_id>', methods=['POST'])
@token_required
def track_material_progress(current_user, material_id):
    material = Material.query.get_or_404(material_id)
    
    progress = Progress.query.filter_by(
        user_id=current_user.user_id,
        material_id=material_id
    ).first()
    
    if progress:
        progress.status = 'completed'
    else:
        progress = Progress(
            user_id=current_user.user_id,
            material_id=material_id,
            status='completed'
        )
        db.session.add(progress)
    
    db.session.commit()
    
    return jsonify({'message': 'Material progress updated!'}), 200

@progress_bp.route('/progress/test/<int:test_id>', methods=['POST'])
@token_required
def track_test_progress(current_user, test_id):
    data = request.get_json()
    test = Test.query.get_or_404(test_id)
    
    progress = Progress.query.filter_by(
        user_id=current_user.user_id,
        test_id=test_id
    ).first()
    
    if progress:
        progress.score = data['score']
        progress.status = 'completed' if data['score'] >= test.max_score * 0.6 else 'failed'
    else:
        progress = Progress(
            user_id=current_user.user_id,
            test_id=test_id,
            score=data['score'],
            status='completed' if data['score'] >= test.max_score * 0.6 else 'failed'
        )
        db.session.add(progress)
    
    db.session.commit()
    
    return jsonify({'message': 'Test progress updated!'}), 200