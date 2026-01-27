from database import engine, SessionLocal, Base
import models

def init_database():
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

    db = SessionLocal()
    try:
        existing_programs = db.query(models.WorkoutProgram).count()
        if existing_programs > 0:
            print("Database already has data. Skipping initialization.")
            return

        program = models.WorkoutProgram(
            difficulty="Начальный",
            goal="Похудение",
            location="Дома",
            name="Программа для начинающих",
            description="Базовая программа тренировок для похудения в домашних условиях"
        )
        db.add(program)
        db.flush()

        workout1 = models.Workout(
            program_id=program.id,
            day_number=1,
            title="День 1: Кардио и базовые упражнения",
            description="Разминка и базовые упражнения для всего тела"
        )
        db.add(workout1)
        db.flush()

        exercises = [
            models.Exercise(
                workout_id=workout1.id,
                name="Прыжки на месте",
                sets=3,
                reps="30 сек",
                rest_time=30,
                description="Интенсивные прыжки для разогрева"
            ),
            models.Exercise(
                workout_id=workout1.id,
                name="Отжимания от пола",
                sets=3,
                reps="10-15",
                rest_time=60,
                description="Классические отжимания, можно с колен"
            ),
            models.Exercise(
                workout_id=workout1.id,
                name="Приседания",
                sets=3,
                reps="15-20",
                rest_time=60,
                description="Глубокие приседания с собственным весом"
            ),
            models.Exercise(
                workout_id=workout1.id,
                name="Планка",
                sets=3,
                reps="30 сек",
                rest_time=45,
                description="Статическая планка на предплечьях"
            )
        ]

        for exercise in exercises:
            db.add(exercise)

        workout2 = models.Workout(
            program_id=program.id,
            day_number=2,
            title="День 2: Отдых или легкая активность",
            description="День восстановления"
        )
        db.add(workout2)
        db.flush()

        rest_exercise = models.Exercise(
            workout_id=workout2.id,
            name="Растяжка",
            sets=1,
            reps="15 мин",
            rest_time=0,
            description="Легкая растяжка всех групп мышц"
        )
        db.add(rest_exercise)

        workout3 = models.Workout(
            program_id=program.id,
            day_number=3,
            title="День 3: Силовая тренировка",
            description="Упражнения на укрепление мышц"
        )
        db.add(workout3)
        db.flush()

        strength_exercises = [
            models.Exercise(
                workout_id=workout3.id,
                name="Выпады",
                sets=3,
                reps="12 на каждую ногу",
                rest_time=60,
                description="Выпады вперед, чередуя ноги"
            ),
            models.Exercise(
                workout_id=workout3.id,
                name="Берпи",
                sets=3,
                reps="8-10",
                rest_time=90,
                description="Комплексное упражнение на все тело"
            ),
            models.Exercise(
                workout_id=workout3.id,
                name="Скалолаз",
                sets=3,
                reps="20",
                rest_time=60,
                description="Динамическое упражнение на пресс"
            )
        ]

        for exercise in strength_exercises:
            db.add(exercise)

        db.commit()
        print("Sample data added successfully!")
        print(f"Created program: {program.name}")
        print(f"Created {db.query(models.Workout).count()} workouts")
        print(f"Created {db.query(models.Exercise).count()} exercises")

    except Exception as e:
        db.rollback()
        print(f"Error initializing database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
