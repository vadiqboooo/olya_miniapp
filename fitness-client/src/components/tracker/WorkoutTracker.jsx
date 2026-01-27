import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import Card from '../ui/Card';
import Loader from '../ui/Loader';
import DayCard from './DayCard';
import './WorkoutTracker.css';

const CURRENT_USER_ID = 1; // Заглушка ID пользователя

const WorkoutTracker = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Нужно, чтобы отследить возврат со страницы деталей
  
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Состояние для выполненных дней (хранит список ID тренировок)
  const [completedWorkouts, setCompletedWorkouts] = useState([]);

  // Функция загрузки прогресса
  const loadProgress = async () => {
    try {
      // Запрашиваем прогресс у сервера
      const response = await api.get(`/users/${CURRENT_USER_ID}/progress`);
      const progressList = response.data;
      
      // Фильтруем только те записи, которые относятся к ТЕКУЩЕЙ программе
      // (Вдруг у пользователя есть прогресс в других программах)
      const relevantProgress = progressList.filter(p => p.program_id === parseInt(programId));
      
      // Создаем массив просто из ID выполненных тренировок
      const completedIds = relevantProgress
        .filter(p => p.is_completed)
        .map(p => p.workout_id);
        
      setCompletedWorkouts(completedIds);
    } catch (err) {
      console.error("Не удалось загрузить прогресс", err);
    }
  };

  // Основная загрузка данных (тренировки + прогресс)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 1. Загружаем тренировки
        const response = await api.get(`/workouts/${programId}`);
        const data = response.data;

        if (!Array.isArray(data)) {
          console.error("Ожидается массив тренировок, но получено:", data);
          setError(data.detail || "Неверный формат данных от сервера");
          setWorkouts([]);
          return; 
        }

        const sortedWorkouts = data.sort((a, b) => a.day_number - b.day_number);
        setWorkouts(sortedWorkouts);
        
        // 2. Загружаем прогресс
        await loadProgress();
        
      } catch (err) {
        console.error("Failed to fetch workouts", err);
        const msg = err.response?.data?.detail || err.message;
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    if (programId) {
      loadData();
    }
  }, [programId]);

  // Эффект для обновления данных при возврате со страницы деталей
  useEffect(() => {
    // Если location.state существует, значит мы только что вернулись назад
    // Это хороший момент обновить прогресс
    if (location.state) {
      loadProgress();
      // Очищаем state, чтобы не зациклиться
      // navigate(location.pathname, { replace: true, state: null }); 
      // (Опционально: можно не очищать, если нужно знать, что мы вернулись)
    }
  }, [location]); // Срабатывает при каждом изменении location (навигации)

  // Вычисление прогресса
  const progress = useMemo(() => {
    if (workouts.length === 0) return 0;
    const completedCount = completedWorkouts.length;
    return Math.round((completedCount / workouts.length) * 100);
  }, [workouts, completedWorkouts]);

  const handleDayClick = (workout) => {
    navigate(`/tracker/${programId}/workout/${workout.id}`, {
      state: { workoutData: workout }
    });
  };

  if (loading) {
    return (
      <div style={{ paddingTop: '50px' }}>
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="tracker-container">
      <Card className="tracker-header">
        <h2>Ваш прогресс</h2>
        <div className="progress-stats">
          <span>Выполнено: {progress}%</span>
          <span className="progress-text-small">
            {completedWorkouts.length} из {workouts.length} дней
          </span>
        </div>
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </Card>

      <div className="days-grid">
        {workouts.map((workout) => {
          // Проверяем, есть ли ID этой тренировки в списке выполненных
          const isCompleted = completedWorkouts.includes(workout.id);

          return (
            <DayCard
              key={workout.id}
              dayNumber={workout.day_number}
              title={workout.title}
              isCompleted={isCompleted}
              isActive={false} 
              onClick={() => handleDayClick(workout)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default WorkoutTracker;