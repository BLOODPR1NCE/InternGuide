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
            'upload_date': material.upload_date.strftime('%Y-%m-%d'),
            'author_id': material.author_id
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
    try:
        # Получаем JSON данные
        data = request.get_json()
        
        # Проверяем наличие обязательных полей
        if not data or 'title' not in data or not data['title']:
            return jsonify({'message': 'Название обязательно'}), 400
        
        material = Material.query.get_or_404(material_id)
        
        # Проверка прав доступа
        if material.author_id != current_user.user_id and current_user.role != 'admin':
            return jsonify({'message': 'Недостаточно прав для редактирования'}), 403
        
        # Обновляем материал
        material.title = data['title']
        material.content = data.get('content', material.content)
        material.category = data.get('category', material.category)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Материал успешно обновлен',
            'material_id': material.material_id
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"Ошибка при обновлении: {str(e)}")
        return jsonify({'message': f'Ошибка сервера: {str(e)}'}), 500

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