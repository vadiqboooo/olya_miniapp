#!/bin/bash

# Простой скрипт для получения SSL сертификата
# ПЕРЕД ЗАПУСКОМ: Замените your-email@example.com на свой email!

DOMAIN="vm725864.hosted-by.u1host.com"
EMAIL="your-email@example.com"

echo "=== Получение SSL сертификата для $DOMAIN ==="

# Создаем директории
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# Получаем сертификат
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
    echo "✓ Сертификат получен успешно!"
    echo "Теперь запустите: docker-compose up -d --build"
else
    echo "✗ Ошибка получения сертификата"
    exit 1
fi
