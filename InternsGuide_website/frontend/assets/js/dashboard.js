document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserData();
    
    document.getElementById('logout')?.addEventListener('click', logout);
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

function loadUserData() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    
    // Обновляем приветствие
    const greeting = document.getElementById('userGreeting');
    if (greeting) {
        greeting.textContent = `Добро пожаловать, ${user.name} ${user.surname}`;
    }
    
    // Показываем/скрываем элементы в зависимости от роли
    if (user.role === 'trainee') {
        document.querySelectorAll('.admin-only, .curator-only').forEach(el => {
            el.style.display = 'none';
        });
    } else if (user.role === 'curator') {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
    }
}

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = 'templates/auth/login.html';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'templates/auth/login.html';
}