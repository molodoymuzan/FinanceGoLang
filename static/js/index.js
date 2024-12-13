const tableBody = document.getElementById('transaction-list'); // Получаем элемент таблицы для отображения транзакций
const transactionForm = document.getElementById("transaction-form"); // Получаем элемент формы для добавления транзакций
const canvas = document.getElementById('circle'); // Получаем элемент канваса для рисования круговой диаграммы

function checkLoginStatus() {
    const userId = localStorage.getItem('userId'); // Получаем ID пользователя из localStorage

    if (!userId) { // Проверяем, установлен ли ID пользователя
        window.location.href = 'login.html'; // Если нет, перенаправляем на страницу входа
        return; // Выходим из функции
    }
}
function logout() {
    localStorage.removeItem('userId'); // Удаляем ID пользователя из localStorage
    window.location.href = 'login.html'; // Перенаправляем на страницу входа
}

function getUserName() {
    const userId = localStorage.getItem('userId'); // Получаем ID пользователя из localStorage

    if (!userId) { // Проверяем, установлен ли ID пользователя
        console.error("User ID not found in local storage."); // Если нет, выводим сообщение об ошибке
        return; // Выходим из функции
    }

    // Отправляем запрос на сервер для получения данных пользователя
    fetch(`/api/user/${userId}`, {
        method: 'PUT', // Используем метод PUT, как указано в вашем маршрутизаторе
        headers: {
            'Content-Type': 'application/json', // Указываем, что отправляем JSON
        },
    })
        .then(response => {
            if (!response.ok) { // Проверяем, успешен ли ответ
                throw new Error('Network response was not ok'); // Если нет, выбрасываем ошибку
            }
            return response.json(); // Если всё в порядке, преобразуем ответ в JSON
        })
        .then(userData => {
            // Предполагаем, что данные пользователя содержат поле 'name'
            document.getElementById('user-name').textContent = userData.name || 'User'; // Устанавливаем имя пользователя в элемент с ID 'user-name'
        })
        .catch(error => {
            console.error('Error fetching user data:', error); // Логируем ошибку, если что-то пошло не так
        });
}

function getAllTransactions() {
    const id = +localStorage.getItem("userId"); // Получаем ID пользователя из localStorage и преобразуем его в число

    // Отправляем запрос на сервер для получения всех транзакций пользователя
    fetch('/api/transaction/get', {
        method: 'POST', // Указываем метод POST
        headers: {
            'Content-Type': 'application/json' // Указываем, что отправляем JSON
        },
        body: JSON.stringify({ id: id }) // Отправляем ID пользователя в теле запроса
    })
        .then(response => {
            if (!response.ok) { // Проверяем, успешен ли ответ
                throw new Error('Network response was not ok'); // Если нет, выбрасываем ошибку
            }
            return response.json(); // Если всё в порядке, преобразуем ответ в JSON
        })
        .then(transactions => {
            displayAllTransactions(transactions); // Вызываем функцию для отображения всех транзакций
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error); // Логируем ошибку, если что-то пошло не так
        });
}

function addTransaction(event) {
    event.preventDefault(); // Отменяем стандартное поведение отправки формы

    const id = +localStorage.getItem("userId"); // Получаем ID пользователя из localStorage и преобразуем его в число

    const formData = new FormData(transactionForm); // Получаем данные из формы
    const transactionData = {
        user_id: id, // Указываем ID пользователя
        amount: parseFloat(formData.get("amount")), // Получаем и преобразуем сумму в число
        type: formData.get("type"), // Получаем тип транзакции (доход или расход)
        category: formData.get("category"), // Получаем категорию транзакции
        description: formData.get("description"), // Получаем описание транзакции
        date: formData.get("date") // Получаем дату транзакции
    };

    // Отправляем данные транзакции на сервер
    fetch('/api/transaction/add', {
        method: 'POST', // Указываем метод POST
        headers: {
            'Content-Type': 'application/json' // Указываем, что отправляем JSON
        },
        body: JSON.stringify(transactionData) // Преобразуем данные транзакции в JSON
    })
        .then(response => {
            if (!response.ok) { // Проверяем, успешен ли ответ
                throw new Error('Network response was not ok ' + response.statusText); // Если нет, выбрасываем ошибку
            }
            return response.json(); // Если всё в порядке, преобразуем ответ в JSON
        })
        .then(() => {
            getAllTransactions(); // Обновляем список транзакций
        })
        .catch(error => {
            console.error('Error adding transaction:', error); // Логируем ошибку, если что-то пошло не так
            alert('Failed to add transaction: ' + error.message); // Показываем сообщение об ошибке пользователю
        });
}

function displayAllTransactions(transactions) {
    let totalIncome = 0; // Переменная для хранения общей суммы доходов
    let totalExpenses = 0; // Переменная для хранения общей суммы расходов

    tableBody.innerHTML = ""; // Очищаем содержимое таблицы перед добавлением новых данных

    // Проходим по каждому элементу в массиве транзакций
    transactions.forEach(item => {
        const row = document.createElement('tr'); // Создаем новую строку таблицы

        row.id = item.id; // Устанавливаем ID строки равным ID транзакции
        row.innerHTML = `
        <td>${item.amount}</td> // Добавляем ячейку с суммой
        <td>${item.type}</td> // Добавляем ячейку с типом (доходы или расходы)
        <td>${item.category}</td> // Добавляем ячейку с категорией
        <td>${item.description}</td> // Добавляем ячейку с описанием
        <td>${formatDate(item.date)}</td> // Добавляем ячейку с отформатированной датой
        <td><button class="btn" onclick="removeTransaction(this)">Удалить</button></td> // Добавляем кнопку для удаления транзакции
        `;
        tableBody.appendChild(row); // Добавляем строку в тело таблицы

        // Суммируем доходы и расходы
        if (item.type === "Доходы")
            totalIncome += +item.amount; // Если тип "Доходы", добавляем к общей сумме доходов
        else
            totalExpenses += +item.amount; // В противном случае добавляем к общей сумме расходов
    });

    displayCircle(totalIncome, totalExpenses); // Вызываем функцию для отображения круговой диаграммы с доходами и расходами
}

function removeTransaction(button) {
    const userId = +localStorage.getItem("userId"); // Получаем ID пользователя из localStorage и преобразуем его в число
    const transactionId = +button.parentElement.parentElement.id; // Получаем ID транзакции из элемента кнопки

    // Отправляем запрос на удаление транзакции
    fetch('/api/transaction/delete', {
        method: 'POST', // Указываем метод POST
        headers: {
            'Content-Type': 'application/json' // Указываем, что отправляем JSON
        },
        body: JSON.stringify({ // Формируем тело запроса с ID транзакции и ID пользователя
            id: transactionId,
            user_id: userId
        })
    })
        .then(response => {
            if (!response.ok) { // Проверяем, успешен ли ответ
                throw new Error('Network response was not ok'); // Если нет, выбрасываем ошибку
            } else {
                getAllTransactions(); // Если всё в порядке, обновляем список транзакций
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error); // Логируем ошибку, если что-то пошло не так
        });
}

// Утилиты
function displayCircle(income, expenses) {
    const total = income + expenses; // Считаем общую сумму доходов и расходов

    if (total === 0) { // Проверяем, не равна ли общая сумма нулю
        console.log("Total income and expenses cannot be zero."); // Если да, выводим сообщение об ошибке
        return; // Выходим из функции
    }

    const incomeRatio = income / total; // Вычисляем долю доходов от общей суммы
    const expensesRatio = expenses / total; // Вычисляем долю расходов от общей суммы
    const ctx = canvas.getContext('2d'); // Получаем контекст рисования на канвасе

    // Рисуем сектор для доходов
    ctx.beginPath();
    ctx.moveTo(100, 100); // Начинаем с центра круга
    ctx.arc(100, 100, 100, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * incomeRatio)); // Рисуем дугу для доходов
    ctx.lineTo(100, 100); // Соединяем с центром
    ctx.fillStyle = '#4caf50'; // Устанавливаем цвет для доходов
    ctx.fill(); // Заполняем сектор
    ctx.closePath(); // Закрываем путь

    // Рисуем сектор для расходов
    ctx.beginPath();
    ctx.moveTo(100, 100); // Начинаем с центра круга
    ctx.arc(100, 100, 100, -Math.PI / 2 + (Math.PI * 2 * incomeRatio), -Math.PI / 2 + (Math.PI * 2 * (incomeRatio + expensesRatio))); // Рисуем дугу для расходов
    ctx.lineTo(100, 100); // Соединяем с центром
    ctx.fillStyle = '#ff2424'; // Устанавливаем цвет для расходов
    ctx.fill(); // Заполняем сектор
    ctx.closePath(); // Закрываем путь
}

function formatDate(dateString) {
    const date = new Date(dateString); // Создаем объект Date из строки даты
    const day = String(date.getDate()).padStart(2, '0'); // Получаем день и добавляем ноль спереди, если нужно
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Получаем месяц (начинается с 0) и добавляем ноль спереди
    const year = date.getFullYear(); // Получаем полный год

    return `${day}-${month}-${year}`; // Возвращаем отформатированную дату в формате DD-MM-YYYY
}

// Когда страница загружается, выполняем следующие действия:
document.addEventListener("DOMContentLoaded", checkLoginStatus); // Проверяем, вошел ли пользователь в систему.
document.addEventListener("DOMContentLoaded", getUserName); // Получаем имя пользователя.
document.addEventListener("DOMContentLoaded", () => transactionForm.addEventListener("submit", addTransaction)); // Добавляем обработчик для формы транзакций, чтобы добавить новую транзакцию при отправке.
document.addEventListener("DOMContentLoaded", getAllTransactions); // Получаем все транзакции.
document.querySelector("#logout").addEventListener("click", logout); // Добавляем обработчик для кнопки "выход", чтобы выйти из системы при нажатии.

