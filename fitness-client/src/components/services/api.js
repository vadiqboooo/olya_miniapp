import axios from 'axios';

// Получаем URL API из переменных окружения или используем значение по умолчанию
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_URL, // Адрес вашего FastAPI бэкенда
  headers: {
    'Content-Type': 'application/json',
  },
});

// Эндпоинт для подбора программы (предполагаемая логика бэкенда)
export const matchProgram = async (params) => {
  // Примечание: На бэкенде эндпоинт должен фильтровать программы по этим параметрам
  // и возвращать наиболее подходящую ID или сам объект программы.
  const response = await api.get('/programs', { params }); 
  // Для примера вернем первую найденную программу, удовлетворяющую условиям,
  // или список программ. В реальном приложении здесь должна быть сложная логика.
  return response.data;
};

export default api;