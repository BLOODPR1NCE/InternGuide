from flask import Blueprint, request, jsonify
from backend.models import Material, db
from backend.utils import token_required, curator_required

materials_bp = Blueprint('materials', __name__)

@materials_bp.route('/materials', methods=['GET'])
@token_required
def get_materials(current_user):
    materials = Material.query.all()
    
    output = []
    for material in materials:
        material_data = {
            'material_id': material.material_id,
            'title': material.title,
            'author': f"{material.author.name} {material.author.surname}",
            'category': material.category,
            'upload_date': material.upload_date.strftime('%Y-%m-%d')
        }
        output.append(material_data)
    
    return jsonify({'materials': output}), 200

@materials_bp.route('/materials/<int:material_id>', methods=['GET'])
@token_required
def get_material(current_user, material_id):
    material = Material.query.get_or_404(material_id)
    
    material_data = {
        'material_id': material.material_id,
        'title': material.title,
        'author': f"{material.author.name} {material.author.surname}",
        'content': material.content,
        'category': material.category,
        'upload_date': material.upload_date.strftime('%Y-%m-%d'),
        'file_url': material.file_url
    }
    
    return jsonify({'material': material_data}), 200

@materials_bp.route('/materials', methods=['POST'])
@token_required
@curator_required
def create_material(current_user):
    data = request.get_json()
    
    new_material = Material(
        title=data['title'],
        author_id=current_user.user_id,
        content=data.get('content'),
        category=data.get('category'),
        file_url=data.get('file_url')
    )
    
    db.session.add(new_material)
    db.session.commit()
    
    return jsonify({'message': 'Material created!'}), 201

@materials_bp.route('/materials/<int:material_id>', methods=['PUT'])
@token_required
@curator_required
def update_material(current_user, material_id):
    material = Material.query.get_or_404(material_id)
    
    if material.author_id != current_user.user_id and current_user.role != 'admin':
        return jsonify({'message': 'You can only edit your own materials!'}), 403
    
    data = request.get_json()
    
    material.title = data.get('title', material.title)
    material.content = data.get('content', material.content)
    material.category = data.get('category', material.category)
    material.file_url = data.get('file_url', material.file_url)
    
    db.session.commit()
    
    return jsonify({'message': 'Material updated!'}), 200

@materials_bp.route('/materials/<int:material_id>', methods=['DELETE'])
@token_required
@curator_required
def delete_material(current_user, material_id):
    material = Material.query.get_or_404(material_id)
    
    if material.author_id != current_user.user_id and current_user.role != 'admin':
        return jsonify({'message': 'You can only delete your own materials!'}), 403
    
    db.session.delete(material)
    db.session.commit()
    
    return jsonify({'message': 'Material deleted!'}), 200