// Исправленный BASE_PATH
const BASE_PATH = window.location.pathname.startsWith('/frontend') 
    ? '/frontend' 
    : '';

// Убедитесь, что API_URL соответствует вашему бэкенду
const API_URL = 'http://localhost:5000/api'; // или другой порт, если изменили

// Исправленные AUTH_PATHS
const AUTH_PATHS = {
    login: `${BASE_PATH}/templates/auth/login.html`,
    home: `${BASE_PATH}/templates/dashboard.html` // или другой главный путь
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

    async handleRegister(event) {
        event.preventDefault();
    
        const name = document.getElementById('name').value;
        const surname = document.getElementById('surname').value;
        const login = document.getElementById('login').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    name, 
                    surname, 
                    login, 
                    password,
                    role: 'trainee'
                }),
                credentials: 'include',
                mode: 'cors'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ошибка регистрации');
            }

            alert('Регистрация успешна! Теперь вы можете войти.');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Registration error:', error);
            alert(`Ошибка регистрации: ${error.message}`);
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

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => Auth.handleRegister(e));
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }
});

