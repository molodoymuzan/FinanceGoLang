package middleware

import (
	"database/sql"       // Интерфейс для работы с SQL базами данных
	"encoding/json"      // Кодирование и декодирование JSON
	"fmt"                // Форматированный ввод-вывод
	"go-postgres/models" // Пакет с определением модели User
	"log"                // Логирование ошибок и информации
	"net/http"           // Работа с HTTP-запросами и ответами
	"os"                 // Чтение переменных окружения
	"strconv"            // Преобразование строк в целые числа

	"github.com/gorilla/mux"   // Маршрутизация и извлечение параметров из URL
	"github.com/joho/godotenv" // Чтение файла .env для переменных окружения
	_ "github.com/lib/pq"      // Драйвер PostgreSQL для Go
)

// Структура для формата ответа API
type response struct {
	ID      int64  `json:"id,omitempty"`
	Message string `json:"message,omitempty"`
}

// Функция для создания подключения к базе данных
func createConnection() *sql.DB {
	// Загружаем переменные окружения из файла .env
	err := godotenv.Load(".env")
	if err != nil {
		log.Printf("Unable to decode the request body.  %v", err)
	}

	// Открываем соединение с базой данных PostgreSQL
	db, err := sql.Open("postgres", os.Getenv("POSTGRES_URL"))
	if err != nil {
		panic(err) // Паникуем, если не удалось открыть соединение
	}

	// Проверяем соединение с базой данных
	err = db.Ping()
	if err != nil {
		panic(err) // Паникуем, если соединение не удалось
	}

	fmt.Println("Successfully connected!")
	return db
}

// Функция для создания нового пользователя
func CreateUser(w http.ResponseWriter, r *http.Request) {
	var user models.User // Объявляем переменную user типа models.User

	// Декодируем JSON-тело запроса в структуру user
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		// Если произошла ошибка, отправляем ответ с ошибкой и логируем её
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("Error querying user: %v", err)
		return
	}

	// Вставляем пользователя в базу данных и получаем его ID
	insertID := insertUser(user)

	// Формируем ответ с ID нового пользователя и сообщением об успешном создании
	res := response{
		ID:      insertID,
		Message: "User created successfully",
	}

	// Кодируем ответ в JSON и отправляем его клиенту
	json.NewEncoder(w).Encode(res)
}

// Функция для получения пользователя по имени и паролю
func GetUser(w http.ResponseWriter, r *http.Request) {
	var id int64         // Хранение ID пользователя
	var user models.User // Хранение данных пользователя

	// Декодируем JSON-тело запроса в структуру user
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		// Если произошла ошибка, отправляем ответ с кодом 400 и логируем ошибку
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		log.Printf("Error decoding JSON: %v", err)
		return
	}

	db := createConnection()
	defer db.Close()

	// SQL-запрос для получения ID пользователя по имени и паролю
	sqlStatement := `SELECT user_id FROM users WHERE name=$1 AND password=$2`
	err = db.QueryRow(sqlStatement, user.Name, user.Password).Scan(&id) // Выполняем запрос и сканируем результат в переменную id

	if err != nil {
		// Если произошла ошибка, отправляем ответ с кодом 500 и логируем ошибку
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("Error querying user: %v", err)
		return // Выходим из функции, если произошла ошибка
	}

	// Кодируем ID пользователя в JSON и отправляем его клиенту
	json.NewEncoder(w).Encode(id)
}

// Функция для получения пользователя по его ID
func GetUserById(w http.ResponseWriter, r *http.Request) {
	var user models.User // Хранение данных пользователя

	// Извлекаем параметры из URL
	vars := mux.Vars(r)
	idStr := vars["id"] // Получаем строковое представление ID пользователя

	// Преобразуем строку в int64
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	db := createConnection()
	defer db.Close()

	sqlStatement := `SELECT name FROM users WHERE user_id=$1`

	// Выполняем запрос и сканируем результат в переменную user.Name
	err = db.QueryRow(sqlStatement, id).Scan(&user.Name)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Устанавливаем заголовок ответа и кодируем данные пользователя в JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user) // Отправляем данные пользователя клиенту
}

// Функция для добавления новой транзакции
func AddTransaction(w http.ResponseWriter, r *http.Request) {
	var transaction models.Transaction // Переменная для хранения данных транзакции

	db := createConnection()
	defer db.Close()

	// Декодируем JSON-тело запроса в структуру transaction
	err := json.NewDecoder(r.Body).Decode(&transaction)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Выполняем SQL-запрос для вставки новой транзакции в базу данных
	_, err = db.Exec("INSERT INTO transactions (user_id, amount, type, category, description, date) VALUES ($1, $2, $3, $4, $5, $6)",
		transaction.UserID, transaction.Amount, transaction.Type, transaction.Category, transaction.Description, transaction.Date)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(transaction) // Отправляем данные транзакции клиенту
}

// Функция для получения транзакций пользователя
func GetTransaction(w http.ResponseWriter, r *http.Request) {
	var user models.User                   // Переменная для хранения данных пользователя
	transactions := []models.Transaction{} // Срез для хранения транзакций

	// Декодируем JSON-тело запроса в структуру user
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		// Если произошла ошибка при декодировании, отправляем ответ с кодом 400
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	db := createConnection() // Создаем подключение к базе данных
	defer db.Close()         // Закрываем соединение после завершения функции

	// SQL-запрос для получения транзакций пользователя по его ID
	query := `SELECT id, amount, type, category, description, date FROM transactions WHERE user_id = $1`
	rows, err := db.Query(query, user.ID) // Выполняем запрос
	if err != nil {
		// Если произошла ошибка при выполнении запроса, отправляем ответ с кодом 500
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close() // Закрываем rows после использования

	// Проходим по результатам запроса
	for rows.Next() {
		var transaction models.Transaction // Переменная для хранения данных транзакции
		// Сканируем данные в структуру transaction
		err := rows.Scan(&transaction.ID, &transaction.Amount, &transaction.Type, &transaction.Category, &transaction.Description, &transaction.Date)
		if err != nil {
			// Если произошла ошибка при сканировании, отправляем ответ с кодом 500
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Добавляем транзакцию в срез
		transactions = append(transactions, transaction)
	}

	// Кодируем срез транзакций в JSON и отправляем его клиенту
	json.NewEncoder(w).Encode(transactions)
}

// Функция для удаления транзакции
func DeleteTransaction(w http.ResponseWriter, r *http.Request) {
	var transaction models.Transaction // Переменная для хранения данных транзакции

	// Декодируем JSON-тело запроса в структуру transaction
	err := json.NewDecoder(r.Body).Decode(&transaction)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	db := createConnection()
	defer db.Close()

	// SQL-запрос для удаления транзакции
	query := `DELETE FROM transactions WHERE id = $1`
	_, err = db.Exec(query, transaction.ID) // Выполняем запрос на удаление
	if err != nil {

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Устанавливаем статус 204 No Content, так как удаление прошло успешно
	w.WriteHeader(http.StatusNoContent)
}

// Функция для вставки нового пользователя в базу данных
func insertUser(user models.User) int64 {
	db := createConnection()
	defer db.Close()

	// SQL-запрос для вставки пользователя
	sqlStatement := `INSERT INTO users (name, password) VALUES ($1, $2) RETURNING user_id`

	var id int64 // Хранение ID вставленного пользователя

	// Выполняем запрос и сканируем возвращаемый ID в переменную id
	err := db.QueryRow(sqlStatement, user.Name, user.Password).Scan(&id)
	if err != nil {
		// Если произошла ошибка, логируем её
		log.Printf("Error querying user: %v", err)
	}

	// Выводим ID вставленного пользователя в консоль
	fmt.Printf("Inserted a single record %v", id)

	return id
}
