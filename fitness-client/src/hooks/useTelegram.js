import { useEffect, useState } from 'react';

/**
 * Хук для работы с Telegram WebApp API
 * Получает данные пользователя из Telegram
 */
export const useTelegram = () => {
  const [tg, setTg] = useState(null);
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Проверяем, что код выполняется в Telegram WebApp
    if (window.Telegram?.WebApp) {
      const telegram = window.Telegram.WebApp;

      // Инициализируем WebApp
      telegram.ready();
      telegram.expand();

      setTg(telegram);

      // Получаем данные пользователя
      const telegramUser = telegram.initDataUnsafe?.user;

      if (telegramUser) {
        setUser({
          id: telegramUser.id,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
          languageCode: telegramUser.language_code,
          isPremium: telegramUser.is_premium || false,
        });
      }

      setIsReady(true);
    } else {
      // Режим разработки - создаем фейкового пользователя
      console.warn('Telegram WebApp API not found. Using mock user for development.');
      setUser({
        id: 12345, // Фейковый ID для разработки
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        languageCode: 'ru',
        isPremium: false,
      });
      setIsReady(true);
    }
  }, []);

  return {
    tg,
    user,
    isReady,
    // Дополнительные методы
    showAlert: (message) => tg?.showAlert(message),
    showConfirm: (message) => tg?.showConfirm(message),
    close: () => tg?.close(),
    // Методы для работы с MainButton
    showMainButton: (text, onClick) => {
      if (tg) {
        tg.MainButton.text = text;
        tg.MainButton.show();
        tg.MainButton.onClick(onClick);
      }
    },
    hideMainButton: () => tg?.MainButton.hide(),
    // Методы для работы с BackButton
    showBackButton: (onClick) => {
      if (tg) {
        tg.BackButton.show();
        tg.BackButton.onClick(onClick);
      }
    },
    hideBackButton: () => tg?.BackButton.hide(),
  };
};

export default useTelegram;
