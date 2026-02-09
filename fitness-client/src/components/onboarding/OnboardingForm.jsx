import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegramAuth } from '../../context/TelegramAuthContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { matchProgram } from '../services/api';
import api from '../services/api';
import './OnboardingForm.css';

// Константы для выбора
const GENDERS = [
  { id: 'male', label: 'Мужской', icon: '👨' },
  { id: 'female', label: 'Женский', icon: '👩' },
];

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

const HEALTH_RESTRICTIONS = [
  { id: 'none', label: 'Нет ограничений', icon: '✅' },
  { id: 'knees', label: 'Проблемы с коленями', icon: '🦵' },
  { id: 'back', label: 'Проблемы со спиной', icon: '🔙' },
  { id: 'shoulders', label: 'Проблемы с плечами', icon: '💪' },
  { id: 'cardiovascular', label: 'Сердечно-сосудистые', icon: '❤️' },
  { id: 'pregnancy', label: 'Беременность/Послеродовой', icon: '🤰' },
  { id: 'other', label: 'Другое', icon: '⚕️' },
];

const PROGRAM_PREFERENCES = [
  { id: 'circuit', label: 'Круговые', icon: '🔄', description: 'Все группы мышц за тренировку' },
  { id: 'split', label: 'Сплиты', icon: '📊', description: 'Каждая группа мышц отдельно' },
  { id: 'no_preference', label: 'Без предпочтений', icon: '🤷' },
];

const OnboardingForm = () => {
  const navigate = useNavigate();
  const { currentUser } = useTelegramAuth();

  // Восстанавливаем ранее выбранные параметры из localStorage
  const getSavedFormData = () => {
    try {
      const saved = localStorage.getItem('onboardingFormData');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.warn('Failed to parse saved form data:', err);
    }
    return {
      gender: '',
      difficulty: '',
      goal: '',
      location: '',
      health_restriction: '',
      program_preference: '',
    };
  };

  const [formData, setFormData] = useState(getSavedFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Проверяем, были ли восстановлены ранее выбранные параметры
  const [hasRestoredData, setHasRestoredData] = useState(() => {
    const saved = localStorage.getItem('onboardingFormData');
    return !!saved;
  });

  // Обработчик выбора опции
  const handleSelect = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Сбрасываем ошибку при изменении
    if (error) setError('');
  };

  // Очистка выбора
  const handleClearSelection = () => {
    setFormData({
      gender: '',
      difficulty: '',
      goal: '',
      location: '',
      health_restriction: '',
      program_preference: '',
    });
    localStorage.removeItem('onboardingFormData');
    setError('');
    setHasRestoredData(false);
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

    // Сохраняем выбранные параметры в localStorage
    localStorage.setItem('onboardingFormData', JSON.stringify(formData));

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

        // Создаем запись прогресса для пользователя
        if (currentUser) {
          try {
            // Создаем пустую запись прогресса для выбранной программы
            await api.post('/progress', {
              user_id: currentUser.id,
              program_id: programId,
              workout_id: selectedProgram.workouts?.[0]?.id || 1, // Первая тренировка или дефолтная
              is_completed: false
            });
            console.log('Progress record created for user:', currentUser.id);
          } catch (progressErr) {
            // Игнорируем ошибку если запись уже существует
            console.warn('Could not create progress record:', progressErr);
          }
        }

        // Сохраняем выбор в localStorage
        localStorage.setItem('currentProgramId', programId);
        localStorage.setItem('currentProgramName', selectedProgram.name);

        // Переход на экран трекера
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
              {option.description && (
                <div className="option-description">{option.description}</div>
              )}
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
        <p>Ответьте на вопросы, чтобы мы подобрали идеальный план</p>
      </header>

      {hasRestoredData && isFormValid() && (
        <div className="info-message">
          Ваши предыдущие параметры восстановлены. Вы можете изменить их или подобрать новую программу.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-section-group">
          <h2 className="group-title">Основная информация</h2>
          {renderOptionGrid('Ваш пол (необязательно)', 'gender', GENDERS)}
          {renderOptionGrid('Ваш уровень подготовки', 'difficulty', DIFFICULTIES)}
          {renderOptionGrid('Ваша цель', 'goal', GOALS)}
          {renderOptionGrid('Где будете тренироваться?', 'location', LOCATIONS)}
        </div>

        <div className="form-section-group">
          <h2 className="group-title">Дополнительная информация (необязательно)</h2>
          {renderOptionGrid('Ограничения по здоровью', 'health_restriction', HEALTH_RESTRICTIONS)}
          {renderOptionGrid('Предпочтения в программе', 'program_preference', PROGRAM_PREFERENCES)}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          {isFormValid() && (
            <button
              type="button"
              className="clear-selection-btn"
              onClick={handleClearSelection}
              disabled={isLoading}
            >
              Очистить выбор
            </button>
          )}
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