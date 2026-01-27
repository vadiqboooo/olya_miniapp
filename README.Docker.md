# Docker развертывание фитнес-приложения

Полная инструкция по развертыванию приложения с помощью Docker и Docker Compose.

## 📋 Содержание

- [Требования](#требования)
- [Структура проекта](#структура-проекта)
- [Быстрый старт](#быстрый-старт)
- [Конфигурация](#конфигурация)
- [Команды Docker](#команды-docker)
- [Продакшен развертывание](#продакшен-развертывание)
- [Troubleshooting](#troubleshooting)

---

## Требования

Убедитесь, что на сервере установлены:

- **Docker**: версия 20.10 или выше
- **Docker Compose**: версия 2.0 или выше

### Установка Docker (для Ubuntu/Debian)

```bash
# Обновление пакетов
sudo apt-get update

# Установка зависимостей
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Добавление официального GPG ключа Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Добавление репозитория Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Проверка установки
docker --version
docker compose version
```

---

## Структура проекта

```
miniApp_olya/
├── backend/                      # Backend сервис (FastAPI)
│   ├── Dockerfile                # Docker образ для backend
│   ├── .dockerignore            # Игнорируемые файлы
│   ├── requirements.txt         # Python зависимости
│   └── ...
├── fitness-client/              # Frontend сервис (React)
│   ├── Dockerfile               # Multi-stage Docker образ
│   ├── .dockerignore           # Игнорируемые файлы
│   ├── nginx.conf              # Конфигурация Nginx
│   ├── package.json            # Node.js зависимости
│   └── ...
├── docker-compose.yml          # Оркестрация сервисов
├── .env.production             # Production переменные окружения
└── README.Docker.md            # Эта инструкция
```

---

## Быстрый старт

### 1. Клонирование репозитория

```bash
git clone <your-repository-url>
cd miniApp_olya
```

### 2. Настройка переменных окружения

```bash
# Скопировать пример конфигурации
cp .env.production .env

# Отредактировать .env файл
nano .env
```

**Важно**: Замените `your-server-domain.com` на ваш реальный домен или IP адрес сервера!

```env
VITE_API_URL=http://your-actual-domain.com:8000
SERVER_DOMAIN=your-actual-domain.com
```

### 3. Запуск приложения

```bash
# Сборка и запуск всех сервисов
docker compose up -d --build

# Проверка статуса
docker compose ps

# Просмотр логов
docker compose logs -f
```

### 4. Инициализация базы данных (первый запуск)

```bash
# Выполнить инициализацию БД с тестовыми данными
docker compose exec backend python init_db.py
```

### 5. Проверка работы

- **Frontend**: http://your-server:80
- **Backend API**: http://your-server:8000
- **API документация**: http://your-server:8000/docs
- **Health check (backend)**: http://your-server:8000/health
- **Health check (frontend)**: http://your-server/health

---

## Конфигурация

### Backend (FastAPI)

#### Environment переменные

| Переменная | Описание | Значение по умолчанию |
|-----------|----------|----------------------|
| `DATABASE_URL` | Путь к SQLite базе данных | `sqlite:///./data/workout_app.db` |
| `API_HOST` | Хост для uvicorn | `0.0.0.0` |
| `API_PORT` | Порт для uvicorn | `8000` |
| `DEBUG` | Режим отладки | `False` |

#### Volume

- `backend-data:/app/data` - персистентное хранилище для базы данных SQLite

### Frontend (React + Nginx)

#### Build аргументы

| Аргумент | Описание | Значение по умолчанию |
|---------|----------|----------------------|
| `VITE_API_URL` | URL backend API | `http://localhost:8000` |

#### Nginx конфигурация

- Gzip сжатие включено
- SPA роутинг (React Router)
- Кеширование статических файлов (1 год)
- Security headers
- API proxy (опционально, через `/api` путь)

---

## Команды Docker

### Основные команды

```bash
# Запуск сервисов
docker compose up -d

# Остановка сервисов
docker compose down

# Перезапуск сервисов
docker compose restart

# Просмотр логов
docker compose logs -f [service_name]

# Просмотр статуса
docker compose ps

# Пересборка образов
docker compose build --no-cache

# Удаление volumes (ВНИМАНИЕ: удалит базу данных!)
docker compose down -v
```

### Работа с контейнерами

```bash
# Вход в контейнер backend
docker compose exec backend bash

# Вход в контейнер frontend
docker compose exec frontend sh

# Выполнение команды в backend
docker compose exec backend python init_db.py

# Просмотр логов конкретного сервиса
docker compose logs -f backend
docker compose logs -f frontend
```

### Обновление приложения

```bash
# 1. Получить последние изменения
git pull

# 2. Остановить текущие контейнеры
docker compose down

# 3. Пересобрать образы
docker compose build --no-cache

# 4. Запустить обновленные контейнеры
docker compose up -d

# 5. Проверить логи
docker compose logs -f
```

---

## Продакшен развертывание

### 1. Использование внешнего Nginx (рекомендуется)

Для production окружения рекомендуется использовать внешний Nginx в качестве reverse proxy с SSL.

#### Установка Certbot для SSL

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### Пример конфигурации Nginx

Создайте файл `/etc/nginx/sites-available/fitness-app`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL конфигурация (certbot добавит автоматически)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активация конфигурации:

```bash
sudo ln -s /etc/nginx/sites-available/fitness-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Обновление docker-compose.yml для production

```yaml
services:
  backend:
    # ... существующая конфигурация
    environment:
      - DEBUG=False
    # Не публикуем порт наружу, только внутри сети
    expose:
      - "8000"

  frontend:
    # ... существующая конфигурация
    expose:
      - "80"
```

### 3. Автоматический запуск при перезагрузке сервера

Docker Compose автоматически настроен с `restart: unless-stopped`.

Для автоматического запуска Docker при загрузке системы:

```bash
sudo systemctl enable docker
```

### 4. Мониторинг и логирование

#### Просмотр использования ресурсов

```bash
docker stats
```

#### Настройка log rotation

Создайте файл `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Перезапустите Docker:

```bash
sudo systemctl restart docker
```

---

## Troubleshooting

### Проблема: Frontend не может подключиться к Backend

**Решение**: Проверьте `VITE_API_URL` в `.env` файле и убедитесь, что он указывает на правильный домен/IP.

```bash
# Пересоберите frontend с правильными переменными
docker compose build frontend --no-cache
docker compose up -d frontend
```

### Проблема: База данных пустая после перезапуска

**Решение**: Убедитесь, что volume для данных создан и примонтирован:

```bash
# Проверить volumes
docker volume ls

# Проверить где хранятся данные
docker volume inspect miniapp_olya_backend-data
```

### Проблема: Порты уже заняты

**Решение**: Измените порты в `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8001:8000"  # Вместо 8000
  frontend:
    ports:
      - "8080:80"    # Вместо 80
```

### Проблема: Контейнер постоянно перезапускается

**Решение**: Проверьте логи:

```bash
docker compose logs backend
docker compose logs frontend

# Проверить health checks
docker compose ps
```

### Проблема: Недостаточно места на диске

**Решение**: Очистите неиспользуемые Docker объекты:

```bash
# Удалить неиспользуемые образы
docker image prune -a

# Удалить неиспользуемые volumes
docker volume prune

# Полная очистка (ОСТОРОЖНО!)
docker system prune -a --volumes
```

---

## Резервное копирование

### Backup базы данных

```bash
# Создать backup
docker compose exec backend cp /app/data/workout_app.db /app/data/workout_app_backup_$(date +%Y%m%d).db

# Скопировать backup на хост
docker cp fitness-backend:/app/data/workout_app_backup_YYYYMMDD.db ./backups/

# Или использовать volume
docker run --rm -v miniapp_olya_backend-data:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/db-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore базы данных

```bash
# Восстановить из backup
docker cp ./backups/workout_app_backup_YYYYMMDD.db fitness-backend:/app/data/workout_app.db

# Перезапустить backend
docker compose restart backend
```

---

## Полезные ссылки

- [Docker документация](https://docs.docker.com/)
- [Docker Compose документация](https://docs.docker.com/compose/)
- [FastAPI документация](https://fastapi.tiangolo.com/)
- [React документация](https://react.dev/)
- [Nginx документация](https://nginx.org/en/docs/)

---

## Поддержка

Если возникли проблемы, проверьте:

1. Логи контейнеров: `docker compose logs -f`
2. Статус контейнеров: `docker compose ps`
3. Health checks: `curl http://localhost:8000/health`
4. Сетевую конфигурацию: `docker network inspect miniapp_olya_fitness-network`

---

**Дата создания**: 27.01.2026
**Версия**: 1.0
