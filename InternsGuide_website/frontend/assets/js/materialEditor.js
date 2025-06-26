document.addEventListener('DOMContentLoaded', function() {
    // Проверка авторизации
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/frontend/templates/auth/login.html';
        return;
    }

    const materialId = new URLSearchParams(window.location.search).get('id');
    console.log('Opening editor for material ID:', materialId);
    
    if (!materialId) {
        console.error('No material ID provided');
        window.location.href = 'index.html';
        return;
    }

    // ... (остальной код инициализации файлов)

    // Загружаем существующий материал
    authFetch(`/materials/${materialId}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!data.material) throw new Error('Material data is empty');
            
            const material = data.material;
            document.getElementById('title').value = material.title;
            document.getElementById('category').value = material.category || '';
            document.getElementById('content').value = material.content || '';
        })
        .catch(error => {
            console.error('Error loading material:', error);
            alert(`Ошибка загрузки материала: ${error.message}`);
        });

    // Обработчик отправки формы
    document.getElementById('editMaterialForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const materialId = new URLSearchParams(window.location.search).get('id');
    
    try {
        // Собираем данные из формы в объект
        const formData = {
            title: document.getElementById('title').value,
            category: document.getElementById('category').value,
            content: document.getElementById('content').value
        };


        console.log('Отправка данных на сервер:', formData);

        // Отправляем запрос и ЖДЕМ ответ с await
        const response = await authFetch(`/materials/${materialId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json' // Добавляем заголовок
            },
            body: JSON.stringify(formData) // Преобразуем объект в JSON
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка сервера:', response.status, errorText);
            throw new Error(errorText || 'Ошибка сервера');
        }

        const result = await response.json(); // Добавляем await
        console.log('Успешный ответ:', result);
        alert('Материал успешно обновлен!');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Ошибка при обновлении:', error);
        alert(`Ошибка при обновлении: ${error.message}`);
    }
});
});