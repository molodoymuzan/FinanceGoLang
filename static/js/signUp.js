const registerForm = document.getElementById("registerForm");

function handleRegistration() {
    // Добавляем обработчик события на отправку формы
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Отменяем стандартное поведение отправки формы

        const formData = new FormData(registerForm); // Получаем данные из формы
        const data = {
            name: formData.get("username"),
            password: formData.get("password")
        };

        try {
            // Отправляем запрос на сервер для регистрации нового пользователя
            const response = await fetch("/api/newuser", {
                method: "POST", // Указываем метод POST
                headers: {
                    "Content-Type": "application/json", // Указываем, что отправляем JSON
                },
                body: JSON.stringify(data), // Преобразуем данные в JSON
            });

            const result = await response.json(); // Получаем ответ от сервера в формате JSON
            if (response.ok) {
                localStorage.setItem("userId", result.id); // Сохраняем ID нового пользователя в localStorage

                window.location.href = "/"; // Перенаправляем на главную страницу
            } else {
                // Обрабатываем ошибки (если имя пользователя уже существует)
                alert(result.message || "Registration failed.");
            }
        } catch (error) {
            console.error("Error during registration:", error)
            alert("An error occurred. Please try again.");
        }
    });
}

// Вызываем функцию handleRegistration, когда страница загружена
document.addEventListener("DOMContentLoaded", handleRegistration);