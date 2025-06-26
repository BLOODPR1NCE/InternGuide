const user = JSON.parse(localStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadTests();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(loadTests, 300));
    }

    // Загрузка тестов для списка
    if (document.getElementById('testsContainer')) {
        loadTests();
    }
    
    // Загрузка теста для прохождения
    if (document.getElementById('testForm')) {
        loadTestForTaking();
    }

    if (document.getElementById('editTestForm')) {
        setupTestForm();
    }

});

let allTests = [];
let currentTest = null;
let currentQuestionIndex = 0;
let userAnswers = {};

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = '/frontend/templates/auth/login.html';
        return false;
    }
    return true;
}

function loadTests() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    authFetch('/tests')
        .then(response => response.json())
        .then(data => {
            allTests = data.tests || [];
            
            // Фильтрация тестов
            const filteredTests = allTests.filter(test => {
                return test.title.toLowerCase().includes(searchTerm) || 
                       (test.description && test.description.toLowerCase().includes(searchTerm));
            });
            
            renderTests(filteredTests);
        })
        .catch(error => {
            console.error('Error loading tests:', error);
            renderError(error);
        });
}

function renderTests(tests) {
    console.log('Текущий пользователь:', JSON.parse(localStorage.getItem('user')));
    console.log('Тесты:',  tests);
    const testsContainer = document.getElementById('testsContainer');
    if (!testsContainer) return;
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    if (tests.length === 0) {
        testsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-question-circle"></i>
                <h3>Тесты не найдены</h3>
                <p>Попробуйте изменить параметры поиска</p>
            </div>
        `;
        return;
    }
    
    testsContainer.innerHTML = '';
    
    tests.forEach(test => {
        const isCreator = user && test && (user.user_id == test.creator_id);
        const isAdmin = user.role === 'admin';
        const isCurator = user.role === 'curator';
        const showActions = (isCreator && isCurator) || isAdmin;

        console.log(`Test ${test.test_id}: isCreator=${isCreator}, isCurator=${isCurator}, showActions=${showActions}`);
        
        const testCard = document.createElement('div');
        testCard.className = 'test-card';
        testCard.innerHTML = `
            <h3>${test.title}</h3>
            <p>${test.description || 'Описание отсутствует'}</p>
            
            <div class="progress-container">
                <div class="progress-label">
                    <span>Вопросов:</span>
                    <span>${test.question_count}</span>
                </div>
            </div>
            
            <div class="test-actions">
                <button class="btn btn-primary" onclick="startTest(${test.test_id})">
                    Начать тест
                </button>
                <div class="test-actions">
                ${showActions ? `
                <button class="btn btn-outline-warning" onclick="event.stopPropagation(); editTest(${test.test_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="event.stopPropagation(); deleteTest(${test.test_id})">
                    <i class="fas fa-trash"></i> 
                </button>
                ` : ''}
                </div>
            </div>
            
            <div class="test-author">
                Автор: ${test.creator || 'Неизвестен'}
            </div>
        `;
        
        testsContainer.appendChild(testCard);
    });
}

// Функция debounce (такая же как в materials.js)
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

function editTest(testId) {
    console.log('Attempting to edit test:', testId);
    // Открываем в новой вкладке для отладки
    window.open(`edit.html?id=${testId}`, '_blank');
    // Или для обычного использования:
    // window.location.href = `edit.html?id=${testId}`;
}
function deleteTest(testId) {
    if (confirm('Вы уверены, что хотите удалить этот тест?')) {
        authFetch(`/tests/${testId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                alert('Тест успешно удалён');
                loadTests();
            }
        })
        .catch(error => {
            console.error('Error deleting test:', error);
            alert('Ошибка при удалении теста');
        });
    }
}

function loadTestForTaking() {
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');
    
    if (!testId) {
        window.location.href = 'index.html';
        return;
    }
    
    authFetch(`/tests/${testId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            currentTest = data.test;
            userAnswers = {};
            
            document.getElementById('testTitle').textContent = currentTest.title;
            document.getElementById('testDescription').textContent = currentTest.description || '';
            document.getElementById('totalQuestions').textContent = currentTest.questions.length;
            
            showQuestion(0);
        })
        .catch(error => {
            console.error('Error loading test:', error);
            if (error === 'No token found') {
                logout();
            } else {
                window.location.href = 'index.html';
            }
        });
}

function showQuestion(index) {
    if (!currentTest || index < 0 || index >= currentTest.questions.length) {
        return;
    }
    
    currentQuestionIndex = index;
    const question = currentTest.questions[index];
    
    document.getElementById('currentQuestion').textContent = index + 1;
    document.getElementById('progressFill').style.width = `${(index / currentTest.questions.length) * 100}%`;
    
    const questionContainer = document.getElementById('questionContainer');
    questionContainer.innerHTML = `
        <div class="question">
            <h3>${question.text}</h3>
            <div class="question-points">${question.points} баллов</div>
            
            <div class="options">
                ${Object.entries(question.options).map(([key, value]) => `
                    <div class="option">
                        <input type="radio" 
                               id="option-${key}" 
                               name="answer" 
                               value="${key}"
                               ${userAnswers[question.question_id] === key ? 'checked' : ''}>
                        <label for="option-${key}">
                            <span class="option-letter">${key}</span>
                            <span class="option-text">${value}</span>
                        </label>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Настройка кнопок навигации
    document.getElementById('prevQuestionBtn').disabled = index === 0;
    document.getElementById('nextQuestionBtn').style.display = index === currentTest.questions.length - 1 ? 'none' : 'inline-block';
    document.getElementById('submitTestBtn').style.display = index === currentTest.questions.length - 1 ? 'inline-block' : 'none';
    
    // Сохранение ответа при изменении
    const radioInputs = document.querySelectorAll('input[name="answer"]');
    radioInputs.forEach(input => {
        input.addEventListener('change', function() {
            userAnswers[question.question_id] = this.value;
        });
    });
}


function startTest(testId) {
    window.location.href = `take.html?id=${testId}`;
}

function nextQuestion() {
    saveCurrentAnswer();
    
    if (currentQuestionIndex < currentTest.questions.length - 1) {
        showQuestion(currentQuestionIndex + 1);
    }
}

function prevQuestion() {
    saveCurrentAnswer();
    showQuestion(currentQuestionIndex - 1);
}

function saveCurrentAnswer() {
    const selectedOption = document.querySelector('input[name="answer"]:checked');
    if (selectedOption) {
        const questionId = currentTest.questions[currentQuestionIndex].question_id;
        userAnswers[questionId] = selectedOption.value;
    }
}

function submitTest(event) {
    event.preventDefault();
    saveCurrentAnswer();
    
    // Подсчёт баллов
    let score = 0;
    currentTest.questions.forEach(question => {
        if (userAnswers[question.question_id] === question.correct_option) {
            score += question.points;
        }
    });
    
    // Отправка результатов
    authFetch(`/progress/test/${currentTest.test_id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score })
    })
    .then(response => {
        if (response.ok) {
            alert(`Тест завершён! Ваш результат: ${score} из ${currentTest.max_score} баллов`);
            window.location.href = '../progress/index.html';
        }
    })
    .catch(error => {
        console.error('Error submitting test:', error);
        alert('Ошибка при отправке результатов теста');
    });
}

// Назначение обработчиков для кнопок
window.startTest = startTest;
window.nextQuestion = nextQuestion;
window.prevQuestion = prevQuestion;
window.editTest = editTest;
window.deleteTest = deleteTest;

// Обработчик для формы теста
document.getElementById('nextQuestionBtn')?.addEventListener('click', nextQuestion);
document.getElementById('prevQuestionBtn')?.addEventListener('click', prevQuestion);
document.getElementById('submitTestBtn')?.addEventListener('click', submitTest);