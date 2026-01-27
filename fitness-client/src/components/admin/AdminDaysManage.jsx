import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import './AdminForms.css'; // Используем стили из предыдущего шага
import './AdminDaysManage.css';

const AdminDaysManage = () => {
  const { programId } = useParams();
  const navigate = useNavigate();

  // Состояния
  const [programInfo, setProgramInfo] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Форма добавления дня
  const [newDayTitle, setNewDayTitle] = useState('');
  const [newDayDesc, setNewDayDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Загрузка данных программы и дней
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Загружаем информацию о программе (чтобы показать хедер)
        // Предполагается эндпоинт GET /programs/{id}
        const progRes = await api.get(`/programs/${programId}`);
        setProgramInfo(progRes.data);

        // 2. Загружаем список дней (тренировок)
        const workRes = await api.get(`/workouts/${programId}`);
        
        // Сортируем по номеру дня
        const sortedWorkouts = Array.isArray(workRes.data) 
          ? workRes.data.sort((a, b) => a.day_number - b.day_number)
          : [];
          
        setWorkouts(sortedWorkouts);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError('Не удалось загрузить данные программы');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [programId]);

  // Создание нового дня
  const handleAddDay = async (navigateToExercises = false) => {
    if (!newDayTitle.trim()) {
      alert('Введите название тренировки');
      return;
    }

    setIsAdding(true);
    try {
      // Вычисляем следующий номер дня (max + 1)
      const nextDayNumber = workouts.length > 0 ? Math.max(...workouts.map(w => w.day_number)) + 1 : 1;

      const response = await api.post('/workouts', {
        program_id: parseInt(programId),
        day_number: nextDayNumber,
        title: newDayTitle,
        description: newDayDesc
      });

      const newWorkout = response.data;

      // Обновляем локальный список
      setWorkouts([...workouts, newWorkout].sort((a, b) => a.day_number - b.day_number));

      // Очищаем форму
      setNewDayTitle('');
      setNewDayDesc('');

      // Навигация, если нужно
      if (navigateToExercises) {
        navigate(`/admin/programs/${programId}/days/${newWorkout.id}/exercises`);
      }

    } catch (err) {
      console.error('Ошибка добавления дня:', err);
      alert('Не удалось добавить день');
    } finally {
      setIsAdding(false);
    }
  };

  // Удаление дня
  const handleDeleteDay = async (workoutId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот день и все упражнения в нем?')) {
      return;
    }

    try {
      await api.delete(`/workouts/${workoutId}`);
      // Удаляем из локального стейта
      setWorkouts(workouts.filter(w => w.id !== workoutId));
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить день');
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="error-message">{error}</div>;
  if (!programInfo) return <div>Программа не найдена</div>;

  return (
    <div className="admin-days-container">
      {/* Хедер страницы */}
      <div className="admin-page-header">
        <div className="header-info">
          <button onClick={() => navigate('/admin/programs')} className="back-link">
            ← К списку программ
          </button>
          <h1>{programInfo.name}</h1>
          <div className="program-tags">
            <span className="tag">{programInfo.difficulty}</span>
            <span className="tag">{programInfo.goal}</span>
            <span className="tag">{programInfo.location}</span>
          </div>
          <p className="program-desc-short">{programInfo.description}</p>
        </div>
        <Button onClick={() => navigate('/admin/programs')}>
          Завершить создание
        </Button>
      </div>

      <div className="admin-content-split">
        {/* Список дней */}
        <div className="days-list-section">
          <h3>Созданные дни ({workouts.length})</h3>
          
          {workouts.length === 0 ? (
            <div className="empty-state-box">Пока не добавлено ни одного дня</div>
          ) : (
            <div className="days-grid">
              {workouts.map((workout) => (
                <Card key={workout.id} className="day-card-admin">
                  <div className="day-card-header">
                    <span className="day-number-badge">День {workout.day_number}</span>
                    <span className="exercises-count">
                      {workout.exercises?.length || 0} упр.
                    </span>
                  </div>
                  
                  <h4 className="day-title">{workout.title}</h4>
                  
                  <div className="day-actions">
                    <Button 
                      variant="secondary" 
                      size="small"
                      onClick={() => navigate(`/admin/programs/${programId}/days/${workout.id}/exercises`)}
                    >
                      Редактировать упражнения
                    </Button>
                    
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteDay(workout.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Форма добавления */}
        <div className="add-day-section">
          <Card className="add-day-card">
            <h3>Добавить новый день</h3>
            
            <div className="form-group">
              <label className="form-label">Название тренировки *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Например: Силовая тренировка"
                value={newDayTitle}
                onChange={(e) => setNewDayTitle(e.target.value)}
                disabled={isAdding}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Описание (опционально)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Краткое описание..."
                value={newDayDesc}
                onChange={(e) => setNewDayDesc(e.target.value)}
                disabled={isAdding}
              />
            </div>

            <div className="form-actions-vertical">
              <Button 
                fullWidth 
                onClick={() => handleAddDay(false)}
                disabled={isAdding || !newDayTitle.trim()}
              >
                Добавить день
              </Button>
              
              <Button 
                variant="secondary" 
                fullWidth 
                onClick={() => handleAddDay(true)}
                disabled={isAdding || !newDayTitle.trim()}
              >
                Добавить и перейти к упражнениям
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDaysManage;