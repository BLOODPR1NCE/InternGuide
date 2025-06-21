document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // Загрузка тестов для списка
    if (document.getElementById('testsContainer')) {
        loadTests();
    }
    
    // Загрузка теста для прохождения
    if (document.getElementById('testForm')) {
        loadTestForTaking();
    }
    
    // Настройка формы создания/редактирования теста
    if (document.getElementById('createTestForm') || document.getElementById('editTestForm')) {
        setupTestForm();
    }
});

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
    authFetch('/tests')
        .then(response => response.json())
        .then(data => {
            const testsContainer = document.getElementById('testsContainer');
            testsContainer.innerHTML = '';
            
            if (data.tests.length === 0) {
                testsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-question-circle"></i>
                        <h3>Тесты не найдены</h3>
                        <p>Попробуйте изменить параметры поиска</p>
                    </div>
                `;
                return;
            }
            
            data.tests.forEach(test => {
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
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                    </div>
                    
                    <div class="test-actions">
                        <button class="btn btn-primary" onclick="startTest(${test.test_id})">
                            Начать тест
                        </button>
                    </div>
                    
                    <div class="test-author">
                        Автор: ${test.creator}
                    </div>
                `;
                
                testsContainer.appendChild(testCard);
            });
        })
        .catch(error => {
            console.error('Error loading tests:', error);
            if (error === 'No token found') {
                logout();
            }
        });
}

function loadTestForTaking() {
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');
    
    if (!testId) {
        window.location.href = 'index.html';
        return;
    }
    
    authFetch(`/tests/${testId}`)
        .then(response => response.json())
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

function setupTestForm() {
    const form = document.getElementById('createTestForm') || document.getElementById('editTestForm');
    const questionsContainer = document.getElementById('questionsContainer');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    
    let questions = [];
    
    // Для редактирования загружаем существующие вопросы
    if (document.getElementById('editTestForm')) {
        const urlParams = new URLSearchParams(window.location.search);
        const testId = urlParams.get('id');
        
        if (testId) {
            authFetch(`/tests/${testId}`)
                .then(response => response.json())
                .then(data => {
                    document.getElementById('title').value = data.test.title;
                    document.getElementById('description').value = data.test.description || '';
                    
                    questions = data.test.questions.map(q => ({
                        text: q.text,
                        points: q.points,
                        options: {
                            A: q.option_a,
                            B: q.option_b,
                            C: q.option_c || '',
                            D: q.option_d || ''
                        },
                        correct_option: q.correct_option
                    }));
                    
                    renderQuestions();
                });
        }
    }
    
    addQuestionBtn.addEventListener('click', function() {
        questions.push({
            text: '',
            points: 1,
            options: {
                A: '',
                B: '',
                C: '',
                D: ''
            },
            correct_option: 'A'
        });
        
        renderQuestions();
    });
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        
        // Проверяем, что все вопросы заполнены
        const isValid = questions.every((q, i) => {
            const questionEl = document.getElementById(`question-${i}`);
            
            q.text = questionEl.querySelector('.question-text').value;
            q.points = parseInt(questionEl.querySelector('.question-points').value) || 1;
            
            q.options.A = questionEl.querySelector('.option-a').value;
            q.options.B = questionEl.querySelector('.option-b').value;
            q.options.C = questionEl.querySelector('.option-c').value;
            q.options.D = questionEl.querySelector('.option-d').value;
            
            const selectedOption = questionEl.querySelector('input[name^="correct-option"]:checked');
            q.correct_option = selectedOption ? selectedOption.value : 'A';
            
            return q.text && q.options.A && q.options.B;
        });
        
        if (!isValid) {
            alert('Заполните все обязательные поля в вопросах (текст вопроса и хотя бы 2 варианта ответа)');
            return;
        }
        
        const testData = {
            title,
            description,
            questions
        };
        
        const url = form.id === 'createTestForm' ? '/tests' : `/tests/${new URLSearchParams(window.location.search).get('id')}`;
        const method = form.id === 'createTestForm' ? 'POST' : 'PUT';
        
        authFetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        })
        .then(response => {
            if (response.ok) {
                alert('Тест успешно сохранён!');
                window.location.href = 'index.html';
            }
        })
        .catch(error => {
            console.error('Error saving test:', error);
            alert('Ошибка при сохранении теста');
        });
    });
    
    function renderQuestions() {
        questionsContainer.innerHTML = '';
        
        questions.forEach((question, index) => {
            const questionEl = document.createElement('div');
            questionEl.className = 'question-form';
            questionEl.id = `question-${index}`;
            
            questionEl.innerHTML = `
                <div class="question-header">
                    <h4>Вопрос ${index + 1}</h4>
                    <button type="button" class="btn-icon delete-question" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div class="form-group">
                    <label>Текст вопроса</label>
                    <textarea class="question-text" required>${question.text}</textarea>
                </div>
                
                <div class="form-group">
                    <label>Баллы за вопрос</label>
                    <input type="number" class="question-points" min="1" value="${question.points}" required>
                </div>
                
                <div class="options-form">
                    <div class="form-group">
                        <label>Вариант A</label>
                        <input type="text" class="option-a" value="${question.options.A}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Вариант B</label>
                        <input type="text" class="option-b" value="${question.options.B}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Вариант C (опционально)</label>
                        <input type="text" class="option-c" value="${question.options.C || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>Вариант D (опционально)</label>
                        <input type="text" class="option-d" value="${question.options.D || ''}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Правильный вариант</label>
                    <div class="correct-options">
                        ${['A', 'B', 'C', 'D'].map(opt => `
                            <label>
                                <input type="radio" name="correct-option-${index}" 
                                       value="${opt}" ${question.correct_option === opt ? 'checked' : ''}
                                       ${!question.options[opt] ? 'disabled' : ''}>
                                ${opt}
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
            
            questionsContainer.appendChild(questionEl);
            
            // Обработчик удаления вопроса
            questionEl.querySelector('.delete-question').addEventListener('click', function() {
                questions.splice(index, 1);
                renderQuestions();
            });
            
            // Обновление доступных правильных вариантов при изменении текста ответов
            ['a', 'b', 'c', 'd'].forEach(opt => {
                questionEl.querySelector(`.option-${opt}`).addEventListener('input', function() {
                    const radio = questionEl.querySelector(`input[name="correct-option-${index}"][value="${opt.toUpperCase()}"]`);
                    radio.disabled = !this.value;
                    if (!this.value && radio.checked) {
                        questionEl.querySelector('input[name="correct-option-${index}"][value="A"]').checked = true;
                    }
                });
            });
        });
    }
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

// Обработчик для формы теста
document.getElementById('nextQuestionBtn')?.addEventListener('click', nextQuestion);
document.getElementById('prevQuestionBtn')?.addEventListener('click', prevQuestion);
document.getElementById('submitTestBtn')?.addEventListener('click', submitTest);