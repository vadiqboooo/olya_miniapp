// Общие константы для опций программ тренировок
// Используются в OnboardingForm, Admin панели и других компонентах

export const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Начальный' },
  { value: 'intermediate', label: 'Средний' },
  { value: 'advanced', label: 'Продвинутый' }
];

export const GOAL_OPTIONS = [
  { value: 'weight_loss', label: 'Похудение' },
  { value: 'muscle_gain', label: 'Набор массы' },
  { value: 'endurance', label: 'Выносливость' },
  { value: 'flexibility', label: 'Гибкость' }
];

export const LOCATION_OPTIONS = [
  { value: 'home', label: 'Дома' },
  { value: 'gym', label: 'Зал' },
  { value: 'street', label: 'Улица' }
];

// Функция для получения label по value
export const getOptionLabel = (options, value) => {
  const option = options.find(opt => opt.value === value);
  return option ? option.label : value;
};

// Функция для получения всех опций программы
export const getProgramOptions = () => ({
  difficulty: DIFFICULTY_OPTIONS,
  goal: GOAL_OPTIONS,
  location: LOCATION_OPTIONS
});
