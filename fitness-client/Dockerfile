# Frontend Dockerfile для React приложения (Multi-stage build)

# Стадия 1: Сборка приложения
FROM node:20-alpine AS builder

WORKDIR /app

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm ci

# Копирование исходного кода
COPY . .

# Получение аргумента сборки для API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Сборка приложения для продакшена
RUN npm run build

# Стадия 2: Production сервер с Nginx
FROM nginx:alpine

# Копирование собранного приложения из стадии builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Копирование кастомной конфигурации nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открытие порта
EXPOSE 80

# Запуск nginx
CMD ["nginx", "-g", "daemon off;"]
