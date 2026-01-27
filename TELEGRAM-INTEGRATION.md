# Интеграция с Telegram WebApp

## 🎯 Возможности

Приложение полностью интегрировано с Telegram:
- ✅ Автоматическая авторизация через Telegram
- ✅ Создание нового пользователя при первом входе
- ✅ Автоматический переход к активной программе тренировок
- ✅ Сохранение прогресса пользователя
- ✅ Нативные Telegram UI компоненты (MainButton, BackButton)

---

## 🔧 Как это работает

### 1. Первый вход нового пользователя

```
Пользователь открывает WebApp в Telegram
    ↓
Получаем telegram_id
    ↓
Проверяем есть ли пользователь в базе
    ↓
НЕТ → Создаем нового пользователя
    ↓
Перенаправляем на /onboarding
    ↓
Пользователь выбирает программу
    ↓
Создаем запись прогресса
    ↓
Переход на /tracker/{programId}
```

### 2. Повторный вход существующего пользователя

```
Пользователь открывает WebApp в Telegram
    ↓
Получаем telegram_id
    ↓
Проверяем есть ли пользователь в базе
    ↓
ДА → Загружаем пользователя
    ↓
Проверяем есть ли активная программа
    ↓
ДА → Переход на /tracker/{programId}
НЕТ → Переход на /onboarding
```

---

## 📦 Компоненты

### 1. `useTelegram` Hook
**Файл:** `src/hooks/useTelegram.js`

Получает данные пользователя из Telegram WebApp API.

```javascript
const { user, tg, isReady } = useTelegram();

// user.id - telegram ID пользователя
// user.firstName - имя
// user.username - username
```

**Режим разработки:**
Если приложение открыто вне Telegram, автоматически создается тестовый пользователь с ID `12345`.

### 2. `TelegramAuthProvider` Context
**Файл:** `src/context/TelegramAuthContext.jsx`

Управляет авторизацией и редиректами.

```javascript
const { currentUser, telegramUser } = useTelegramAuth();

// currentUser - данные из базы (id, telegram_id, created_at)
// telegramUser - данные из Telegram (id, firstName, username)
```

**Логика:**
- Проверяет/создает пользователя при загрузке
- Проверяет активные программы
- Делает автоматический редирект

---

## 🚀 Настройка Telegram Bot

### 1. Создайте бота через @BotFather

```
/newbot
Название бота: Fitness Trainer
Username: YourFitnessBot
```

Получите **BOT_TOKEN**.

### 2. Настройте WebApp

```
/newapp
Выберите бота
Название: Fitness Trainer
Описание: Персональный тренер
Фото: загрузите иконку
URL: https://miniapp.rancheasy.ru
```

### 3. Настройте Menu Button

```
/setmenubutton
Выберите бота
URL: https://miniapp.rancheasy.ru
Text: Открыть тренировки
```

---

## 📱 Тестирование

### Локальное тестирование

Приложение работает и вне Telegram с фейковым пользователем:

```bash
npm run dev
# Откройте: http://localhost:5173
# Будет создан тестовый пользователь с ID 12345
```

### Тестирование в Telegram (через ngrok)

```bash
# 1. Запустите приложение
docker-compose up -d

# 2. Установите ngrok (если нет)
# https://ngrok.com/download

# 3. Создайте туннель
ngrok http 443

# 4. Получите HTTPS URL (например: https://abc123.ngrok.io)

# 5. Обновите WebApp URL в @BotFather
/setmenubutton
URL: https://abc123.ngrok.io
```

### Production тестирование

```bash
# Просто откройте бота в Telegram
# Нажмите кнопку "Открыть тренировки"
# Приложение откроется по адресу: https://miniapp.rancheasy.ru
```

---

## 🔐 Безопасность

### Валидация initData

⚠️ **ВАЖНО:** В production нужно валидировать `initData` на бэкенде!

Сейчас мы доверяем `telegram_id` от клиента, но это небезопасно.

**Правильная реализация:**

1. Frontend отправляет `window.Telegram.WebApp.initData` на backend
2. Backend проверяет подпись через `SECRET_KEY` бота
3. Backend извлекает `user.id` из валидированных данных

**Пример валидации (Python):**

```python
import hashlib
import hmac
from urllib.parse import parse_qsl

def validate_telegram_data(init_data: str, bot_token: str) -> dict:
    """Валидирует initData от Telegram"""
    parsed_data = dict(parse_qsl(init_data))
    hash_value = parsed_data.pop('hash', None)

    if not hash_value:
        raise ValueError("Invalid init data")

    # Создаем строку для проверки
    data_check_string = '\n'.join(
        f"{k}={v}" for k, v in sorted(parsed_data.items())
    )

    # Проверяем подпись
    secret_key = hmac.new(
        b"WebAppData",
        bot_token.encode(),
        hashlib.sha256
    ).digest()

    calculated_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256
    ).hexdigest()

    if calculated_hash != hash_value:
        raise ValueError("Invalid hash")

    return parsed_data
```

---

## 🎨 Telegram UI

### MainButton

```javascript
import { useTelegram } from '../hooks/useTelegram';

const { showMainButton, hideMainButton } = useTelegram();

// Показать кнопку
showMainButton('Продолжить', () => {
  console.log('Button clicked!');
  navigate('/next-page');
});

// Скрыть кнопку
hideMainButton();
```

### BackButton

```javascript
const { showBackButton, hideBackButton } = useTelegram();

// Показать кнопку назад
showBackButton(() => {
  navigate(-1);
});

// Скрыть кнопку
hideBackButton();
```

### Alerts

```javascript
const { showAlert, showConfirm } = useTelegram();

// Простое уведомление
showAlert('Тренировка завершена!');

// Подтверждение
const confirmed = await showConfirm('Удалить тренировку?');
if (confirmed) {
  // Действие подтверждено
}
```

---

## 📊 База данных

### Таблица Users

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    telegram_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Таблица UserProgress

```sql
CREATE TABLE user_progress (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    program_id INTEGER NOT NULL,
    workout_id INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🐛 Troubleshooting

### Проблема: "Telegram WebApp API not found"

**Причина:** Приложение открыто вне Telegram

**Решение:**
- В production: открывайте через Telegram бота
- В dev: используется фейковый пользователь (ID 12345)

### Проблема: Пользователь не создается

**Проверьте:**
1. Backend запущен: `curl https://miniapp.rancheasy.ru/api/programs`
2. Логи frontend: `docker-compose logs frontend`
3. Логи backend: `docker-compose logs backend`

### Проблема: Постоянный редирект на onboarding

**Причина:** Не создается запись прогресса

**Решение:**
1. Проверьте создание прогресса в OnboardingForm
2. Проверьте endpoint: `POST /api/progress`
3. Проверьте логи: `docker-compose logs -f`

---

## 📚 Полезные ссылки

- [Telegram WebApp Documentation](https://core.telegram.org/bots/webapps)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [BotFather](https://t.me/BotFather)

---

## 🎯 Roadmap

Будущие улучшения:
- [ ] Валидация initData на backend
- [ ] Хранение Telegram username/name пользователя
- [ ] Уведомления через Telegram bot
- [ ] Напоминания о тренировках
- [ ] Шаринг прогресса в Telegram
- [ ] Подписка Premium через Telegram Payments
