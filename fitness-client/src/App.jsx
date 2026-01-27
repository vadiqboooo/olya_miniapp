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
    <TelegramAuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Главная страница - будет автоматически редиректить */}
          <Route index element={<div>Loading...</div>} />

          {/* Onboarding - выбор программы */}
          <Route path="onboarding" element={<OnboardingForm />} />

          {/* Основной экран трекера */}
          <Route path="tracker/:programId" element={<WorkoutTracker />} />

          {/* Экран детальной тренировки */}
          <Route path="tracker/:programId/workout/:workoutId" element={<WorkoutDetail />} />

          {/* Админ панель */}
          <Route path="admin/programs" element={<AdminProgramList />} />
          <Route path="admin/programs/create" element={<AdminProgramCreate />} />
          <Route path="admin/programs/:programId/days" element={<AdminDaysManage />} />
          <Route path="admin/programs/:programId/days/:workoutId/exercises" element={<AdminExercisesManage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </TelegramAuthProvider>
  );
}

export default App;