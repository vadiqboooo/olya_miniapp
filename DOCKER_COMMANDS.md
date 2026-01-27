# Docker команды - Шпаргалка

Краткая справка по основным командам для работы с проектом.

---

## 🚀 Production (docker-compose.yml)

### Базовые команды

```bash
# Запуск всех сервисов
docker compose up -d

# Запуск с пересборкой образов
docker compose up -d --build

# Остановка сервисов
docker compose down

# Остановка с удалением volumes (УДАЛИТ БД!)
docker compose down -v

# Перезапуск сервисов
docker compose restart

# Перезапуск конкретного сервиса
docker compose restart backend
docker compose restart frontend
```

### Просмотр логов

```bash
# Все логи (follow mode)
docker compose logs -f

# Логи backend
docker compose logs -f backend

# Логи frontend
docker compose logs -f frontend

# Последние 100 строк
docker compose logs --tail=100 backend
```

### Статус и мониторинг

```bash
# Статус контейнеров
docker compose ps

# Использование ресурсов
docker stats

# Проверка health checks
docker compose ps
```

---

## 🛠️ Development (docker-compose.dev.yml)

### Запуск dev окружения

```bash
# Запуск dev версии с hot-reload
docker compose -f docker-compose.dev.yml up -d

# Остановка dev версии
docker compose -f docker-compose.dev.yml down

# Логи dev версии
docker compose -f docker-compose.dev.yml logs -f
```

---

## 📦 Работа с контейнерами

### Вход в контейнеры

```bash
# Backend (bash)
docker compose exec backend bash

# Frontend (sh, так как alpine)
docker compose exec frontend sh

# Выполнение команды без входа
docker compose exec backend python init_db.py
```

### Копирование файлов

```bash
# Из контейнера на хост
docker cp fitness-backend:/app/data/workout_app.db ./backup.db

# С хоста в контейнер
docker cp ./backup.db fitness-backend:/app/data/workout_app.db
```

---

## 🗄️ База данных

### Инициализация

```bash
# Первая инициализация с тестовыми данными
docker compose exec backend python init_db.py

# Пересоздание БД
docker compose exec backend rm data/workout_app.db
docker compose exec backend python init_db.py
```

### Backup и restore

```bash
# Создать backup
docker compose exec backend cp /app/data/workout_app.db /app/data/backup_$(date +%Y%m%d).db

# Копировать backup на хост
docker cp fitness-backend:/app/data/backup_20260127.db ./backups/

# Восстановить из backup
docker cp ./backups/backup_20260127.db fitness-backend:/app/data/workout_app.db
docker compose restart backend
```

---

## 🔄 Обновление приложения

### После git pull

```bash
# 1. Получить изменения
git pull

# 2. Пересобрать и запустить
docker compose down
docker compose up -d --build

# 3. Проверить логи
docker compose logs -f
```

### Обновление только backend

```bash
docker compose build backend --no-cache
docker compose up -d backend
docker compose logs -f backend
```

### Обновление только frontend

```bash
docker compose build frontend --no-cache
docker compose up -d frontend
docker compose logs -f frontend
```

---

## 🧹 Очистка

### Удаление неиспользуемых ресурсов

```bash
# Удалить остановленные контейнеры
docker container prune

# Удалить неиспользуемые образы
docker image prune -a

# Удалить неиспользуемые volumes
docker volume prune

# Полная очистка (ОСТОРОЖНО!)
docker system prune -a --volumes
```

### Удаление конкретного проекта

```bash
# Остановить и удалить контейнеры, сети
docker compose down

# Также удалить volumes (БД)
docker compose down -v

# Удалить образы проекта
docker rmi miniapp_olya-backend miniapp_olya-frontend
```

---

## 📊 Отладка

### Проверка сети

```bash
# Список сетей
docker network ls

# Информация о сети проекта
docker network inspect miniapp_olya_fitness-network

# Проверка подключения между контейнерами
docker compose exec frontend ping backend
```

### Проверка volumes

```bash
# Список volumes
docker volume ls

# Информация о volume
docker volume inspect miniapp_olya_backend-data

# Где физически хранятся данные
docker volume inspect miniapp_olya_backend-data | grep Mountpoint
```

### Health checks

```bash
# Проверить состояние контейнеров
docker compose ps

# Ручная проверка health endpoints
curl http://localhost:8000/health      # Backend
curl http://localhost/health           # Frontend
```

---

## 🔧 Troubleshooting

### Контейнер не запускается

```bash
# 1. Проверить логи
docker compose logs backend

# 2. Попробовать запустить в интерактивном режиме
docker compose run --rm backend bash

# 3. Проверить образ
docker images | grep fitness
```

### Порты заняты

```bash
# Найти процесс, использующий порт (Linux/Mac)
lsof -i :8000
lsof -i :80

# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 8000

# Изменить порты в docker-compose.yml
# ports:
#   - "8001:8000"  # вместо 8000:8000
```

### Проблемы с volumes

```bash
# Пересоздать volumes
docker compose down -v
docker compose up -d
docker compose exec backend python init_db.py
```

### Недостаточно памяти

```bash
# Проверить использование ресурсов
docker stats

# Очистить неиспользуемое
docker system prune -a

# Увеличить лимиты (в docker-compose.yml)
# deploy:
#   resources:
#     limits:
#       memory: 512M
```

---

## 📝 Полезные алиасы

Добавьте в `.bashrc` или `.zshrc`:

```bash
# Алиасы для docker compose
alias dc='docker compose'
alias dcu='docker compose up -d'
alias dcd='docker compose down'
alias dcl='docker compose logs -f'
alias dcp='docker compose ps'
alias dcr='docker compose restart'

# Алиасы для dev окружения
alias dcdev='docker compose -f docker-compose.dev.yml'
alias dcdevup='docker compose -f docker-compose.dev.yml up -d'
alias dcdevdown='docker compose -f docker-compose.dev.yml down'

# Быстрый доступ к контейнерам
alias backend='docker compose exec backend bash'
alias frontend='docker compose exec frontend sh'
```

Использование:

```bash
dcu          # вместо docker compose up -d
dcl backend  # вместо docker compose logs -f backend
backend      # вместо docker compose exec backend bash
```

---

## 🔗 Быстрые ссылки

После запуска приложения:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **API Redoc**: http://localhost:8000/redoc
- **Backend Health**: http://localhost:8000/health
- **Frontend Health**: http://localhost/health

---

## 💡 Частые сценарии

### Сценарий 1: Первый запуск на сервере

```bash
git clone <repo>
cd miniApp_olya
cp .env.production .env
# Отредактировать .env
docker compose up -d --build
docker compose exec backend python init_db.py
docker compose logs -f
```

### Сценарий 2: Локальная разработка

```bash
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml logs -f
# Редактировать код - изменения применяются автоматически
```

### Сценарий 3: Обновление на продакшене

```bash
git pull
docker compose down
docker compose up -d --build
docker compose logs -f backend
docker compose logs -f frontend
```

### Сценарий 4: Backup перед обновлением

```bash
# 1. Backup БД
docker compose exec backend cp /app/data/workout_app.db /app/data/backup.db
docker cp fitness-backend:/app/data/backup.db ./backup_$(date +%Y%m%d).db

# 2. Обновление
git pull
docker compose up -d --build

# 3. Если что-то пошло не так - restore
docker cp ./backup_20260127.db fitness-backend:/app/data/workout_app.db
docker compose restart backend
```

---

**Дата создания**: 27.01.2026
**Версия**: 1.0
