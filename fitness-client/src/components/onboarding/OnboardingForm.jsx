import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { matchProgram } from '../services/api';
import './OnboardingForm.css';

// Константы для выбора
const DIFFICULTIES = [
  { id: 'beginner', label: 'Начальный', icon: '🌱' },
  { id: 'intermediate', label: 'Средний', icon: '🔥' },
  { id: 'advanced', label: 'Продвинутый', icon: '💪' },
];

const GOALS = [
  { id: 'weight_loss', label: 'Похудение', icon: '⚖️' },
  { id: 'muscle_gain', label: 'Набор массы', icon: '🏋️' },
  { id: 'endurance', label: 'Выносливость', icon: '🏃' },
  { id: 'flexibility', label: 'Гибкость', icon: '🧘' },
];

const LOCATIONS = [
  { id: 'home', label: 'Дом', icon: '🏠' },
  { id: 'gym', label: 'Зал', icon: '🏢' },
  { id: 'street', label: 'Улица', icon: '🌳' },
];

const OnboardingForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    difficulty: '',
    goal: '',
    location: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Обработчик выбора опции
  const handleSelect = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Сбрасываем ошибку при изменении
    if (error) setError('');
  };

  // Проверка валидности
  const isFormValid = () => {
    return formData.difficulty && formData.goal && formData.location;
  };

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Проверка валидации на клиенте
    if (!isFormValid()) {
      setError('Пожалуйста, выберите все параметры');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 2. Вызов API (GET /programs с параметрами фильтрации)
      // Ваш api.js настроен так, что matchProgram делает запрос к '/programs'
      const response = await matchProgram(formData);
      
      // 3. Логика обработки ответа от бэкенда
      // Ожидаем, что бэкенд вернет массив программ: [ {id: 1, ...}, {id: 2, ...} ]
      const programs = response.data || response; // axios обычно кладет данные в .data, но для надежности проверим оба варианта
      
      console.log('Matched programs:', programs);

      if (Array.isArray(programs) && programs.length > 0) {
        // Если программы найдены, берем первую из списка (самую подходящую)
        const selectedProgram = programs[0];
        const programId = selectedProgram.id;

        // (Опционально) Сохраняем выбор в localStorage, чтобы при возврате помнить программу
        localStorage.setItem('currentProgramId', programId);
        localStorage.setItem('currentProgramName', selectedProgram.name);

        // 4. Переход на экран трекера, передавая ID программы в URL
        navigate(`/tracker/${programId}`);
      } else {
        // Если массив пуст или бэкенд ничего не вернул
        setError('По вашим параметрам программ не найдено. Попробуйте изменить настройки.');
      }

    } catch (err) {
      console.error(err);
      // Проверяем, если ошибка от сервера (404, 500), выводим сообщение
      const errorMessage = err.response?.data?.detail || err.message || 'Не удалось подобрать программу. Попробуйте позже.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Компонент для рендеринга сетки опций
  const renderOptionGrid = (title, field, options) => (
    <div className="form-section">
      <h3 className="section-title">{title}</h3>
      <div className="options-grid">
        {options.map((option) => {
          const isSelected = formData[field] === option.id;
          return (
            <Card
              key={option.id}
              className={`option-card ${isSelected ? 'option-card-selected' : ''}`}
              onClick={() => handleSelect(field, option.id)}
            >
              <div className="option-icon">{option.icon}</div>
              <div className="option-label">{option.label}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="onboarding-container">
      <header className="onboarding-header">
        <h1>Создай свою программу</h1>
        <p>Ответьте на 3 вопроса, чтобы мы подобрали идеальный план</p>
      </header>

      <form onSubmit={handleSubmit}>
        {renderOptionGrid('Ваш уровень подготовки', 'difficulty', DIFFICULTIES)}
        {renderOptionGrid('Ваша цель', 'goal', GOALS)}
        {renderOptionGrid('Где будете тренироваться?', 'location', LOCATIONS)}

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <Button 
            type="submit" 
            fullWidth 
            isLoading={isLoading}
            disabled={!isFormValid() && !isLoading}
          >
            Подобрать программу
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OnboardingForm;