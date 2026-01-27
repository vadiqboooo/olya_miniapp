// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TelegramAuthProvider } from './context/TelegramAuthContext';
import Layout from './components/layout/Layout';
import OnboardingForm from './components/onboarding/OnboardingForm';
import WorkoutTracker from './components/tracker/WorkoutTracker';
import WorkoutDetail from './components/workout/WorkoutDetail';
import AdminProgramCreate from './components/admin/AdminProgramCreate';
import AdminDaysManage from './components/admin/AdminDaysManage';
import AdminExercisesManage from './components/admin/AdminExercisesManage';
import AdminProgramList from './components/admin/AdminProgramList';

function App() {
  return (
    <Routes>
      {/* Админ роуты БЕЗ Telegram авторизации */}
      <Route path="/admin" element={<Layout />}>
        <Route path="programs" element={<AdminProgramList />} />
        <Route path="programs/create" element={<AdminProgramCreate />} />
        <Route path="programs/:programId/days" element={<AdminDaysManage />} />
        <Route path="programs/:programId/days/:workoutId/exercises" element={<AdminExercisesManage />} />
      </Route>

      {/* Основные роуты С Telegram авторизацией */}
      <Route path="/" element={
        <TelegramAuthProvider>
          <Layout />
        </TelegramAuthProvider>
      }>
        {/* Главная страница - будет автоматически редиректить */}
        <Route index element={<div>Loading...</div>} />

        {/* Onboarding - выбор программы */}
        <Route path="onboarding" element={<OnboardingForm />} />

        {/* Основной экран трекера */}
        <Route path="tracker/:programId" element={<WorkoutTracker />} />

        {/* Экран детальной тренировки */}
        <Route path="tracker/:programId/workout/:workoutId" element={<WorkoutDetail />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;