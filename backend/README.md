# Workout Program API

FastAPI приложение для управления тренировочными программами.

## Структура проекта

```
miniApp_olya/
├── main.py              # Основной файл приложения с эндпоинтами
├── database.py          # Конфигурация подключения к БД
├── models.py            # SQLAlchemy модели
├── schemas.py           # Pydantic схемы для валидации
├── crud.py              # CRUD операции для работы с БД
├── init_db.py           # Скрипт инициализации БД с тестовыми данными
├── test_api.py          # Тесты API
├── requirements.txt     # Зависимости проекта
├── .gitignore          # Исключения для Git
└── workout_app.db      # База данных SQLite (создается автоматически)
```

## Установка

1. Создайте виртуальное окружение:
```bash
python -m venv venv
```

2. Активируйте виртуальное окружение:
- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

3. Установите зависимости:
```bash
pip install -r requirements.txt
```

## Запуск

1. Инициализируйте базу данных с тестовыми данными:
```bash
python init_db.py
```

2. Запустите сервер:
```bash
uvicorn main:app --reload
```

API будет доступно по адресу: http://127.0.0.1:8000

Документация (Swagger): http://127.0.0.1:8000/docs

## Тестирование

После запуска сервера, выполните тесты:
```bash
python test_api.py
```

## Структура базы данных

### User
- id (Integer, PK)
- telegram_id (String, unique)
- created_at (DateTime)

### WorkoutProgram
- id (Integer, PK)
- difficulty (String)
- goal (String)
- location (String)
- name (String)
- description (Text)

### Workout
- id (Integer, PK)
- program_id (Integer, FK)
- day_number (Integer)
- title (String)
- description (Text)

### Exercise
- id (Integer, PK)
- workout_id (Integer, FK)
- name (String)
- sets (Integer)
- reps (String)
- rest_time (Integer)
- description (Text)

### UserProgress
- id (Integer, PK)
- user_id (Integer, FK)
- program_id (Integer, FK)
- workout_id (Integer, FK)
- is_completed (Boolean)
- completed_at (DateTime)

## Связи между моделями

```
User (1) ──── (*) UserProgress (*) ──── (1) WorkoutProgram
                        │
                        │ (*)
                        │
                        └── (1) Workout (*) ──── (1) WorkoutProgram
                                │
                                │ (*)
                                │
                                └── (1) Exercise
```

## API Endpoints

http://127.0.0.1:8000/programs/?difficulty=beginner&goal=weight_loss&location=home

### Пользователи
- `POST /users/` - Создание пользователя
- `GET /users/{telegram_id}` - Получение пользователя по Telegram ID
- `GET /users/{user_id}/progress` - Получение прогресса пользователя

### Программы тренировок
- `GET /programs/` - Список всех программ (с фильтрацией по difficulty, goal, location)
- `GET /programs/{program_id}` - Получение конкретной программы
- `POST /programs/` - Создание новой программы
- `GET /programs/{program_id}/workouts` - Тренировки программы

### Тренировки
- `GET /workouts/{workout_id}` - Получение конкретной тренировки
- `GET /workouts/{workout_id}/exercises` - Упражнения тренировки

### Прогресс
- `POST /progress/` - Создание записи о прогрессе
- `PATCH /progress/{progress_id}/complete` - Отметка тренировки как выполненной

### Служебные
- `GET /` - Корневой маршрут
- `GET /health` - Проверка здоровья API

## Примеры запросов

### Создание пользователя
```bash
curl -X POST "http://127.0.0.1:8000/users/" \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": "123456789"}'
```

### Получение программ с фильтрацией
```bash
curl "http://127.0.0.1:8000/programs/?difficulty=Начальный&goal=Похудение&location=Дома"
```

### Отметка тренировки как выполненной
```bash
curl -X PATCH "http://127.0.0.1:8000/progress/1/complete"
```
