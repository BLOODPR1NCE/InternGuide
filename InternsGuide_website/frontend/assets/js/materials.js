const user = JSON.parse(localStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadMaterials();
    
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(loadMaterials, 300));
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', loadMaterials);
    }

    // Обработчики для страницы просмотра материала
    if (document.getElementById('materialContent')) {
        loadMaterialContent();
    }
    
    // Обработчики для страницы создания материала
    if (document.getElementById('createMaterialForm')) {
        setupMaterialForm();
    }
});

let allMaterials = [];

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
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    
    authFetch('/materials')
        .then(response => response.json())
        .then(data => {
            allMaterials = data.materials || [];
            
            // Фильтрация материалов
            const filteredMaterials = allMaterials.filter(material => {
                const matchesSearch = material.title.toLowerCase().includes(searchTerm) || 
                                    (material.content && material.content.toLowerCase().includes(searchTerm));
                const matchesCategory = !category || material.category === category;
                return matchesSearch && matchesCategory;
            });
            
            renderMaterials(filteredMaterials);
        })
        .catch(error => {
            console.error('Error loading materials:', error);
            renderError(error);
        });
}

function renderMaterials(materials) {
    console.log('Текущий пользователь:', JSON.parse(localStorage.getItem('user')));
    console.log('Материалы:', materials);
    
    const materialsContainer = document.getElementById('materialsContainer');
    if (!materialsContainer) return;
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    if (materials.length === 0) {
        materialsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h3>Материалы не найдены</h3>
                <p>Попробуйте изменить параметры поиска</p>
            </div>
        `;
        return;
    }
    
    materialsContainer.innerHTML = '';
    
    materials.forEach(material => {
            const isCreator = user && material && (user.user_id == material.author_id);
            const isAdmin = user.role === 'admin';
            const isCurator = user.role === 'curator';
    
            // Кураторы могут редактировать только СВОИ материалы, админы - все
            const showActions = (isCurator && isCreator) || isAdmin;

        console.log('Current user:', user);
        console.log('Material author_id:', material.author);
        console.log('Comparison:', user.user_id == material.author_id); 
        console.log(`Material ${material.material_id}: isCreator=${isCreator}, isCurator=${isCurator}, showActions=${showActions}`);
        
        const materialCard = document.createElement('div');
        materialCard.className = 'material-card';
        materialCard.innerHTML = `
            <div class="material-image" style="background-color: ${getCategoryColor(material.category)}">
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
                        ${showActions ? `
                        <button class="btn-icon text-warning" onclick="event.stopPropagation(); editMaterial(${material.material_id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon text-danger" onclick="event.stopPropagation(); deleteMaterial(${material.material_id})">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        materialsContainer.appendChild(materialCard);
    });
}

function getCategoryColor(category) {
    const colors = {
        'О компании': '#e6f7ff',
        'Корпоративная культура': '#fff7e6',
        'Рабочие процессы': '#e6ffed',
    };
    return colors[category] || '#f5f5f5';
}

// Функция для задержки выполнения (debounce)
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

function editMaterial(materialId) {
    console.log('Editing material with ID:', materialId);
    window.location.href = `edit.html?id=${materialId}`;
}

function deleteMaterial(materialId) {
    if (confirm('Вы уверены, что хотите удалить этот материал?')) {
        authFetch(`/materials/${materialId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                alert('Материал успешно удалён');
                loadMaterials();
            }
        })
        .catch(error => {
            console.error('Error deleting material:', error);
            alert('Ошибка при удалении материала');
        });
    }
}


function loadMaterialContent() {
    const urlParams = new URLSearchParams(window.location.search);
    const materialId = urlParams.get('id');
    
    if (!materialId) {
        window.location.href = 'index.html';
        return;
    }
    
    authFetch(`/materials/${materialId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
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

            document.getElementById('completeMaterialBtn').addEventListener('click', () => {
                completeMaterial(materialId);
            });
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
window.editMaterial = editMaterial;
window.deleteMaterial = deleteMaterial;