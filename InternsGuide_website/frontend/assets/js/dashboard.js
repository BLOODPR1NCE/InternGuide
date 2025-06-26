document.addEventListener('DOMContentLoaded', async function() {
    checkAuth();
    loadUserData();
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userGreeting').textContent = `Добро пожаловать, ${user.name}`;
        document.getElementById('userFullName').textContent = `${user.name} ${user.surname}`;
        document.getElementById('userAvatar').textContent = `${user.name[0]}${user.surname[0]}`;
        document.getElementById('firstName').value = user.name;
        document.getElementById('lastName').value = user.surname;
        document.getElementById('login').value = user.login;
        document.getElementById('password').value = user.password;
        document.getElementById('role').value = user.role === 'trainee' ? 'Стажёр' : 
                                              user.role === 'curator' ? 'Куратор' : 'Администратор';
        
        // Установка класса для роли
        const roleBadge = document.getElementById('userRole');
        roleBadge.textContent = user.role === 'trainee' ? 'Стажёр' : 
                               user.role === 'curator' ? 'Куратор' : 'Администратор';
        roleBadge.parentElement.parentElement.classList.add(`role-${user.role}`);

        try {
            const response = await authFetch('/progress/stats');
            if (response.ok) {
                const stats = await response.json();
                updateProgressStats(stats);
            }
        } catch (error) {
            console.error('Error loading progress stats:', error);
        }
    }

    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const profileForm = document.getElementById('profileForm');
    
    editBtn.addEventListener('click', () => {
        profileForm.classList.add('edit-mode');
    });
    
    cancelBtn.addEventListener('click', () => {
        profileForm.classList.remove('edit-mode');
        // Можно добавить сброс значений формы
    });
    
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Отправка данных на сервер
        try {
            const response = await authFetch('/update-profile', {
                method: 'POST',
                body: JSON.stringify({
                    name: document.getElementById('firstName').value,
                    surname: document.getElementById('lastName').value,
                    password: document.getElementById('password').value,
                    login: document.getElementById('login').value
                })
            });
            
            // Обновление данных в localStorage
            const updatedUser = { ...user, 
                name: document.getElementById('firstName').value,
                surname: document.getElementById('lastName').value
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            profileForm.classList.remove('edit-mode');
            alert('Данные успешно обновлены');
        } catch (error) {
            console.error('Update error:', error);
            alert('Ошибка при обновлении данных');
        }
    });
    
    deleteBtn.addEventListener('click', async () => {
        if (confirm('Вы уверены, что хотите удалить свой аккаунт? Это действие нельзя отменить.')) {
            try {
                await authFetch('/delete-account', {
                    method: 'DELETE'
                });
                
                Auth.logout();
                alert('Ваш аккаунт был успешно удалён');
            } catch (error) {
                console.error('Delete error:', error);
                alert('Ошибка при удалении аккаунта');
            }
        }
    });

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
    const curatorElements = document.querySelectorAll('.curator-only');
    const adminElements = document.querySelectorAll('.admin-only');
    
    if (user.role === 'trainee') {
        curatorElements.forEach(el => el.style.display = 'none');
        adminElements.forEach(el => el.style.display = 'none');
    } 
    else if (user.role === 'curator') {
        curatorElements.forEach(el => el.style.display = 'block');
        adminElements.forEach(el => el.style.display = 'none');
    }
    else if (user.role === 'admin') {
        curatorElements.forEach(el => el.style.display = 'block');
        adminElements.forEach(el => el.style.display = 'block');
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

function updateProgressStats(stats) {
    if (stats.completedMaterials !== undefined) {
        const materialsElement = document.getElementById('completedMaterials');
        materialsElement.textContent = stats.completedMaterials;
        materialsElement.classList.add('updated');
        setTimeout(() => materialsElement.classList.remove('updated'), 1000);
    }
    
    if (stats.completedTests !== undefined) {
        const testsElement = document.getElementById('completedTests');
        testsElement.textContent = stats.completedTests;
        testsElement.classList.add('updated');
        setTimeout(() => testsElement.classList.remove('updated'), 1000);
    }
}

document.querySelector('.admin-only a[href="#"]').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = 'users.html';
});