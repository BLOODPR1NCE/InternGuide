const BASE_PATH = window.location.pathname.includes('/frontend/') ? '/frontend' : '';
const API_URL = 'http://localhost:5000/api';
const AUTH_PATHS = {
    login: `${BASE_PATH}/templates/auth/login.html`,
    home: `${BASE_PATH}/index.html`
};

// Универсальная функция fetch с обработкой CORS
async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(`${API_URL}${url}`, {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            mode: 'cors'
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `HTTP error ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('Request failed:', error);
        throw error;
    }
}

const Auth = {
    checkAuthState() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            if (!window.location.pathname.includes('/auth/')) {
                window.location.href = AUTH_PATHS.login;
            }
            return false;
        }
        return true;
    },

    async handleLogin(event) {
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
            const data = await makeRequest('/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = AUTH_PATHS.home;
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message || 'Ошибка входа. Проверьте логин и пароль');
        }
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = AUTH_PATHS.login;
    }
};

async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = AUTH_PATHS.login;
        throw new Error('Not authenticated');
    }

    try {
        const response = await fetch(`${API_URL}${url}`, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        // Обработка 401 Unauthorized
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = AUTH_PATHS.login;
            throw new Error('Session expired');
        }

        // Обработка других ошибок
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

window.Auth = Auth;
window.authFetch = authFetch;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    Auth.checkAuthState();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => Auth.handleLogin(e));
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }
});

