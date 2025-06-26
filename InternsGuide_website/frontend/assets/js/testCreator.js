document.addEventListener('DOMContentLoaded', function() {
    const questionsContainer = document.getElementById('questionsContainer');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const questionTemplate = document.getElementById('questionTemplate');
    const optionTemplate = document.getElementById('optionTemplate');
    let questionCounter = 0;
    let questionsData = [];

    // Инициализация первого вопроса
    addQuestion();

    // Добавление нового вопроса
    addQuestionBtn.addEventListener('click', addQuestion);

    // Функция добавления нового вопроса
    function addQuestion() {
        questionCounter++;
        const questionId = `question-${questionCounter}`;
        const questionData = {
            id: questionId,
            text: '',
            type: 'single',
            points: 1,
            options: []
        };
        questionsData.push(questionData);

        const questionClone = document.importNode(questionTemplate.content, true);
        const questionElement = questionClone.querySelector('.question-card');
        questionElement.setAttribute('data-question-id', questionId);
        questionElement.querySelector('.question-number').textContent = questionCounter;

        // Добавляем первые два варианта ответа
        addOption(questionElement, questionData, true);
        addOption(questionElement, questionData, false);

        // Обработчики событий для вопроса
        setupQuestionHandlers(questionElement, questionData);

        questionsContainer.appendChild(questionElement);
        
        // Прокрутка к новому вопросу
        questionElement.scrollIntoView({ behavior: 'smooth' });
    }

    // Настройка обработчиков для вопроса
    function setupQuestionHandlers(questionElement, questionData) {
        // Обработчик удаления вопроса
        questionElement.querySelector('.delete-question').addEventListener('click', function() {
            if (confirm('Вы уверены, что хотите удалить этот вопрос?')) {
                questionsData = questionsData.filter(q => q.id !== questionData.id);
                questionElement.remove();
                updateQuestionNumbers();
            }
        });

        // Обработчик изменения текста вопроса
        questionElement.querySelector('.question-text').addEventListener('input', function() {
            questionData.text = this.value;
        });

        // Обработчик изменения типа вопроса
        questionElement.querySelector('.question-type').addEventListener('change', function(e) {
            questionData.type = e.target.value;
            updateQuestionView(questionElement, questionData);
        });

        // Обработчик изменения баллов
        questionElement.querySelector('.question-points').addEventListener('input', function() {
            questionData.points = parseInt(this.value) || 1;
        });

        // Обработчик добавления варианта ответа
        questionElement.querySelector('.add-option').addEventListener('click', function() {
            addOption(questionElement, questionData, false);
        });
    }

    // Функция добавления варианта ответа
    function addOption(questionElement, questionData, isFirst) {
        const optionsList = questionElement.querySelector('.options-list');
        const optionClone = document.importNode(optionTemplate.content, true);
        const optionElement = optionClone.querySelector('.option-item');
        
        const optionData = {
            text: '',
            correct: isFirst,
            deletable: !isFirst
        };
        questionData.options.push(optionData);

        // Настройка элементов управления
        const correctInput = optionElement.querySelector('.option-correct');
        correctInput.checked = optionData.correct;
        correctInput.name = `${questionData.id}-correct`;
        correctInput.type = questionData.type === 'multiple' ? 'checkbox' : 'radio';
        correctInput.addEventListener('change', function() {
            optionData.correct = this.checked;
            
            // Для радио-кнопок снимаем выбор с других вариантов
            if (correctInput.type === 'radio' && this.checked) {
                optionsList.querySelectorAll('.option-correct').forEach(input => {
                    if (input !== correctInput) {
                        input.checked = false;
                        const index = Array.from(optionsList.children).indexOf(input.closest('.option-item'));
                        questionData.options[index].correct = false;
                    }
                });
            }
        });

        const textInput = optionElement.querySelector('.option-text');
        textInput.addEventListener('input', function() {
            optionData.text = this.value;
        });

        const deleteBtn = optionElement.querySelector('.delete-option');
        if (optionData.deletable) {
            deleteBtn.addEventListener('click', function() {
                if (questionData.options.length > 2) {
                    const index = questionData.options.indexOf(optionData);
                    questionData.options.splice(index, 1);
                    optionElement.remove();
                    
                    // Если удалили правильный вариант, выбираем первый оставшийся
                    if (questionData.type === 'single' && !questionData.options.some(opt => opt.correct)) {
                        questionData.options[0].correct = true;
                        optionsList.querySelector('.option-correct').checked = true;
                    }
                } else {
                    alert('Вопрос должен содержать минимум 2 варианта ответа');
                }
            });
        } else {
            deleteBtn.style.display = 'none';
        }

        optionsList.appendChild(optionElement);
        updateQuestionView(questionElement, questionData);
    }

    // Обновление отображения вопроса
    function updateQuestionView(questionElement, questionData) {
        const optionsContainer = questionElement.querySelector('.options-container');
        const correctInputs = questionElement.querySelectorAll('.option-correct');
        
        if (questionData.type === 'text') {
            optionsContainer.style.display = 'none';
        } else {
            optionsContainer.style.display = 'block';
            correctInputs.forEach(input => {
                input.type = questionData.type === 'multiple' ? 'checkbox' : 'radio';
            });
        }
    }

    // Функция обновления номеров вопросов
    function updateQuestionNumbers() {
        const questions = questionsContainer.querySelectorAll('.question-card');
        questions.forEach((question, index) => {
            question.querySelector('.question-number').textContent = index + 1;
        });
    }

// Обработчик отправки формы
document.getElementById('createTestForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    
    // Валидация формы
    if (!title) {
        alert('Введите название теста');
        return;
    }
    
    if (questionsData.length === 0) {
        alert('Добавьте хотя бы один вопрос');
        return;
    }
    
    for (const question of questionsData) {
        if (!question.text) {
            alert('Заполните текст всех вопросов');
            return;
        }
        
        if (question.type !== 'text') {
            const validOptions = question.options.filter(opt => opt.text.trim());
            if (validOptions.length < 2) {
                alert('Добавьте хотя бы два варианта ответа для каждого вопроса');
                return;
            }
            
            if (!question.options.some(opt => opt.correct && opt.text.trim())) {
                alert('Укажите правильный ответ для каждого вопроса');
                return;
            }
        }
    }
    
    // Подготовка данных для отправки в формате, ожидаемом бэкендом
    const testData = {
        title,
        description,
        questions: questionsData.map(question => {
            const options = {
                A: question.options[0]?.text || '',
                B: question.options[1]?.text || '',
                C: question.options[2]?.text || '',
                D: question.options[3]?.text || ''
            };
            
            // Находим индекс правильного ответа
            const correctIndex = question.options.findIndex(opt => opt.correct);
            const correct_option = ['A', 'B', 'C', 'D'][correctIndex] || 'A';
            
            return {
                text: question.text,
                points: question.points,
                options: options,
                correct_option: correct_option
            };
        })
    };
    
    // Отправка данных на сервер
    authFetch('', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.message || 'Ошибка сервера'); });
        }
        return response.json();
    })
    .then(data => {
        alert(`Тест "${title}" успешно создан!`);
        window.location.href = 'index.html';
    })
    .catch(error => {
        console.error('Ошибка при создании теста:', error);
        alert('Произошла ошибка при создании теста: ' + error.message);
    });
});

    // Функция для авторизованных запросов
function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/frontend/templates/auth/login.html';
        return Promise.reject('No token found');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    // Измените базовый URL на ваш Flask-сервер
    const baseUrl = 'http://localhost:5000'; // Или ваш реальный URL сервера
    return fetch(`${baseUrl}/api/tests`, {
        ...options,
        headers,
        mode: 'cors' // Добавьте режим CORS
    });
}
})