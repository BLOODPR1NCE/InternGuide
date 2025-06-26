document.addEventListener('DOMContentLoaded', function() {
    // Проверка авторизации
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/frontend/templates/auth/login.html';
        return;
    }

    const testId = new URLSearchParams(window.location.search).get('id');
    console.log('Opening editor for test ID:', testId); // Логирование
    
    if (!testId) {
        console.error('No test ID provided');
        window.location.href = 'index.html';
        return;
    }

    // Загружаем существующий тест с обработкой ошибок
    authFetch(`/tests/${testId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Test data loaded:', data); // Логирование данных
            if (!data.test) {
                throw new Error('Test data is empty');
            }
            
            const test = data.test;
            document.getElementById('title').value = test.title;
            document.getElementById('description').value = test.description || '';
            
            // Заполняем вопросы
            test.questions.forEach((question, index) => {
                addQuestion();
                
                const questionElement = document.querySelector(`.question-card:nth-child(${index + 1})`);
                questionElement.querySelector('.question-text').value = question.text;
                questionElement.querySelector('.question-points').value = question.points;
                
                // Заполняем варианты ответов
                Object.entries(question.options).forEach(([key, value], i) => {
                    if (i > 0) {
                        const addBtn = questionElement.querySelector('.add-option');
                        if (addBtn) addBtn.click();
                    }
                    
                    const optionInputs = questionElement.querySelectorAll('.option-text');
                    if (optionInputs[i]) {
                        optionInputs[i].value = value;
                    }
                    
                    // Отмечаем правильный ответ
                    if (key === question.correct_option) {
                        const correctInputs = questionElement.querySelectorAll('.option-correct');
                        if (correctInputs[i]) {
                            correctInputs[i].checked = true;
                        }
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error loading test:', error);
            alert(`Ошибка загрузки теста: ${error.message}`);
            // Не перенаправляем сразу, позволяя пользователю увидеть ошибку
        });

    // Остальной код аналогичен testCreator.js
    const questionsContainer = document.getElementById('questionsContainer');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const questionTemplate = document.getElementById('questionTemplate');
    const optionTemplate = document.getElementById('optionTemplate');
    let questionCounter = 0;
    let questionsData = [];


    // Добавление нового вопроса
    addQuestionBtn.addEventListener('click', addQuestion);

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
        questionElement.scrollIntoView({ behavior: 'smooth' });
    }

    // Остальные функции (setupQuestionHandlers, addOption и т.д.) копируются из testCreator.js

    // Измененная функция отправки формы
    document.getElementById('createTestForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        
        // Валидация формы (как в testCreator.js)
        
        // Подготовка данных для отправки
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
        
        // Отправка на сервер с методом PUT для обновления
        authFetch(`/tests/${testId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Ошибка сервера');
            return response.json();
        })
        .then(data => {
            alert(`Тест "${title}" успешно обновлен!`);
            window.location.href = 'index.html';
        })
        .catch(error => {
            console.error('Ошибка при обновлении теста:', error);
            alert('Произошла ошибка при обновлении теста: ' + error.message);
        });
    });

    // Добавьте эти функции в testEditor.js перед их использованием

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

function updateQuestionNumbers() {
    const questions = questionsContainer.querySelectorAll('.question-card');
    questions.forEach((question, index) => {
        question.querySelector('.question-number').textContent = index + 1;
    });
}

});