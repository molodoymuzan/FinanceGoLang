const loginForm = document.getElementById("loginForm");

function handleLogin() {
    // Добавляем обработчик события на отправку формы
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Отменяем стандартное поведение отправки формы

        const formData = new FormData(loginForm); // Получаем данные из формы
        const data = {
            name: formData.get("username"),
            password: formData.get("password"),
        };

        try {
            // Отправляем запрос на сервер для входа
            const response = await fetch(`/api/user/login`, {
                method: "POST", // Указываем метод POST
                headers: {
                    "Content-Type": "application/json", // Указываем, что отправляем JSON
                },
                body: JSON.stringify(data), // Преобразуем данные в JSON
            });

            const result = await response.json(); // Получаем ответ от сервера в формате JSON
            if (response.ok) { // Проверяем, успешен ли ответ
                localStorage.setItem("userId", result); // Сохраняем ID пользователя в localStorage
                window.location.href = "/"; // Перенаправляем на главную страницу
            } else {
                // Обрабатываем ошибки (неверные учетные данные)
                alert(result.message || "Login failed.");
            }
        } catch (error) {
            console.error("Error during login:", error);
            alert("An error occurred. Please try again.");
        }
    });
}

// Вызываем функцию handleLogin, когда страница загружена
document.addEventListener("DOMContentLoaded", handleLogin);
