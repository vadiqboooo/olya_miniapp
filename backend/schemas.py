from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ExerciseBase(BaseModel):
    name: str
    sets: int
    reps: str
    rest_time: int
    description: Optional[str] = None


class ExerciseCreate(ExerciseBase):
    workout_id: int


class Exercise(ExerciseBase):
    id: int
    workout_id: int

    class Config:
        from_attributes = True


class WorkoutBase(BaseModel):
    program_id: int  # <--- ДОБАВЬТЕ ЭТО, если его нет
    day_number: int
    title: str
    description: Optional[str] = None


class WorkoutCreate(BaseModel):
    program_id: int
    day_number: int
    title: str
    description: str | None = None

class WorkoutProgramUpdate(BaseModel):
    name: str
    description: str | None = None
    difficulty: str
    goal: str
    location: str

class Workout(WorkoutBase):
    id: int
    program_id: int
    exercises: List[Exercise] = []

    class Config:
        from_attributes = True


class WorkoutProgramBase(BaseModel):
    difficulty: str
    goal: str
    location: str
    name: str
    description: Optional[str] = None


class WorkoutProgramCreate(WorkoutProgramBase):
    pass


class WorkoutProgram(WorkoutProgramBase):
    id: int
    workouts: List[Workout] = []

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    telegram_id: str


class UserCreate(UserBase):
    pass


class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserProgressBase(BaseModel):
    user_id: int
    program_id: int
    workout_id: int
    is_completed: bool = False


class UserProgressCreate(UserProgressBase):
    pass

class CompletionStatus(BaseModel):
    is_completed: bool


class UserProgress(UserProgressBase):
    id: int
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
