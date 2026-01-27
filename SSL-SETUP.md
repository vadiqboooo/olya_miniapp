# Настройка HTTPS для приложения

## Предварительные требования

1. **DNS настроен**: Домен `vm725864.hosted-by.u1host.com` должен указывать на IP сервера `64.188.73.81`
   - Проверить можно командой: `nslookup vm725864.hosted-by.u1host.com`

2. **Порты открыты**:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 8000/tcp
   ```

3. **Docker установлен и запущен**

## Вариант 1: Автоматическая настройка (рекомендуется)

### Шаг 1: Остановите текущие контейнеры
```bash
docker-compose down
```

### Шаг 2: Отредактируйте скрипт
```bash
nano get-ssl.sh
```
Замените `your-email@example.com` на ваш реальный email.

### Шаг 3: Сделайте скрипт исполняемым
```bash
chmod +x get-ssl.sh
```

### Шаг 4: Запустите скрипт получения SSL
```bash
./get-ssl.sh
```

### Шаг 5: Запустите приложение с SSL
```bash
docker-compose up -d --build
```

### Шаг 6: Проверьте статус
```bash
docker-compose ps
docker-compose logs frontend
```

## Вариант 2: Ручная настройка

### Шаг 1: Создайте директории для сертификатов
```bash
mkdir -p ./certbot/conf
mkdir -p ./certbot/www
```

### Шаг 2: Получите сертификат вручную
```bash
docker run -it --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  --email YOUR-EMAIL@example.com \
  --agree-tos \
  --no-eff-email \
  -d vm725864.hosted-by.u1host.com
```

### Шаг 3: Проверьте полученные сертификаты
```bash
ls -la ./certbot/conf/live/vm725864.hosted-by.u1host.com/
```
Должны быть файлы: `fullchain.pem`, `privkey.pem`

### Шаг 4: Запустите приложение
```bash
docker-compose up -d --build
```

## Проверка работы HTTPS

### 1. Проверьте доступность сайта
```bash
curl -I https://vm725864.hosted-by.u1host.com
```

### 2. Откройте в браузере
Перейдите по адресу: https://vm725864.hosted-by.u1host.com

Вы должны увидеть:
- ✅ Зеленый замочек в адресной строке
- ✅ Приложение загружается
- ✅ API запросы работают через `/api`

### 3. Проверьте API
```bash
curl https://vm725864.hosted-by.u1host.com/api/programs/
```

## Автоматическое обновление сертификата

Сертификат будет автоматически обновляться благодаря контейнеру `certbot`, который проверяет необходимость обновления каждые 12 часов.

Для ручного обновления:
```bash
docker-compose run --rm certbot renew
docker-compose restart frontend
```

## Устранение проблем

### Проблема: "Connection refused" на порту 80
```bash
# Проверьте, не занят ли порт
sudo lsof -i :80

# Остановите конфликтующий сервис (например, apache)
sudo systemctl stop apache2
```

### Проблема: "Failed to verify certificate"
Причины:
1. DNS еще не обновился - подождите 5-10 минут
2. Домен не указывает на ваш сервер

Проверка:
```bash
nslookup vm725864.hosted-by.u1host.com
# Должен вернуть IP: 64.188.73.81
```

### Проблема: API запросы не работают
1. Проверьте логи backend:
```bash
docker-compose logs backend
```

2. Проверьте, что backend запущен:
```bash
docker-compose ps backend
```

3. Проверьте прямой доступ к API:
```bash
curl http://localhost:8000/programs/
```

### Проблема: "NET::ERR_CERT_AUTHORITY_INVALID"
Вы использовали staging сертификат (тестовый).

Решение:
```bash
# Удалите staging сертификат
sudo rm -rf ./certbot/conf/live
sudo rm -rf ./certbot/conf/archive
sudo rm -rf ./certbot/conf/renewal

# Получите production сертификат
./get-ssl.sh
```

## Архитектура

```
Пользователь → HTTPS (443) → Nginx →
                                    ├─> Frontend (Static files)
                                    └─> /api → Backend (8000)
```

Все API запросы идут через Nginx proxy на `/api`, который проксирует их на backend:8000.

Преимущества:
- ✅ Один домен для фронтенда и API
- ✅ Нет проблем с CORS
- ✅ SSL терминация в одном месте
- ✅ Безопасность (backend недоступен напрямую извне)

## Полезные команды

```bash
# Проверка сертификата
openssl x509 -in ./certbot/conf/live/vm725864.hosted-by.u1host.com/fullchain.pem -noout -dates

# Просмотр логов в реальном времени
docker-compose logs -f frontend
docker-compose logs -f backend

# Перезапуск только frontend
docker-compose restart frontend

# Полная пересборка
docker-compose down
docker-compose up -d --build

# Проверка здоровья контейнеров
docker-compose ps
```
