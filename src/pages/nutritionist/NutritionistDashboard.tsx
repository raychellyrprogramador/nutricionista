import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Patient {
  id: string;
  full_name: string;
  email: string;
  last_visit: string;
  next_appointment: string;
}

interface MealPlan {
  id: string;
  patient_id: string;
  title: string;
  created_at: string;
  status: 'draft' | 'published';
}

export function NutritionistDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Load patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('profiles')
        .select('id, full_name, email, last_visit, next_appointment')
        .eq('nutritionist_id', user.id)
        .order('next_appointment', { ascending: true });

      if (patientsError) throw patientsError;
      setPatients(patientsData || []);

      // Load meal plans
      const { data: mealPlansData, error: mealPlansError } = await supabase
        .from('meal_plans')
        .select('id, patient_id, title, created_at, status')
        .eq('nutritionist_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (mealPlansError) throw mealPlansError;
      setMealPlans(mealPlansData || []);

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const createNewMealPlan = () => {
    navigate('/meal-plans/new');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Nutritionist Dashboard</h1>
        <button
          onClick={createNewMealPlan}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          Create New Meal Plan
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
          {patients.length > 0 ? (
            <div className="space-y-4">
              {patients.map(patient => (
                <div key={patient.id} className="border-b pb-3">
                  <div className="font-medium">{patient.full_name}</div>
                  <div className="text-sm text-gray-600">
                    Next appointment: {new Date(patient.next_appointment).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No upcoming appointments</p>
          )}
        </div>

        {/* Recent Meal Plans */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Meal Plans</h2>
          {mealPlans.length > 0 ? (
            <div className="space-y-4">
              {mealPlans.map(plan => (
                <div key={plan.id} className="border-b pb-3">
                  <div className="font-medium">{plan.title}</div>
                  <div className="text-sm text-gray-600">
                    Created: {new Date(plan.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      plan.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {plan.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recent meal plans</p>
          )}
        </div>
      </div>
    </div>
  );
}
