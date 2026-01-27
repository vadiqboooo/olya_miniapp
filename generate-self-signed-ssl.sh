#!/bin/bash

# Скрипт для создания самоподписанного SSL сертификата для IP адреса
# Используется когда домен недоступен

IP_ADDRESS="64.188.73.81"
CERT_DIR="./ssl-self-signed"

echo "=== Генерация самоподписанного SSL сертификата ==="
echo "IP адрес: $IP_ADDRESS"
echo ""

# Создаем директорию для сертификатов
mkdir -p $CERT_DIR

# Генерируем приватный ключ
echo "1. Генерация приватного ключа..."
openssl genrsa -out $CERT_DIR/privkey.pem 4096

# Создаем конфигурационный файл для сертификата с IP адресом
cat > $CERT_DIR/openssl.cnf << EOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=State
L=City
O=Organization
OU=IT
CN=$IP_ADDRESS

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
IP.1 = $IP_ADDRESS
EOF

# Генерируем CSR (Certificate Signing Request)
echo "2. Генерация CSR..."
openssl req -new -key $CERT_DIR/privkey.pem \
    -out $CERT_DIR/cert.csr \
    -config $CERT_DIR/openssl.cnf

# Генерируем самоподписанный сертификат на 365 дней
echo "3. Генерация самоподписанного сертификата..."
openssl x509 -req \
    -days 365 \
    -in $CERT_DIR/cert.csr \
    -signkey $CERT_DIR/privkey.pem \
    -out $CERT_DIR/fullchain.pem \
    -extensions v3_req \
    -extfile $CERT_DIR/openssl.cnf

# Проверяем сертификат
echo ""
echo "4. Проверка сертификата:"
openssl x509 -in $CERT_DIR/fullchain.pem -text -noout | grep -A 2 "Subject Alternative Name"

echo ""
echo "=== ✓ Готово! ==="
echo ""
echo "Сертификаты созданы в директории: $CERT_DIR/"
echo "  - privkey.pem (приватный ключ)"
echo "  - fullchain.pem (сертификат)"
echo ""
echo "⚠️  ВАЖНО: Это самоподписанный сертификат!"
echo "Браузеры будут показывать предупреждение о безопасности."
echo "Это нормально - просто нажмите 'Продолжить' или 'Advanced' -> 'Proceed'."
