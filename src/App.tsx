import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { ProfileCustomize } from './pages/ProfileCustomize';
import { Profile } from './pages/Profile';
import { MealPlanEditor } from './pages/nutritionist/MealPlanEditor';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { NutritionistDashboard } from './pages/nutritionist/NutritionistDashboard';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={session ? <Navigate to="/profile" replace /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={session ? <Navigate to="/profile" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={session ? <Navigate to="/profile" replace /> : <Register />}
        />
        <Route
          path="/reset-password"
          element={session ? <Navigate to="/profile" replace /> : <ResetPassword />}
        />

        {/* Protected routes */}
        <Route
          path="/profile/customize"
          element={session ? <ProfileCustomize /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/profile"
          element={session ? <Profile /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/*"
          element={session ? <AdminDashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/dashboard"
          element={session ? <AdminDashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/nutritionist/*"
          element={session ? <NutritionistDashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/nutritionist/dashboard"
          element={session ? <NutritionistDashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/meal-plans/new"
          element={session ? <MealPlanEditor /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/meal-plans/:id"
          element={session ? <MealPlanEditor /> : <Navigate to="/login" replace />}
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;