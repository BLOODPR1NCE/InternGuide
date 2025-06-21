
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadMaterials();
    
    // Обработчики для страницы просмотра материала
    if (document.getElementById('materialContent')) {
        loadMaterialContent();
    }
    
    // Обработчики для страницы создания материала
    if (document.getElementById('createMaterialForm')) {
        setupMaterialForm();
    }
});

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = '/frontend/templates/auth/login.html';
        return false;
    }
    return true;
}

function loadMaterials() {
    authFetch('/materials')
        .then(response => response.json())
        .then(data => {
            const materialsContainer = document.getElementById('materialsContainer');
            if (!materialsContainer) return;
            
            materialsContainer.innerHTML = '';
            
            if (data.materials.length === 0) {
                materialsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-book-open"></i>
                        <h3>Материалы не найдены</h3>
                        <p>Попробуйте изменить параметры поиска</p>
                    </div>
                `;
                return;
            }
            
            data.materials.forEach(material => {
                const materialCard = document.createElement('div');
                materialCard.className = 'material-card';
                materialCard.innerHTML = `
                    <div class="material-image">
                        <i class="fas fa-file-alt fa-3x"></i>
                    </div>
                    <div class="material-content">
                        <span class="material-category">${material.category || 'Без категории'}</span>
                        <h3>${material.title}</h3>
                        <p>${material.content?.substring(0, 150) || 'Описание отсутствует'}...</p>
                        <div class="material-meta">
                            <span>${new Date(material.upload_date).toLocaleDateString()}</span>
                            <div class="material-actions">
                                <button class="btn-icon" onclick="viewMaterial(${material.material_id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                materialsContainer.appendChild(materialCard);
            });
        })
        .catch(error => {
            console.error('Error loading materials:', error);
            if (error === 'No token found') {
                logout();
            }
        });
}

function loadMaterialContent() {
    const urlParams = new URLSearchParams(window.location.search);
    const materialId = urlParams.get('id');
    
    if (!materialId) {
        window.location.href = 'index.html';
        return;
    }
    
    authFetch(`/materials/${materialId}`)
        .then(response => response.json())
        .then(data => {
            const material = data.material;
            const materialContent = document.getElementById('materialContent');
            
            materialContent.innerHTML = `
                <h2>${material.title}</h2>
                <div class="material-meta">
                    <span class="material-category">${material.category || 'Без категории'}</span>
                    <span>${new Date(material.upload_date).toLocaleDateString()}</span>
                </div>
                <div class="material-text">
                    ${material.content || '<p>Содержание отсутствует</p>'}
                </div>
                ${material.file_url ? `
                <div class="material-file">
                    <a href="${material.file_url}" class="btn btn-outline" target="_blank">
                        <i class="fas fa-download"></i> Скачать файл
                    </a>
                </div>
                ` : ''}
            `;
            
            // Показываем кнопку только для стажёров
            const user = JSON.parse(localStorage.getItem('user'));
            if (user.role === 'trainee') {
                document.getElementById('completeMaterialBtn').addEventListener('click', () => {
                    completeMaterial(materialId);
                });
            } else {
                document.getElementById('completeMaterialBtn').style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error loading material:', error);
            if (error === 'No token found') {
                logout();
            } else {
                window.location.href = 'index.html';
            }
        });
}

function completeMaterial(materialId) {
    authFetch(`/progress/material/${materialId}`, {
        method: 'POST'
    })
    .then(response => {
        if (response.ok) {
            alert('Материал отмечен как пройденный!');
            window.location.href = '../progress/index.html';
        }
    })
    .catch(error => {
        console.error('Error completing material:', error);
        alert('Ошибка при отметке материала');
    });
}

function setupMaterialForm() {
    const form = document.getElementById('createMaterialForm');
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const title = document.getElementById('title').value;
        const category = document.getElementById('category').value;
        const content = document.getElementById('content').value;
        const fileInput = document.getElementById('file');
        
        // В реальном приложении здесь была бы загрузка файла
        const formData = {
            title,
            category,
            content
        };
        
        authFetch('/materials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (response.ok) {
                alert('Материал успешно создан!');
                window.location.href = 'index.html';
            }
        })
        .catch(error => {
            console.error('Error creating material:', error);
            alert('Ошибка при создании материала');
        });
    });
}

function viewMaterial(materialId) {
    window.location.href = `view.html?id=${materialId}`;
}

// Экспортируем функции для использования в HTML
window.viewMaterial = viewMaterial;