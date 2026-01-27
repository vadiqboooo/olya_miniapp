import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import './AdminForms.css';
import './AdminExercisesManage.css';

const AdminExercisesManage = () => {
  const { programId, workoutId } = useParams();
  const navigate = useNavigate();

  // Основные данные
  const [programName, setProgramName] = useState('');
  const [workoutInfo, setWorkoutInfo] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Режим редактирования (null - добавление, ID - редактирование)
  const [editingId, setEditingId] = useState(null);

  // Форма
  const [formData, setFormData] = useState({
    name: '',
    sets: '',
    reps: '',
    rest_time: '', // Время отдыха (сек)
    description: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Загрузка данных
  useEffect(() => {
      // В AdminExercisesManage.jsx внутри useEffect

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Инфо о программе
      const progRes = await api.get(`/programs/${programId}`);
      setProgramName(progRes.data.name);

      // 2. Инфо о тренировке (ЗДЕСЬ ИЗМЕНЕНИЕ)
      // БЫЛО: const workRes = await axios.get(`http://127.0.0.1:8000/workouts/${workoutId}`);
      
      // СТАЛО: Используем новый эндпоинт для получения одной тренировки
      const workRes = await api.get(`/workouts/single/${workoutId}`);
      
      const workout = workRes.data;
      
      // Так как мы запрашиваем одну запись, она не будет массивом (если backend настроен верно)
      // Но для надежности оставим проверку или просто присвоим
      setWorkoutInfo(workout);
      setExercises(workout.exercises || []);

    } catch (err) {
      console.error('Ошибка загрузки:', err);
      // Проверяем текст ошибки, чтобы дать понятный юзеру сообщение
      if (err.response?.data?.detail === "Тренировка не найдена") {
          setError('Тренировка с таким ID не существует');
      } else {
          setError('Не удалось загрузить данные');
      }
    } finally {
      setLoading(false);
    }
  };

    if (workoutId && programId) fetchData();
  }, [programId, workoutId]);

  // Обработчик ввода
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  // Валидация
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = 'Минимум 2 символа';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Максимум 100 символов';
    }

    const sets = parseInt(formData.sets);
    if (!formData.sets || isNaN(sets) || sets < 1 || sets > 10) {
      newErrors.sets = 'От 1 до 10';
    }

    if (!formData.reps.trim()) {
      newErrors.reps = 'Обязательное поле';
    }


    const rest = parseInt(formData.rest_time);
    if (!formData.rest_time || isNaN(rest) || rest < 0 || rest > 600) {
      newErrors.rest_time = 'От 0 до 600 сек';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Максимум 500 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Сохранение (Создание или Обновление)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload = {
        workout_id: parseInt(workoutId),
        name: formData.name,
        sets: parseInt(formData.sets),
        reps: formData.reps,
        rest_time: parseInt(formData.rest_time),
        description: formData.description
      };

      if (editingId) {
        // Обновление
        await api.put(`/exercises/${editingId}`, payload);
        setExercises(exercises.map(ex => 
          ex.id === editingId ? { ...payload, id: editingId } : ex
        ));
      } else {
        // Создание
        const response = await api.post('/exercises/', payload);
        setExercises([...exercises, response.data]);
      }

      // Сброс формы
      resetForm();

    } catch (err) {
      console.error('Ошибка сохранения:', err);
      alert('Не удалось сохранить упражнение');
    } finally {
      setIsSaving(false);
    }
  };

  // Удаление
  const handleDelete = async (id) => {
    if (!window.confirm('Удалить это упражнение?')) return;
    try {
      await api.delete(`/exercises/${id}`);
      setExercises(exercises.filter(ex => ex.id !== id));
      // Если редактируем это упражнение, сбрасываем форму
      if (editingId === id) resetForm();
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  // Редактирование (заполнение формы)
  const handleEdit = (exercise) => {
    setFormData({
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      rest_time: exercise.rest_time,
      description: exercise.description || ''
    });
    setEditingId(exercise.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Сброс формы
  const resetForm = () => {
    setFormData({
      name: '', sets: '', reps: '', rest_time: '', description: ''
    });
    setEditingId(null);
    setErrors({});
  };

  if (loading) return <Loader />;
  if (error) return <div className="error-message">{error}</div>;
  if (!workoutInfo) return <div>Тренировка не найдена</div>;

  return (
    <div className="admin-exercises-container">
      {/* Хедер */}
      <div className="admin-exercises-header">
        <div className="breadcrumbs">
          <button onClick={() => navigate('/admin/programs')} className="link-text">Все программы</button>
          <span> / </span>
          <button onClick={() => navigate(`/admin/programs/${programId}/days`)} className="link-text">{programName}</button>
          <span> / </span>
          <span className="current-page">День {workoutInfo.day_number}</span>
        </div>

        <div className="header-title-row">
          <h1>Управление упражнениями</h1>
          <Button variant="secondary" onClick={() => navigate(`/admin/programs/${programId}/days`)}>
            Вернуться к дням
          </Button>
        </div>
        <p className="header-subtitle">{workoutInfo.title}</p>
      </div>

      <div className="exercises-layout">
        {/* Форма (Слева или Сверху) */}
        <div className="form-column">
          <Card className="exercise-form-card">
            <h3>{editingId ? 'Редактировать упражнение' : 'Добавить новое упражнение'}</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Название упражнения *</label>
                <input 
                  type="text" name="name" value={formData.name} onChange={handleChange}
                  className={`form-input ${errors.name ? 'input-error' : ''}`}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label className="form-label">Подходы (1-10) *</label>
                  <input 
                    type="number" name="sets" value={formData.sets} onChange={handleChange}
                    className={`form-input ${errors.sets ? 'input-error' : ''}`}
                  />
                  {errors.sets && <span className="field-error">{errors.sets}</span>}
                </div>
                <div className="form-group half">
                  <label className="form-label">Повторения *</label>
                  <input 
                    type="text" name="reps" value={formData.reps} onChange={handleChange}
                    placeholder="напр. 10-12"
                    className={`form-input ${errors.reps ? 'input-error' : ''}`}
                  />
                  {errors.reps && <span className="field-error">{errors.reps}</span>}
                </div>
              </div>

              <div className="form-row">
                 
                <div className="form-group half">
                  <label className="form-label">Отдых (сек) *</label>
                  <input 
                    type="number" name="rest_time" value={formData.rest_time} onChange={handleChange}
                    className={`form-input ${errors.rest_time ? 'input-error' : ''}`}
                  />
                  {errors.rest_time && <span className="field-error">{errors.rest_time}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Описание</label>
                <textarea 
                  name="description" value={formData.description} onChange={handleChange}
                  className="form-textarea" rows={3}
                ></textarea>
                <div className="char-count">{formData.description.length} / 500</div>
              </div>

              <div className="form-actions">
                {editingId && (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Отмена
                  </Button>
                )}
                <Button type="submit" isLoading={isSaving} disabled={isSaving}>
                  {editingId ? 'Сохранить изменения' : 'Добавить упражнение'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Список (Справа или Снизу) */}
        <div className="list-column">
          <h3>Список упражнений ({exercises.length})</h3>
          
          {exercises.length === 0 ? (
            <div className="empty-state">Упражнений пока нет</div>
          ) : (
            <div className="exercise-list">
              {exercises.map((ex) => (
                <Card key={ex.id} className="exercise-card-item">
                  <div className="exercise-main">
                    
                    <div className="ex-rest">Отдых: {ex.rest_time} сек</div>
                    {ex.description && <p className="ex-desc">{ex.description}</p>}
                  </div>

                  <div className="exercise-actions">
                    <Button size="small" variant="secondary" onClick={() => handleEdit(ex)}>
                      ✎ Ред.
                    </Button>
                    <button className="delete-btn-icon" onClick={() => handleDelete(ex.id)}>
                      🗑
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminExercisesManage;