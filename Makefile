# Makefile для упрощения работы с Docker

.PHONY: help build up down restart logs ps clean init-db backup dev dev-down prod

# Цвета для вывода
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Показать эту справку
	@echo "$(GREEN)Доступные команды:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

# Production команды
build: ## Собрать Docker образы для production
	@echo "$(GREEN)Сборка production образов...$(NC)"
	docker compose build --no-cache

up: ## Запустить приложение в production режиме
	@echo "$(GREEN)Запуск production...$(NC)"
	docker compose up -d
	@echo "$(GREEN)Приложение запущено!$(NC)"
	@echo "Frontend: http://localhost"
	@echo "Backend: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

down: ## Остановить приложение
	@echo "$(YELLOW)Остановка приложения...$(NC)"
	docker compose down

restart: ## Перезапустить приложение
	@echo "$(YELLOW)Перезапуск приложения...$(NC)"
	docker compose restart

logs: ## Показать логи всех сервисов
	docker compose logs -f

logs-backend: ## Показать логи backend
	docker compose logs -f backend

logs-frontend: ## Показать логи frontend
	docker compose logs -f frontend

ps: ## Показать статус контейнеров
	docker compose ps

# Development команды
dev: ## Запустить приложение в dev режиме с hot-reload
	@echo "$(GREEN)Запуск development...$(NC)"
	docker compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)Dev сервер запущен!$(NC)"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:8000"

dev-down: ## Остановить dev окружение
	@echo "$(YELLOW)Остановка dev окружения...$(NC)"
	docker compose -f docker-compose.dev.yml down

dev-logs: ## Показать логи dev окружения
	docker compose -f docker-compose.dev.yml logs -f

# База данных
init-db: ## Инициализировать базу данных с тестовыми данными
	@echo "$(GREEN)Инициализация базы данных...$(NC)"
	docker compose exec backend python init_db.py
	@echo "$(GREEN)База данных инициализирована!$(NC)"

reset-db: ## Пересоздать базу данных (УДАЛИТ ВСЕ ДАННЫЕ!)
	@echo "$(RED)ВНИМАНИЕ: Все данные будут удалены!$(NC)"
	@read -p "Продолжить? [y/N]: " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker compose exec backend rm -f data/workout_app.db; \
		docker compose exec backend python init_db.py; \
		echo "$(GREEN)База данных пересоздана!$(NC)"; \
	else \
		echo "$(YELLOW)Отменено.$(NC)"; \
	fi

backup: ## Создать backup базы данных
	@echo "$(GREEN)Создание backup...$(NC)"
	@mkdir -p backups
	docker compose exec backend cp /app/data/workout_app.db /app/data/backup_$$(date +%Y%m%d_%H%M%S).db
	docker cp fitness-backend:/app/data/backup_$$(date +%Y%m%d)*.db backups/
	@echo "$(GREEN)Backup создан в директории backups/$(NC)"

# Обслуживание
clean: ## Удалить неиспользуемые Docker ресурсы
	@echo "$(YELLOW)Очистка Docker ресурсов...$(NC)"
	docker system prune -f
	@echo "$(GREEN)Очистка завершена!$(NC)"

clean-all: ## Полная очистка (УДАЛИТ VOLUMES И ДАННЫЕ!)
	@echo "$(RED)ВНИМАНИЕ: Будут удалены все volumes и данные!$(NC)"
	@read -p "Продолжить? [y/N]: " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker compose down -v; \
		docker system prune -a -f; \
		echo "$(GREEN)Полная очистка завершена!$(NC)"; \
	else \
		echo "$(YELLOW)Отменено.$(NC)"; \
	fi

# Обновление
update: ## Обновить приложение (git pull + rebuild + restart)
	@echo "$(GREEN)Обновление приложения...$(NC)"
	git pull
	docker compose down
	docker compose up -d --build
	@echo "$(GREEN)Приложение обновлено!$(NC)"

# Вход в контейнеры
shell-backend: ## Войти в backend контейнер
	docker compose exec backend bash

shell-frontend: ## Войти в frontend контейнер
	docker compose exec frontend sh

# Тестирование
test: ## Запустить тесты (если добавлены)
	@echo "$(YELLOW)Запуск тестов...$(NC)"
	docker compose exec backend pytest

# Полный production deploy
prod: build ## Полный production deploy (build + up + init-db)
	@echo "$(GREEN)Production deploy...$(NC)"
	docker compose up -d
	@sleep 5
	docker compose exec backend python init_db.py
	@echo "$(GREEN)Production deploy завершен!$(NC)"
	@echo "Frontend: http://localhost"
	@echo "Backend: http://localhost:8000"

# Быстрая перезагрузка backend
reload-backend: ## Быстрая перезагрузка backend
	docker compose restart backend
	docker compose logs -f backend

# Быстрая перезагрузка frontend
reload-frontend: ## Быстрая перезагрузка frontend
	docker compose restart frontend
	docker compose logs -f frontend

# Проверка здоровья
health: ## Проверить health checks
	@echo "$(GREEN)Проверка здоровья сервисов...$(NC)"
	@echo -n "Backend: "
	@curl -s http://localhost:8000/health || echo "$(RED)FAILED$(NC)"
	@echo -n "Frontend: "
	@curl -s http://localhost/health || echo "$(RED)FAILED$(NC)"
	@echo ""
	@docker compose ps
