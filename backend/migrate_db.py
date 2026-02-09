"""
Скрипт для обновления структуры базы данных с добавлением CASCADE удаления.
Запустите этот скрипт один раз для применения изменений к существующей базе данных.
"""
import sqlite3
import shutil
from datetime import datetime

# Путь к базе данных
DB_PATH = "./workout_app.db"

def backup_database():
    """Создает резервную копию базы данных"""
    backup_path = f"./workout_app_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    shutil.copy2(DB_PATH, backup_path)
    print(f"[OK] Создана резервная копия: {backup_path}")
    return backup_path

def migrate_database():
    """Обновляет структуру базы данных для поддержки CASCADE удаления"""

    print("Начало миграции базы данных...")

    # Создаем резервную копию
    backup_path = backup_database()

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # SQLite не поддерживает изменение внешних ключей напрямую
        # Поэтому нужно пересоздать таблицу user_progress

        print("Пересоздание таблицы user_progress...")

        # 1. Создаем временную таблицу с новой структурой
        cursor.execute("""
            CREATE TABLE user_progress_new (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                program_id INTEGER NOT NULL,
                workout_id INTEGER NOT NULL,
                is_completed BOOLEAN DEFAULT 0,
                completed_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (program_id) REFERENCES workout_programs(id) ON DELETE CASCADE,
                FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
            )
        """)

        # 2. Копируем данные из старой таблицы
        cursor.execute("""
            INSERT INTO user_progress_new (id, user_id, program_id, workout_id, is_completed, completed_at)
            SELECT id, user_id, program_id, workout_id, is_completed, completed_at
            FROM user_progress
        """)

        # 3. Удаляем старую таблицу
        cursor.execute("DROP TABLE user_progress")

        # 4. Переименовываем новую таблицу
        cursor.execute("ALTER TABLE user_progress_new RENAME TO user_progress")

        # Сохраняем изменения
        conn.commit()

        print("[OK] Миграция успешно завершена!")
        print("[OK] Теперь можно удалять тренировки и программы без ошибок")
        print(f"[OK] Резервная копия сохранена: {backup_path}")

    except Exception as e:
        print(f"[ERROR] Ошибка при миграции: {e}")
        print(f"Восстановите базу данных из резервной копии: {backup_path}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
