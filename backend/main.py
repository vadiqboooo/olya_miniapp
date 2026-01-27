from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from database import engine, get_db, Base
import models
import schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Workout Program API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    # Список origins (источников), которым разрешено делать запросы.
    # Для разработки указываем адрес нашего React-приложения.
    # Если вы деплоите фронтенд на Vercel/Netlify, добавьте их URL сюда.
    allow_origins=["*"],
    # Разрешаем отправлять cookies (если планируете использовать авторизацию через куки)
    allow_credentials=True,
    # Разрешаем использование любых HTTP методов (GET, POST, PUT, DELETE и т.д.)
    allow_methods=["*"],
    # Разрешаем отправлять любые заголовки
    allow_headers=["*"],
)



@app.get("/")
def read_root():
    return {"message": "Workout Program API", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.telegram_id == user.telegram_id).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User already registered")

    new_user = models.User(telegram_id=user.telegram_id)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.get("/users/{telegram_id}", response_model=schemas.User)
def get_user(telegram_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.get("/programs", response_model=List[schemas.WorkoutProgram])
def get_programs(
    difficulty: Optional[str] = Query(None, description="Filter by difficulty level"),
    goal: Optional[str] = Query(None, description="Filter by goal"),
    location: Optional[str] = Query(None, description="Filter by location"),
    db: Session = Depends(get_db)
):
    query = db.query(models.WorkoutProgram)

    if difficulty:
        query = query.filter(models.WorkoutProgram.difficulty == difficulty)
    if goal:
        query = query.filter(models.WorkoutProgram.goal == goal)
    if location:
        query = query.filter(models.WorkoutProgram.location == location)

    programs = query.all()
    return programs

@app.put("/programs/{program_id}", response_model=schemas.WorkoutProgram)
def update_program(program_id: int, program_data: schemas.WorkoutProgramUpdate, db: Session = Depends(get_db)):
    """
    Обновляет данные программы (название, описание, параметры).
    """
    # Находим программу
    db_program = db.query(models.WorkoutProgram).filter(models.WorkoutProgram.id == program_id).first()
    if not db_program:
        raise HTTPException(status_code=404, detail="Программа не найдена")

    # Обновляем поля
    db_program.name = program_data.name
    if program_data.description is not None:
        db_program.description = program_data.description
    db_program.difficulty = program_data.difficulty
    db_program.goal = program_data.goal
    db_program.location = program_data.location

    db.commit()
    db.refresh(db_program)
    return db_program


@app.delete("/programs/{program_id}")
def delete_program(program_id: int, db: Session = Depends(get_db)):
    """
    Удаляет программу.
    """
    db_program = db.query(models.WorkoutProgram).filter(models.WorkoutProgram.id == program_id).first()
    if not db_program:
        raise HTTPException(status_code=404, detail="Программа не найдена")

    # Проверка: если в Workout есть ссылка на program_id, удаление программы может вызвать ошибку Foreign Key,
    # если не настроен CASCADE.
    # Мы предполагаем, что cascade настроен, либо удаляем вручную.

    try:
        db.delete(db_program)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Невозможно удалить программу, так как есть связанные записи. Удалите дни или настройте cascade."
        )

    return {"message": "Программа успешно удалена"}

@app.get("/programs/{program_id}", response_model=schemas.WorkoutProgram)
def get_program(program_id: int, db: Session = Depends(get_db)):
    program = db.query(models.WorkoutProgram).filter(models.WorkoutProgram.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


@app.post("/programs", response_model=schemas.WorkoutProgram)
def create_program(program: schemas.WorkoutProgramCreate, db: Session = Depends(get_db)):
    new_program = models.WorkoutProgram(**program.dict())
    db.add(new_program)
    db.commit()
    db.refresh(new_program)
    return new_program


@app.get("/programs/{program_id}/workouts", response_model=List[schemas.Workout])
def get_program_workouts(program_id: int, db: Session = Depends(get_db)):
    program = db.query(models.WorkoutProgram).filter(models.WorkoutProgram.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program.workouts

@app.get("/workouts/single/{workout_id}", response_model=schemas.Workout)
def get_single_workout(workout_id: int, db: Session = Depends(get_db)):
    """
    Получает одну тренировку по её ID для админки.
    """
    workout = db.query(models.Workout).filter(models.Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Тренировка не найдена")
    return workout

@app.get("/workouts/{program_id}", response_model=List[schemas.Workout])
def get_workouts_by_program(program_id: int, db: Session = Depends(get_db)):
    # Явно ищем все записи, где program_id совпадает с аргументом
    workouts = db.query(models.Workout).filter(models.Workout.program_id == program_id).all()
    return workouts

@app.post("/workouts", response_model=schemas.Workout)
def create_workout(workout: schemas.WorkoutCreate, db: Session = Depends(get_db)):
    """
    Создает новый день в программе.
    """
    # Проверка существования программы
    program = db.query(models.WorkoutProgram).filter(models.WorkoutProgram.id == workout.program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Программа не найдена")

    new_workout = models.Workout(
        program_id=workout.program_id,
        day_number=workout.day_number,
        title=workout.title,
        description=workout.description
    )
    db.add(new_workout)
    db.commit()
    db.refresh(new_workout)
    return new_workout

@app.delete("/workouts/{workout_id}")
def delete_workout(workout_id: int, db: Session = Depends(get_db)):
    workout = db.query(models.Workout).filter(models.Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Тренировка не найдена")
    
    # Удаление (упражнения удалятся каскадно автоматически)
    db.delete(workout)
    db.commit()
    return {"message": "Тренировка успешно удалена"}


@app.get("/workouts/{workout_id}/exercises", response_model=List[schemas.Exercise])
def get_workout_exercises(workout_id: int, db: Session = Depends(get_db)):
    workout = db.query(models.Workout).filter(models.Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout.exercises


@app.post("/progress", response_model=schemas.UserProgress)
def create_progress(progress: schemas.UserProgressCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == progress.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    program = db.query(models.WorkoutProgram).filter(models.WorkoutProgram.id == progress.program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    workout = db.query(models.Workout).filter(models.Workout.id == progress.workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    new_progress = models.UserProgress(**progress.dict())
    db.add(new_progress)
    db.commit()
    db.refresh(new_progress)
    return new_progress

@app.post("/exercises", response_model=schemas.Exercise)
def create_exercise(exercise: schemas.ExerciseCreate, db: Session = Depends(get_db)):
    """
    Создает новое упражнение.
    """
    # Проверка существования тренировки
    workout = db.query(models.Workout).filter(models.Workout.id == exercise.workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Тренировка не найдена")

    new_exercise = models.Exercise(
        workout_id=exercise.workout_id,
        name=exercise.name,
        sets=exercise.sets,
        reps=exercise.reps,
        rest_time=exercise.rest_time,
        description=exercise.description
    )
    db.add(new_exercise)
    db.commit()
    db.refresh(new_exercise)
    return new_exercise

@app.put("/exercises/{exercise_id}", response_model=schemas.Exercise)
def update_exercise(exercise_id: int, exercise: schemas.ExerciseCreate, db: Session = Depends(get_db)):
    """
    Обновляет существующее упражнение.
    """
    db_exercise = db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
    if not db_exercise:
        raise HTTPException(status_code=404, detail="Упражнение не найдено")

    # Обновляем поля
    db_exercise.name = exercise.name
    db_exercise.sets = exercise.sets
    db_exercise.reps = exercise.reps
    db_exercise.rest_time = exercise.rest_time
    db_exercise.description = exercise.description

    db.commit()
    db.refresh(db_exercise)
    return db_exercise

@app.delete("/exercises/{exercise_id}")
def delete_exercise(exercise_id: int, db: Session = Depends(get_db)):
    exercise = db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Упражнение не найдено")
    
    db.delete(exercise)
    db.commit()
    return {"message": "Упражнение успешно удалено"}

@app.patch("/progress/{progress_id}/complete")
def complete_workout(progress_id: int,  status: schemas.CompletionStatus, db: Session = Depends(get_db)):
    progress = db.query(models.UserProgress).filter(models.UserProgress.id == progress_id).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")

    # Обновляем статус на то, что пришло с фронтенда
    progress.is_completed = status.is_completed
    
    # Если ставим True - записываем время, если False - убираем
    if status.is_completed:
        progress.completed_at = datetime.utcnow()
    else:
        progress.completed_at = None
    db.commit()
    db.refresh(progress)
    return progress


@app.get("/users/{user_id}/progress", response_model=List[schemas.UserProgress])
def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    progress = db.query(models.UserProgress).filter(models.UserProgress.user_id == user_id).all()
    return progress
