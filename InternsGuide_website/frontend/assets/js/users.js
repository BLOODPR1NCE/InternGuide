document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUsers();
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Инициализация модального окна
    const modal = document.getElementById('userModal');
    const addBtn = document.getElementById('addUserBtn');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancelUserBtn');
    const userForm = document.getElementById('userForm');
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('modalPassword');

    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
    
    addBtn.addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Добавить пользователя';
        document.getElementById('userId').value = '';
        userForm.reset();
        modal.style.display = 'block';
    });
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Обработка отправки формы
    userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const password = document.getElementById('modalPassword').value;
    const originalPassword = document.getElementById('modalPassword').dataset.original;
    
    // Если пароль не изменен, не отправляем его
    const passwordData = password === '' ? {} : { password };
    
    try {
        const response = await authFetch(`/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: document.getElementById('modalFirstName').value,
                surname: document.getElementById('modalLastName').value,
                login: document.getElementById('modalLogin').value,
                role: document.getElementById('modalRole').value,
                ...passwordData
            })
        });
        
        if (!response.ok) {
            throw new Error(await response.text());
        }
        
        modal.style.display = 'none';
        loadUsers();
        alert('Пользователь успешно сохранён');
    } catch (error) {
        console.error('Ошибка сохранения пользователя:', error);
        alert(`Ошибка: ${error.message}`);
    }
});
    
    document.getElementById('addUserBtn').addEventListener('click', function() {
        document.getElementById('modalPassword').value = '';
    });

    // Поиск пользователей
    document.getElementById('userSearch').addEventListener('input', debounce(loadUsers, 300));
});

async function loadUsers(search = '') {
    try {
        const searchTerm = document.getElementById('userSearch').value;
        const url = `/admin/users${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
        
        const response = await authFetch(url);
        if (!response.ok) {
            throw new Error('Ошибка загрузки пользователей');
        }
        
        const users = await response.json();
        renderUsers(users);
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        alert('Не удалось загрузить список пользователей');
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Пользователи не найдены</td></tr>';
        return;
    }
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.user_id}</td>
            <td>${user.name}</td>
            <td>${user.surname}</td>
            <td>${user.login}</td>
            <td>${getRoleName(user.role)}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${user.user_id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${user.user_id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Добавляем обработчики для кнопок редактирования и удаления
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editUser(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteUser(btn.dataset.id));
    });
}

function getRoleName(role) {
    switch(role) {
        case 'admin': return 'Администратор';
        case 'curator': return 'Куратор';
        case 'trainee': return 'Стажёр';
        default: return role;
    }
}

async function editUser(userId) {
    try {
        const response = await authFetch(`/admin/users/${userId}`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки данных пользователя');
        }
        
        const user = await response.json();
        
        document.getElementById('modalTitle').textContent = 'Редактировать пользователя';
        document.getElementById('userId').value = user.user_id;
        document.getElementById('modalFirstName').value = user.name;
        document.getElementById('modalLastName').value = user.surname;
        document.getElementById('modalLogin').value = user.login;
        document.getElementById('modalPassword').value = '';
        document.getElementById('modalRole').value = user.role;
        
        document.getElementById('modalPassword').dataset.original = user.password;
        document.getElementById('userModal').style.display = 'block';
    } catch (error) {
        console.error('Ошибка редактирования пользователя:', error);
        alert('Не удалось загрузить данные пользователя');
    }
}

async function deleteUser(userId) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        return;
    }
    
    try {
        const response = await authFetch(`/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Ошибка удаления пользователя');
        }
        
        loadUsers();
        alert('Пользователь успешно удалён');
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        alert('Не удалось удалить пользователя');
    }
}

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

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = '/frontend/templates/auth/login.html';
        return false;
    }
    return true;
}