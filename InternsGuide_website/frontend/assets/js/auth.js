// Конфигурация
const BASE_PATH = window.location.pathname.includes('/frontend/') 
    ? '/frontend' 
    : '';

const API_URL = 'http://localhost:5000/api';
const AUTH_PATHS = {
    login: `${BASE_PATH}/templates/auth/login.html`,
    home: `${BASE_PATH}/index.html`
};

// Улучшенная функция редиректа
function safeRedirect(path) {
    try {
        const fullPath = path.startsWith('http') ? path 
            : (path.startsWith('/') 
                ? window.location.origin + path 
                : window.location.href.replace(/\/[^/]*$/, '') + '/' + path);
        
        if (window.location.href !== fullPath) {
            window.location.href = fullPath;
        }
    } catch (e) {
        console.error('Redirect error:', e);
        window.location.reload();
    }
}

// Функция для авторизованных запросов
async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        safeRedirect(AUTH_PATHS.login);
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Request failed');
    }

    return response.json();
}

// Основной объект аутентификации
const Auth = {
    // Проверка состояния авторизации
    checkAuthState: function() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            if (!window.location.pathname.includes('/auth/')) {
                safeRedirect(AUTH_PATHS.login);
            }
            return false;
        }
        return true;
    },

    // Обработчик входа
    handleLogin: async function(event) {
        event.preventDefault();
        
        const form = event.target;
        const credentials = {
            login: form.login.value.trim(),
            password: form.password.value.trim()
        };
        
        if (!credentials.login || !credentials.password) {
            alert('Заполните все поля');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();
            
            if (!response.ok) throw new Error(data.message || 'Ошибка входа');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            safeRedirect(AUTH_PATHS.home);
        } catch (error) {
            console.error('Ошибка входа:', error);
            alert(error.message || 'Ошибка входа');
        }
    },

    // Обработчик выхода
    logout: function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        safeRedirect(AUTH_PATHS.login);
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    Auth.checkAuthState();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', Auth.handleLogin);
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', Auth.logout);
});