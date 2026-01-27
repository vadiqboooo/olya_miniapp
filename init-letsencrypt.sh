#!/bin/bash

# Скрипт для первоначальной настройки Let's Encrypt SSL сертификата

# Настройки
DOMAIN="vm725864.hosted-by.u1host.com"
EMAIL="your-email@example.com"  # ЗАМЕНИТЕ НА ВАШ EMAIL!
STAGING=0  # Поставьте 1 для тестирования (staging режим Let's Encrypt)

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Инициализация Let's Encrypt SSL ===${NC}"
echo -e "Домен: ${YELLOW}${DOMAIN}${NC}"
echo -e "Email: ${YELLOW}${EMAIL}${NC}"
echo ""

# Проверка, что email изменен
if [ "$EMAIL" = "your-email@example.com" ]; then
    echo -e "${RED}ОШИБКА: Пожалуйста, измените EMAIL в скрипте!${NC}"
    exit 1
fi

# Создаем необходимые директории
echo -e "${GREEN}Создание директорий...${NC}"
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# Создаем временную nginx конфигурацию для получения сертификата
echo -e "${GREEN}Создание временной nginx конфигурации...${NC}"
cat > ./fitness-client/nginx-temp.conf << 'EOF'
server {
    listen 80;
    server_name vm725864.hosted-by.u1host.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Временно используем эту конфигурацию
echo -e "${GREEN}Запуск временного контейнера nginx...${NC}"
docker-compose up -d frontend

# Ждем, пока nginx запустится
echo -e "${YELLOW}Ожидание запуска nginx (15 секунд)...${NC}"
sleep 15

# Получаем сертификат
echo -e "${GREEN}Получение SSL сертификата...${NC}"

if [ $STAGING != "0" ]; then
    STAGING_ARG="--staging"
    echo -e "${YELLOW}Используется staging режим (тестовый сертификат)${NC}"
else
    STAGING_ARG=""
fi

docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    $STAGING_ARG \
    -d $DOMAIN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SSL сертификат успешно получен!${NC}"

    # Восстанавливаем основную конфигурацию nginx
    echo -e "${GREEN}Восстановление основной nginx конфигурации...${NC}"
    rm -f ./fitness-client/nginx-temp.conf

    # Перезапускаем с полной конфигурацией
    echo -e "${GREEN}Перезапуск с SSL конфигурацией...${NC}"
    docker-compose down
    docker-compose up -d --build

    echo ""
    echo -e "${GREEN}=== Готово! ===${NC}"
    echo -e "Ваш сайт доступен по адресу: ${GREEN}https://${DOMAIN}${NC}"
    echo ""
    echo -e "${YELLOW}Сертификат будет автоматически обновляться каждые 12 часов${NC}"
else
    echo -e "${RED}✗ Ошибка при получении сертификата${NC}"
    echo -e "${YELLOW}Проверьте:${NC}"
    echo "  1. Домен $DOMAIN указывает на этот сервер (A запись в DNS)"
    echo "  2. Порт 80 открыт в firewall"
    echo "  3. Нет других сервисов на порту 80"
    exit 1
fi
