import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // <--- Добавляем useLocation
import axios from 'axios';
import ExerciseItem from './ExerciseItem';
import Loader from '../ui/Loader';
import './WorkoutDetail.css';

const WorkoutDetail = () => {
  const { workoutId } = useParams(); 
  const navigate = useNavigate();
  const location = useLocation(); // <--- Хук для доступа к переданному состоянию

  // Сразу пробуем получить данные из состояния (переданы из Tracker)
  const initialData = location.state?.workoutData;

  const [workout, setWorkout] = useState(initialData || null);
  const [exercises, setExercises] = useState(initialData?.exercises || []);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialData); // Если данных нет, показываем лоадер
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const CURRENT_USER_ID = 1;

  useEffect(() => {
    // Если данные пришли из Tracker, дополнительные запросы не нужны, 
    // кроме проверки статуса выполнения (прогресса).
    if (initialData) {
      checkProgressStatus();
      return;
    }

    // Если данных нет (например, прямой переход по ссылке или F5),
    // пробуем загрузить с сервера (fallback логика)
    fetchWorkoutDetails();
  }, [workoutId]);

  const checkProgressStatus = async () => {
    try {
      const progressRes = await axios.get(`http://127.0.0.1:8000/users/${CURRENT_USER_ID}/progress`);
      const progressList = progressRes.data;
      const existingProgress = progressList.find(p => p.workout_id === parseInt(workoutId));
      
      if (existingProgress && existingProgress.is_completed) {
        setIsCompleted(true);
      } else {
        setIsCompleted(false);
      }
    } catch (err) {
      console.error("Не удалось загрузить статус:", err);
    }
  };

  // Fallback функция загрузки с сервера (используем ваш /exercises метод)
  const fetchWorkoutDetails = async () => {
    try {
      setIsLoading(true);
      
      // 1. Загружаем упражнения
      const exResponse = await axios.get(`http://127.0.0.1:8000/workouts/${workoutId}/exercises`);
      const exercisesData = exResponse.data;
      
      if (Array.isArray(exercisesData)) {
          setExercises(exercisesData);
      } else {
          setExercises([]);
      }

      // 2. Загружаем инфо о тренировке
      const workoutResponse = await axios.get(`http://127.0.0.1:8000/workouts/${workoutId}`);
      let workoutData = workoutResponse.data;

      if (Array.isArray(workoutData)) {
           workoutData = workoutData.find(w => w.id === parseInt(workoutId));
      }

      if (!workoutData) {
           throw new Error("Не удалось загрузить данные тренировки");
      }
      
      setWorkout(workoutData);
      checkProgressStatus();

    } catch (err) {
      console.error(err);
      setError(err.message || 'Не удалось загрузить тренировку');
    } finally {
      setIsLoading(false);
    }
  };

    const handleToggleComplete = async () => {
    setIsSaving(true);
    
    // Вычисляем новый статус (инвертируем текущий)
    const newStatus = !isCompleted;

    try {
      // 1. Загружаем текущий прогресс, чтобы найти ID записи
      const progressRes = await axios.get(`http://127.0.0.1:8000/users/${CURRENT_USER_ID}/progress`);
      const progressList = progressRes.data;
      const existingProgress = progressList.find(p => p.workout_id === parseInt(workoutId));

      if (existingProgress) {
        // 2. Если запись есть - обновляем её (теперь можно и True, и False)
        await axios.patch(`http://127.0.0.1:8000/progress/${existingProgress.id}/complete`, {
            is_completed: newStatus // <--- Отправляем новое значение
        });
        
        // Обновляем локальный стейт
        setIsCompleted(newStatus);

      } else {
        // 3. Если записи нет - создаем новую
        // ВАЖНО: Мы создаем запись с is_completed: false, а затем сразу обновляем её
        // Это нужно, чтобы получить ID для обновления. 
        // Если ваш POST на бэкенде умеет принимать is_completed: true сразу, можно упростить.
        
        const newProgressData = {
            user_id: CURRENT_USER_ID,
            program_id: workout.program_id,
            workout_id: parseInt(workoutId),
            is_completed: false // Создаем "пустую" запись
        };
        
        const postRes = await axios.post(`http://127.0.0.1:8000/progress/`, newProgressData);
        const createdId = postRes.data.id;

        // Сразу же ставим нужный статус (создание прошло успешно)
        await axios.patch(`http://127.0.0.1:8000/progress/${createdId}/complete`, {
            is_completed: newStatus
        });
        
        // Обновляем локальный стейт
        setIsCompleted(newStatus);
      }

    } catch (err) {
      console.error('Ошибка сохранения:', err);
      alert('Ошибка: ' + (err.response?.data?.detail || err.message));
      // В случае ошибки можно вернуть стейт обратно, если нужно
      // setIsCompleted(!newStatus); 
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <div className="error-message">{error}</div>;
  if (!workout) return <div>Тренировка не найдена. <button onClick={() => navigate(-1)}>Назад</button></div>;

  return (
    <div className="workout-detail-container">
      <div className="detail-header">
        <button onClick={() => navigate(-1)} className="back-btn">← Назад</button>
        <div className="header-title">
          <span className="day-badge">День {workout.day_number}</span>
          <h2>{workout.title}</h2>
        </div>
      </div>

      <div className="exercises-list">
        {exercises.length > 0 ? (
          exercises.map((ex) => (
            <ExerciseItem
              key={ex.id}
              name={ex.name}
              sets={ex.sets}
              reps={ex.reps}
              rest_time={ex.rest_time}
              description={ex.description}
            />
          ))
        ) : (
          <p className="empty-state">Упражнения еще не добавлены.</p>
        )}
      </div>

      <div className="detail-footer">
        <div className="completion-card">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={handleToggleComplete}
              disabled={isSaving}
            />
            <span className="checkmark"></span>
            <span className="label-text">
              {isCompleted ? 'Тренировка выполнена!' : 'Отметить как выполненное'}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default WorkoutDetail;