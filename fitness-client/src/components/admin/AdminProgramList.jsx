import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import './AdminForms.css';
import './AdminProgramList.css';

const AdminProgramList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Состояния данных ---
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Состояния фильтров (синхронизация с URL) ---
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [goal, setGoal] = useState(searchParams.get('goal') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');

  // --- Модальное окно ---
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, program: null });

  // --- Опции фильтров ---
  const filterOptions = {
    difficulty: ['Начальный', 'Средний', 'Продвинутый'],
    goal: ['Похудение', 'Набор массы', 'Выносливость', 'Гибкость'],
    location: ['Дома', 'Зал', 'Улица']
  };

  // --- Загрузка данных ---
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      try {
        // Собираем параметры для запроса
        const params = {};
        if (search) params.search = search;
        if (difficulty) params.difficulty = difficulty;
        if (goal) params.goal = goal;
        if (location) params.location = location;

        const response = await axios.get('http://127.0.0.1:8000/programs/', { params });
        
        // Предполагаем, что бэкенд возвращает массив
        let data = response.data;
        if (!Array.isArray(data)) data = [];

        setPrograms(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Не удалось загрузить программы');
      } finally {
        setLoading(false);
      }
    };

    // Небольшая задержка для поиска (debounce эффект можно сделать через setTimeout, но здесь упростим)
    // Для реального debounce лучше вынести в отдельную логику
    const timer = setTimeout(fetchPrograms, 300); 
    
    return () => clearTimeout(timer);
  }, [search, difficulty, goal, location]);

  // --- Обработчики фильтров ---
  const updateFilters = (key, value) => {
    // Обновляем локальный стейт
    switch(key) {
      case 'search': setSearch(value); break;
      case 'difficulty': setDifficulty(value); break;
      case 'goal': setGoal(value); break;
      case 'location': setLocation(value); break;
    }

    // Обновляем URL
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    setSearch('');
    setDifficulty('');
    setGoal('');
    setLocation('');
    setSearchParams({});
  };

  // --- Удаление программы ---
  const handleDeleteClick = (program) => {
    setDeleteModal({ isOpen: true, program });
  };

  const confirmDelete = async () => {
    if (!deleteModal.program) return;
    
    try {
      await axios.delete(`http://127.0.0.1:8000/programs/${deleteModal.program.id}`);
      setPrograms(programs.filter(p => p.id !== deleteModal.program.id));
      setDeleteModal({ isOpen: false, program: null });
    } catch (err) {
      alert('Ошибка при удалении программы');
    }
  };

  // --- Вычисляемые значения для статистики ---
  const getStats = (program) => {
    const daysCount = program.workouts ? program.workouts.length : 0;
    const exCount = program.workouts 
      ? program.workouts.reduce((acc, day) => acc + (day.exercises ? day.exercises.length : 0), 0)
      : 0;
    return `${daysCount} дн. • ${exCount} упр.`;
  };

  if (loading) return <Loader />;

  return (
    <div className="admin-programs-container">
      {/* Хедер */}
      <div className="admin-page-header">
        <h1>Программы тренировок</h1>
        <Button onClick={() => navigate('/admin/programs/create')}>
          + Создать программу
        </Button>
      </div>

      {/* Фильтры и Поиск */}
      <Card className="filters-card">
        <div className="filters-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => updateFilters('search', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="selects-row">
            <select 
              value={difficulty} 
              onChange={(e) => updateFilters('difficulty', e.target.value)}
              className="form-select"
            >
              <option value="">Все уровни</option>
              {filterOptions.difficulty.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            <select 
              value={goal} 
              onChange={(e) => updateFilters('goal', e.target.value)}
              className="form-select"
            >
              <option value="">Все цели</option>
              {filterOptions.goal.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            <select 
              value={location} 
              onChange={(e) => updateFilters('location', e.target.value)}
              className="form-select"
            >
              <option value="">Все места</option>
              {filterOptions.location.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {(search || difficulty || goal || location) && (
          <div className="filters-actions">
            <button onClick={resetFilters} className="reset-filters-btn">
              Сбросить фильтры
            </button>
          </div>
        )}
      </Card>

      {/* Список программ */}
      {error && <div className="error-message server-error">{error}</div>}

      {programs.length === 0 ? (
        <div className="empty-state-large">
          <h3>
            {(search || difficulty || goal || location) 
              ? "По заданным фильтрам ничего не найдено" 
              : "Программы не найдены"}
          </h3>
          <p>
            {(search || difficulty || goal || location) 
              ? "Попробуйте изменить параметры поиска" 
              : "Создайте свою первую программу!"}
          </p>
          {!(search || difficulty || goal || location) && (
            <Button onClick={() => navigate('/admin/programs/create')}>
              Создать программу
            </Button>
          )}
        </div>
      ) : (
        <div className="programs-grid">
          {programs.map((program) => (
            <Card key={program.id} className="program-card-admin">
              <div className="card-header">
                <div className="badges">
                  <span className="tag">{program.difficulty}</span>
                  <span className="tag">{program.goal}</span>
                  <span className="tag">{program.location}</span>
                </div>
              </div>
              
              <h3 className="card-title">{program.name}</h3>
              
              <p className="card-desc">
                {program.description 
                  ? (program.description.length > 100 
                      ? program.description.substring(0, 100) + '...' 
                      : program.description)
                  : 'Нет описания'}
              </p>

              <div className="card-stats">
                {getStats(program)}
              </div>

              <div className="card-actions">
                <Button 
                  variant="secondary" 
                  size="small"
                  onClick={() => navigate(`/admin/programs/${program.id}/days`)}
                >
                  Управление днями
                </Button>
                
                <button 
                  className="edit-btn" 
                  onClick={() => {/* TODO: Роут edit */}}
                >
                  Редактировать
                </button>
                
                <button 
                  className="delete-btn-icon" 
                  onClick={() => handleDeleteClick(program)}
                >
                  🗑
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ isOpen: false, program: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Удалить программу?</h2>
            <p>
              Вы уверены, что хотите удалить программу <strong>"{deleteModal.program?.name}"</strong>?<br />
              Это действие нельзя отменить. Будут удалены все дни и упражнения.
            </p>
            <div className="modal-actions">
              <Button 
                variant="secondary" 
                onClick={() => setDeleteModal({ isOpen: false, program: null })}
              >
                Отмена
              </Button>
              <Button 
                variant="danger" 
                onClick={confirmDelete}
              >
                Удалить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProgramList;