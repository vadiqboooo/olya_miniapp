import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import api from '../components/services/api';
import Loader from '../components/ui/Loader';

const TelegramAuthContext = createContext(null);

export const useTelegramAuth = () => {
  const context = useContext(TelegramAuthContext);
  if (!context) {
    throw new Error('useTelegramAuth must be used within TelegramAuthProvider');
  }
  return context;
};

export const TelegramAuthProvider = ({ children }) => {
  const { user: telegramUser, isReady } = useTelegram();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isReady || !telegramUser) return;

    const initUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Проверяем существует ли пользователь
        let user = null;
        try {
          const response = await api.get(`/users/${telegramUser.id}`);
          user = response.data;
          console.log('Existing user found:', user);
        } catch (err) {
          if (err.response?.status === 404) {
            // Пользователь не найден - создаем нового
            console.log('User not found, creating new user...');
            const createResponse = await api.post('/users', {
              telegram_id: String(telegramUser.id),
            });
            user = createResponse.data;
            console.log('New user created:', user);
          } else {
            throw err;
          }
        }

        setCurrentUser(user);

        // 2. Проверяем есть ли у пользователя активная программа
        const progressResponse = await api.get(`/users/${user.id}/progress`);
        const userProgress = progressResponse.data;

        console.log('User progress:', userProgress);

        // Если есть программы в прогрессе
        if (userProgress && userProgress.length > 0) {
          // Берем первую активную программу (можно выбрать последнюю или по другой логике)
          const activeProgram = userProgress[0];

          // Проверяем, не находимся ли мы уже на нужном роуте
          const targetPath = `/tracker/${activeProgram.program_id}`;
          if (location.pathname !== targetPath && location.pathname === '/') {
            console.log('Redirecting to active program:', activeProgram.program_id);
            navigate(targetPath, { replace: true });
          }
        } else {
          // Нет активных программ - перенаправляем на onboarding
          if (location.pathname === '/') {
            console.log('No active program, redirecting to onboarding');
            navigate('/onboarding', { replace: true });
          }
        }
      } catch (err) {
        console.error('Error initializing user:', err);
        setError(err.message || 'Failed to initialize user');
      } finally {
        setIsLoading(false);
      }
    };

    initUser();
  }, [isReady, telegramUser, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2>Ошибка инициализации</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <TelegramAuthContext.Provider value={{ currentUser, telegramUser, setCurrentUser }}>
      {children}
    </TelegramAuthContext.Provider>
  );
};
