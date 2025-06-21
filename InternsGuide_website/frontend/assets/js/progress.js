document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadProgress();
    
    document.getElementById('logout')?.addEventListener('click', logout);
    
    // Переключение вкладок
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
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

function loadProgress() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        logout();
        return;
    }

    const materialsContainer = document.getElementById('materialsProgressContainer');
    const testsContainer = document.getElementById('testsProgressContainer');
    [materialsContainer, testsContainer].forEach(container => {
        if (container) {
            container.innerHTML = '<div class="loading">Загрузка прогресса...</div>';
        }
    });

    
    authFetch('/progress')
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || `Ошибка сервера: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (!data || !data.progress) {
                throw new Error('Invalid data format');
            }
            const materialsContainer = document.getElementById('materialsProgressContainer');
            const testsContainer = document.getElementById('testsProgressContainer');
            
            materialsContainer.innerHTML = '';
            testsContainer.innerHTML = '';
            
            if (data.progress.length === 0) {
                materialsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-book-open"></i>
                        <h3>Прогресс не найден</h3>
                        <p>Начните изучать материалы и проходить тесты</p>
                    </div>
                `;
                return;
            }
            
            // Прогресс по материалам
            const materialsProgress = data.progress.filter(p => p.material_id);
            if (materialsProgress.length > 0) {
                materialsProgress.forEach(progress => {
                    const progressItem = document.createElement('div');
                    progressItem.className = 'progress-item';
                    progressItem.innerHTML = `
                        <h3>${progress.title}</h3>
                        <div class="progress-meta">
                            <span class="progress-status status-${progress.status}">
                                ${getStatusText(progress.status)}
                            </span>
                            <span>${new Date(progress.completion_date).toLocaleDateString()}</span>
                        </div>
                    `;
                    materialsContainer.appendChild(progressItem);
                });
            } else {
                materialsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-book-open"></i>
                        <h3>Нет пройденных материалов</h3>
                        <p>Начните изучать материалы</p>
                    </div>
                `;
            }
            
            // Прогресс по тестам
            const testsProgress = data.progress.filter(p => p.test_id);
            if (testsProgress.length > 0) {
                testsProgress.forEach(progress => {
                    const progressItem = document.createElement('div');
                    progressItem.className = 'progress-item';
                    progressItem.innerHTML = `
                        <h3>${progress.title}</h3>
                        <div class="progress-meta">
                            <span class="progress-score">${progress.score} баллов</span>
                            <span class="progress-status status-${progress.status}">
                                ${getStatusText(progress.status)}
                            </span>
                        </div>
                        <div class="progress-date">
                            ${new Date(progress.completion_date).toLocaleDateString()}
                        </div>
                    `;
                    testsContainer.appendChild(progressItem);
                });
            } else {
                testsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-question-circle"></i>
                        <h3>Нет пройденных тестов</h3>
                        <p>Начните проходить тесты</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading progress:', error);
            [materialsContainer, testsContainer].forEach(container => {
                if (container) {
                    container.innerHTML = `
                        <div class="error-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Ошибка загрузки прогресса</h3>
                            <p>${error.message || 'Попробуйте позже'}</p>
                        </div>
                    `;
                }
            });
            
            if (error.message.includes('authenticated')) {
                logout();
            }
        });
}

function getStatusText(status) {
    const statusText = {
        'completed': 'Завершено',
        'started': 'Начато',
        'failed': 'Не пройдено'
    };
    return statusText[status] || status;
}