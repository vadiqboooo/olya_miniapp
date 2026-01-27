#!/bin/bash

# Скрипт для получения SSL сертификата Let's Encrypt
# Домен: miniapp.rancheasy.ru

DOMAIN="miniapp.rancheasy.ru"
EMAIL="your-email@example.com"  # ЗАМЕНИТЕ НА ВАШ EMAIL!

echo "=== Настройка SSL для $DOMAIN ==="
echo ""

# Проверка email
if [ "$EMAIL" = "your-email@example.com" ]; then
    echo "❌ ОШИБКА: Пожалуйста, отредактируйте скрипт и укажите ваш email!"
    echo "Откройте файл: nano setup-ssl.sh"
    echo "Измените строку: EMAIL=\"your-email@example.com\""
    exit 1
fi

# Проверка DNS
echo "1. Проверка DNS..."
DNS_IP=$(nslookup $DOMAIN 8.8.8.8 | grep "Address:" | tail -1 | awk '{print $2}')
echo "   DNS возвращает: $DNS_IP"
echo "   Ожидается: 64.188.73.81"

if [ "$DNS_IP" != "64.188.73.81" ]; then
    echo ""
    echo "⚠️  ВНИМАНИЕ: DNS настроен неправильно!"
    echo "   Домен $DOMAIN должен указывать на 64.188.73.81"
    echo "   Текущий адрес: $DNS_IP"
    echo ""
    echo "Хотите продолжить? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Создаем директории
echo ""
echo "2. Создание директорий для сертификатов..."
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# Останавливаем контейнеры если запущены
echo ""
echo "3. Остановка контейнеров (если запущены)..."
docker-compose down 2>/dev/null || true

# Получаем сертификат
echo ""
echo "4. Получение SSL сертификата от Let's Encrypt..."
echo "   Это может занять 1-2 минуты..."
echo ""

docker run -it --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN

if [ $? -eq 0 ]; then
    echo ""
    echo "=== ✅ Сертификат успешно получен! ==="
    echo ""
    echo "Проверка сертификата:"
    ls -lh ./certbot/conf/live/$DOMAIN/
    echo ""
    echo "Срок действия:"
    docker run --rm \
      -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
      certbot/certbot certificates
    echo ""
    echo "Следующий шаг: Запустите приложение с HTTPS"
    echo "  docker-compose up -d --build"
else
    echo ""
    echo "=== ❌ Ошибка получения сертификата ==="
    echo ""
    echo "Возможные причины:"
    echo "  1. DNS не настроен или еще не обновился (подождите 5-10 минут)"
    echo "  2. Порт 80 уже занят другим сервисом"
    echo "  3. Firewall блокирует порт 80"
    echo ""
    echo "Проверьте:"
    echo "  - nslookup $DOMAIN 8.8.8.8"
    echo "  - sudo lsof -i :80"
    echo "  - sudo ufw status"
    exit 1
fi
