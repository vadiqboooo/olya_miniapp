from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas


def get_user_by_telegram_id(db: Session, telegram_id: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.telegram_id == telegram_id).first()


def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    db_user = models.User(telegram_id=user.telegram_id)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_programs(db: Session, skip: int = 0, limit: int = 100) -> List[models.WorkoutProgram]:
    return db.query(models.WorkoutProgram).offset(skip).limit(limit).all()


def get_program(db: Session, program_id: int) -> Optional[models.WorkoutProgram]:
    return db.query(models.WorkoutProgram).filter(models.WorkoutProgram.id == program_id).first()


def create_program(db: Session, program: schemas.WorkoutProgramCreate) -> models.WorkoutProgram:
    db_program = models.WorkoutProgram(**program.dict())
    db.add(db_program)
    db.commit()
    db.refresh(db_program)
    return db_program


def get_workout(db: Session, workout_id: int) -> Optional[models.Workout]:
    return db.query(models.Workout).filter(models.Workout.id == workout_id).first()


def get_program_workouts(db: Session, program_id: int) -> List[models.Workout]:
    return db.query(models.Workout).filter(models.Workout.program_id == program_id).order_by(models.Workout.day_number).all()


def create_workout(db: Session, workout: schemas.WorkoutCreate) -> models.Workout:
    db_workout = models.Workout(**workout.dict())
    db.add(db_workout)
    db.commit()
    db.refresh(db_workout)
    return db_workout


def get_exercise(db: Session, exercise_id: int) -> Optional[models.Exercise]:
    return db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()


def get_workout_exercises(db: Session, workout_id: int) -> List[models.Exercise]:
    return db.query(models.Exercise).filter(models.Exercise.workout_id == workout_id).all()


def create_exercise(db: Session, exercise: schemas.ExerciseCreate) -> models.Exercise:
    db_exercise = models.Exercise(**exercise.dict())
    db.add(db_exercise)
    db.commit()
    db.refresh(db_exercise)
    return db_exercise


def get_user_progress(db: Session, user_id: int) -> List[models.UserProgress]:
    return db.query(models.UserProgress).filter(models.UserProgress.user_id == user_id).all()


def get_user_program_progress(db: Session, user_id: int, program_id: int) -> List[models.UserProgress]:
    return db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id,
        models.UserProgress.program_id == program_id
    ).all()


def create_progress(db: Session, progress: schemas.UserProgressCreate) -> models.UserProgress:
    db_progress = models.UserProgress(**progress.dict())
    db.add(db_progress)
    db.commit()
    db.refresh(db_progress)
    return db_progress


def get_progress(db: Session, progress_id: int) -> Optional[models.UserProgress]:
    return db.query(models.UserProgress).filter(models.UserProgress.id == progress_id).first()


def update_progress_completion(db: Session, progress_id: int, is_completed: bool) -> Optional[models.UserProgress]:
    from datetime import datetime
    db_progress = get_progress(db, progress_id)
    if db_progress:
        db_progress.is_completed = is_completed
        if is_completed:
            db_progress.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(db_progress)
    return db_progress
