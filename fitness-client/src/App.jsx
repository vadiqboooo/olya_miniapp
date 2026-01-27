// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import OnboardingForm from './components/onboarding/OnboardingForm';
import WorkoutTracker from './components/tracker/WorkoutTracker';
import WorkoutDetail from './components/workout/WorkoutDetail'; // <--- Импортируем новый компонент
import AdminProgramCreate from './components/admin/AdminProgramCreate';
import AdminDaysManage from './components/admin/AdminDaysManage';
import AdminExercisesManage from './components/admin/AdminExercisesManage';
import AdminProgramList from './components/admin/AdminProgramList';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<OnboardingForm />} />
        
        {/* Основной экран трекера */}
        <Route path="tracker/:programId"element={<WorkoutTracker key={location.pathname} />}/>
        
        {/* Экран детальной тренировки. 
            Важно: workoutId должен передаваться как параметр */}
        <Route path="tracker/:programId/workout/:workoutId" element={<WorkoutDetail  />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="admin/programs" element={<AdminProgramList />} />
        <Route path="admin/programs/create" element={<AdminProgramCreate />} />
        <Route path="admin/programs/:programId/days" element={<AdminDaysManage />} />
        <Route path="admin/programs/:programId/days/:workoutId/exercises" element={<AdminExercisesManage />} />
        
      </Route>
    </Routes>
  );
}

export default App;