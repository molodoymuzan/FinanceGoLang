## PostgreSQL Table

```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    Password TEXT NOT NULL
);
```

```sql
CREATE TABLE transactions (
      id SERIAL PRIMARY KEY,          -- Уникальный идентификатор транзакции
      user_id INT NOT NULL,          -- Идентификатор пользователя
      amount DECIMAL(10, 2) NOT NULL, -- Сумма транзакции
      type VARCHAR(10) NOT NULL,     -- Тип транзакции (income или expense)
      category VARCHAR(50),          -- Категория транзакции
      description TEXT,              -- Описание транзакции
      date DATE NOT NULL,           -- Месяц транзакции
      FOREIGN KEY (user_id) REFERENCES users(user_id) -- Внешний ключ на таблицу пользователей
);
```