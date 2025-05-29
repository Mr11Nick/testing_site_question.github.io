document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const startScreen = document.getElementById('startScreen');
    const testScreen = document.getElementById('testScreen');
    const resultScreen = document.getElementById('resultScreen');
    const userNameInput = document.getElementById('userName');
    const startTestButton = document.getElementById('startTest');
    const nextQuestionButton = document.getElementById('nextQuestion');
    const prevQuestionButton = document.getElementById('prevQuestion');
    const returnHomeButton = document.getElementById('returnHome');
    const questionText = document.getElementById('questionText');
    const answersContainer = document.getElementById('answersContainer');
    const questionNumber = document.getElementById('questionNumber');
    const progressBar = document.getElementById('progress');
    const userAnswersSidebar = document.getElementById('userAnswers');
    const participantsList = document.getElementById('participantsList');
    const tgButton = document.getElementById('tgButton');
    const resultText = document.getElementById('resultText');
    const wrongAnswers = document.getElementById('wrongAnswers');

    // Переменные теста
    let currentQuestion = 0;
    let userAnswers = [];
    let userName = '';
    let testData = [];
    let participants = [];

    // Вопросы для теста (30 вопросов)
    testData = [
        {
            question: "Что такое HTML?",
            answers: [
                "Язык гипертекстовой разметки",
                "Язык программирования",
                "Графический редактор",
                "Система управления базами данных"
            ],
            correct: 0
        },
        {
            question: "Какой тег используется для создания ссылки?",
            answers: [
                "<link>",
                "<a>",
                "<href>",
                "<url>"
            ],
            correct: 1
        },
        // Добавьте остальные 28 вопросов по аналогии
        // ...
        {
            question: "Какой из этих языков не является языком программирования?",
            answers: [
                "Python",
                "HTML",
                "Java",
                "C++"
            ],
            correct: 1
        }
    ];

    // Инициализация теста
    function initTest() {
        // Загружаем список участников
        loadParticipants();
        
        // Устанавливаем обработчики событий
        startTestButton.addEventListener('click', startTest);
        nextQuestionButton.addEventListener('click', nextQuestion);
        prevQuestionButton.addEventListener('click', prevQuestion);
        returnHomeButton.addEventListener('click', returnHome);
        tgButton.addEventListener('click', () => {
            window.open('https://t.me/your_bot', '_blank');
        });
        
        // Если вопросов меньше 30, добавляем недостающие
        while (testData.length < 30) {
            testData.push({
                question: `Вопрос ${testData.length + 1} (заглушка)`,
                answers: ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
                correct: Math.floor(Math.random() * 4)
            });
        }
        
        // Инициализируем массив ответов пользователя
        userAnswers = new Array(testData.length).fill(null);
    }

    // Загрузка списка участников
    async function loadParticipants() {
        try {
            const response = await fetch('https://api.github.com/repos/Mr11Nick/testing_site_question.github.io/contents/participants.json');
            if (response.ok) {
                const data = await response.json();
                const content = atob(data.content);
                participants = JSON.parse(content);
                updateParticipantsList();
            } else {
                // Если файла нет, создаем пустой массив
                participants = [];
            }
        } catch (error) {
            console.error('Ошибка загрузки участников:', error);
            participants = [];
        }
    }

    // Обновление списка участников на экране
    function updateParticipantsList() {
        const listContainer = document.getElementById('participantsList');
        listContainer.innerHTML = '';
        
        // Сортируем участников по результатам (от лучших к худшим)
        const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);
        
        sortedParticipants.forEach(participant => {
            const participantElement = document.createElement('div');
            participantElement.className = 'participant';
            participantElement.innerHTML = `
                <span>${participant.name}</span>
                <span>${participant.score}%</span>
            `;
            listContainer.appendChild(participantElement);
        });
    }

    // Сохранение результатов участника
    async function saveParticipantResult(name, score) {
        // Добавляем нового участника
        participants.push({
            name: name,
            score: score,
            date: new Date().toISOString()
        });
        
        // Обновляем список на экране
        updateParticipantsList();
        
        // Сохраняем в GitHub
        try {
            const response = await fetch('https://api.github.com/repos/Mr11Nick/testing_site_question.github.io/contents/participants.json', {
                method: 'PUT',
                headers: {
                    'Authorization': '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',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Update participants list',
                    content: btoa(JSON.stringify(participants, null, 2)),
                    sha: await getFileSha()
                })
            });
            
            if (!response.ok) {
                console.error('Ошибка сохранения результатов');
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    }

    // Получение SHA файла для обновления
    async function getFileSha() {
        try {
            const response = await fetch('https://api.github.com/repos/Mr11Nick/testing_site_question.github.io/contents/participants.json');
            if (response.ok) {
                const data = await response.json();
                return data.sha;
            }
            return null;
        } catch (error) {
            console.error('Ошибка получения SHA:', error);
            return null;
        }
    }

    // Начало теста
    function startTest() {
        userName = userNameInput.value.trim();
        if (!userName) {
            alert('Пожалуйста, введите ваше ФИО');
            return;
        }
        
        currentQuestion = 0;
        userAnswers = new Array(testData.length).fill(null);
        
        startScreen.classList.add('hidden');
        testScreen.classList.remove('hidden');
        resultScreen.classList.add('hidden');
        
        showQuestion();
    }

    // Показать текущий вопрос
    function showQuestion() {
        const question = testData[currentQuestion];
        
        // Обновляем номер вопроса и прогресс бар
        questionNumber.textContent = `Вопрос ${currentQuestion + 1}/${testData.length}`;
        progressBar.style.width = `${(currentQuestion + 1) / testData.length * 100}%`;
        
        // Показать текст вопроса
        questionText.textContent = question.question;
        
        // Очищаем контейнер с ответами
        answersContainer.innerHTML = '';
        
        // Добавляем варианты ответов
        question.answers.forEach((answer, index) => {
            const answerElement = document.createElement('div');
            answerElement.className = `answer-option ${userAnswers[currentQuestion] === index ? 'selected' : ''}`;
            answerElement.textContent = answer;
            answerElement.addEventListener('click', () => selectAnswer(index));
            answersContainer.appendChild(answerElement);
        });
        
        // Обновляем состояние кнопок навигации
        prevQuestionButton.disabled = currentQuestion === 0;
        nextQuestionButton.textContent = currentQuestion === testData.length - 1 ? 'Завершить тест' : 'Дальше';
        
        // Обновляем сайдбар с ответами пользователя
        updateAnswersSidebar();
    }

    // Выбор ответа
    function selectAnswer(answerIndex) {
        userAnswers[currentQuestion] = answerIndex;
        
        // Обновляем стили выбранного ответа
        const answerOptions = document.querySelectorAll('.answer-option');
        answerOptions.forEach((option, index) => {
            if (index === answerIndex) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
        
        // Обновляем сайдбар
        updateAnswersSidebar();
    }

    // Обновление сайдбара с ответами
    function updateAnswersSidebar() {
        userAnswersSidebar.innerHTML = '';
        
        userAnswers.forEach((answer, index) => {
            if (answer !== null) {
                const answerElement = document.createElement('div');
                answerElement.className = `user-answer ${answer === testData[index].correct ? 'correct' : 'incorrect'}`;
                answerElement.textContent = `Вопрос ${index + 1}: ${testData[index].answers[answer]}`;
                userAnswersSidebar.appendChild(answerElement);
            }
        });
    }

    // Следующий вопрос
    function nextQuestion() {
        if (currentQuestion < testData.length - 1) {
            currentQuestion++;
            showQuestion();
        } else {
            finishTest();
        }
    }

    // Предыдущий вопрос
    function prevQuestion() {
        if (currentQuestion > 0) {
            currentQuestion--;
            showQuestion();
        }
    }

    // Завершение теста
    function finishTest() {
        // Считаем количество правильных ответов
        let correctCount = 0;
        const wrongAnswersList = [];
        
        userAnswers.forEach((answer, index) => {
            if (answer === testData[index].correct) {
                correctCount++;
            } else {
                wrongAnswersList.push({
                    question: testData[index].question,
                    correctAnswer: testData[index].answers[testData[index].correct],
                    userAnswer: answer !== null ? testData[index].answers[answer] : 'Нет ответа'
                });
            }
        });
        
        // Рассчитываем процент правильных ответов
        const percentage = Math.round((correctCount / testData.length) * 100);
        
        // Сохраняем результат участника
        saveParticipantResult(userName, percentage);
        
        // Показать экран результатов
        testScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        resultScreen.classList.add('animate__fadeIn');
        
        // Заполняем информацию о результатах
        resultText.innerHTML = `
            <p>${userName}, ваш результат:</p>
            <h3>${percentage}%</h3>
            <p>Правильных ответов: ${correctCount} из ${testData.length}</p>
        `;
        
        // Показать неправильные ответы
        if (wrongAnswersList.length > 0) {
            let wrongAnswersHtml = '<h4>Неправильные ответы:</h4><ul>';
            wrongAnswersList.forEach(item => {
                wrongAnswersHtml += `
                    <li>
                        <p><strong>Вопрос:</strong> ${item.question}</p>
                        <p><strong>Ваш ответ:</strong> ${item.userAnswer}</p>
                        <p><strong>Правильный ответ:</strong> ${item.correctAnswer}</p>
                    </li>
                `;
            });
            wrongAnswersHtml += '</ul>';
            wrongAnswers.innerHTML = wrongAnswersHtml;
        } else {
            wrongAnswers.innerHTML = '<p>Все ответы правильные! Отличный результат!</p>';
        }
    }

    // Возврат на главный экран
    function returnHome() {
        startScreen.classList.remove('hidden');
        testScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        
        // Сбрасываем тест
        currentQuestion = 0;
        userAnswers = new Array(testData.length).fill(null);
        userNameInput.value = '';
    }

    // Запуск приложения
    initTest();
});