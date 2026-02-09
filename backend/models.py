from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    progress = relationship("UserProgress", back_populates="user")


class WorkoutProgram(Base):
    __tablename__ = "workout_programs"

    id = Column(Integer, primary_key=True, index=True)
    difficulty = Column(String, nullable=False)
    goal = Column(String, nullable=False)
    location = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)

    workouts = relationship("Workout", back_populates="program", cascade="all, delete-orphan")
    user_progress = relationship("UserProgress", back_populates="program", cascade="all, delete-orphan")


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("workout_programs.id"), nullable=False)
    day_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)

    program = relationship("WorkoutProgram", back_populates="workouts")
    exercises = relationship("Exercise", back_populates="workout", cascade="all, delete-orphan")
    user_progress = relationship("UserProgress", back_populates="workout", cascade="all, delete-orphan")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)
    name = Column(String, nullable=False)
    sets = Column(Integer, nullable=False)
    reps = Column(String, nullable=False)
    rest_time = Column(Integer, nullable=False)
    description = Column(Text)

    workout = relationship("Workout", back_populates="exercises")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    program_id = Column(Integer, ForeignKey("workout_programs.id", ondelete="CASCADE"), nullable=False)
    workout_id = Column(Integer, ForeignKey("workouts.id", ondelete="CASCADE"), nullable=False)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="progress")
    program = relationship("WorkoutProgram", back_populates="user_progress")
    workout = relationship("Workout", back_populates="user_progress")
