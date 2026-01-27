import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import './AdminForms.css'; // Будем использовать общие стили для админки

const AdminProgramCreate = () => {
  const navigate = useNavigate();
  
  // Состояние формы
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: '',
    goal: '',
    location: ''
  });

  // Состояния для UI
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Опции для селектов (используем те же значения, что в OnboardingForm)
  const options = {
    difficulty: [
      { value: 'beginner', label: 'Начальный' },
      { value: 'intermediate', label: 'Средний' },
      { value: 'advanced', label: 'Продвинутый' }
    ],
    goal: [
      { value: 'weight_loss', label: 'Похудение' },
      { value: 'muscle_gain', label: 'Набор массы' },
      { value: 'endurance', label: 'Выносливость' },
      { value: 'flexibility', label: 'Гибкость' }
    ],
    location: [
      { value: 'home', label: 'Дома' },
      { value: 'gym', label: 'Зал' },
      { value: 'street', label: 'Улица' }
    ]
  };

  // Обработчик изменений в инпутах
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Сбрасываем ошибку конкретного поля при вводе
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    setServerError('');
  };

  // Валидация формы
  const validate = () => {
    const newErrors = {};

    // Валидация названия
    if (!formData.name.trim()) {
      newErrors.name = 'Название программы обязательно';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Минимум 3 символа';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Максимум 100 символов';
    }

    // Валидация описания
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Описание не должно превышать 1000 символов';
    }

    // Валидация селектов
    if (!formData.difficulty) newErrors.difficulty = 'Выберите уровень сложности';
    if (!formData.goal) newErrors.goal = 'Выберите цель тренировок';
    if (!formData.location) newErrors.location = 'Выберите место занятий';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      // Отправка данных на бэкенд
      const response = await api.post('/programs', {
        name: formData.name,
        description: formData.description || '',
        difficulty: formData.difficulty,
        goal: formData.goal,
        location: formData.location
      });

      // При успехе получаем созданный объект с ID
      const newProgram = response.data;
      
      // Сохраняем ID в localStorage (опционально)
      localStorage.setItem('admin_program_id', newProgram.id);

      // Переход на страницу добавления дней
      navigate(`/admin/programs/${newProgram.id}/days`);

    } catch (err) {
      console.error('Ошибка создания программы:', err);
      const msg = err.response?.data?.detail || 'Не удалось создать программу. Попробуйте позже.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-form-container">
      <Card className="admin-card">
        <div className="admin-header">
          <h2>Создание новой программы</h2>
        </div>

        {serverError && <div className="error-message server-error">{serverError}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          
          {/* Название */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Название программы <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              placeholder="Например: Йога для спины"
              maxLength={101}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          {/* Описание */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">Описание программы</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`form-textarea ${errors.description ? 'input-error' : ''}`}
              rows={4}
              placeholder="Подробное описание программы и ожидаемых результатов..."
              maxLength={1001}
            />
            <div className="char-count">
              {formData.description.length} / 1000
            </div>
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          {/* Сложность */}
          <div className="form-group">
            <label htmlFor="difficulty" className="form-label">
              Уровень сложности <span className="required">*</span>
            </label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className={`form-select ${errors.difficulty ? 'input-error' : ''}`}
            >
              <option value="">Выберите уровень...</option>
              {options.difficulty.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.difficulty && <span className="field-error">{errors.difficulty}</span>}
          </div>

          {/* Цель */}
          <div className="form-group">
            <label htmlFor="goal" className="form-label">
              Цель тренировок <span className="required">*</span>
            </label>
            <select
              id="goal"
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              className={`form-select ${errors.goal ? 'input-error' : ''}`}
            >
              <option value="">Выберите цель...</option>
              {options.goal.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.goal && <span className="field-error">{errors.goal}</span>}
          </div>

          {/* Место */}
          <div className="form-group">
            <label htmlFor="location" className="form-label">
              Место занятий <span className="required">*</span>
            </label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`form-select ${errors.location ? 'input-error' : ''}`}
            >
              <option value="">Выберите место...</option>
              {options.location.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.location && <span className="field-error">{errors.location}</span>}
          </div>

          {/* Кнопки действий */}
          <div className="form-actions">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => navigate('/admin/programs')}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Создать программу
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AdminProgramCreate;