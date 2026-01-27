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
openssl genrsa -out $CERT_DIR/privkey.pem 2048

# Создаем конфигурационный файл для сертификата с IP адресом
cat > $CERT_DIR/openssl.cnf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req
x509_extensions = v3_ca

[dn]
C=US
ST=State
L=City
O=Fitness App
OU=IT Department
CN=$IP_ADDRESS

[v3_req]
basicConstraints = CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment, keyAgreement
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[v3_ca]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment, keyAgreement
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
IP.1 = $IP_ADDRESS
EOF

# Генерируем самоподписанный сертификат напрямую (без CSR)
echo "2. Генерация самоподписанного сертификата (365 дней)..."
openssl req -new -x509 \
    -key $CERT_DIR/privkey.pem \
    -out $CERT_DIR/fullchain.pem \
    -days 365 \
    -config $CERT_DIR/openssl.cnf \
    -extensions v3_ca

# Проверяем сертификат
echo ""
echo "3. Проверка сертификата:"
echo ""
openssl x509 -in $CERT_DIR/fullchain.pem -text -noout | grep -A 2 "Subject Alternative Name"
echo ""
openssl x509 -in $CERT_DIR/fullchain.pem -text -noout | grep -A 3 "X509v3 Key Usage"

echo ""
echo "=== ✓ Готово! ==="
echo ""
echo "Сертификаты созданы в директории: $CERT_DIR/"
echo "  - privkey.pem (приватный ключ)"
echo "  - fullchain.pem (сертификат)"
echo ""
echo "Срок действия сертификата:"
openssl x509 -in $CERT_DIR/fullchain.pem -noout -dates
echo ""
echo "⚠️  ВАЖНО: Это самоподписанный сертификат!"
echo "Браузеры будут показывать предупреждение о безопасности."
echo "Это нормально - просто нажмите 'Продолжить' или 'Advanced' -> 'Proceed'."
