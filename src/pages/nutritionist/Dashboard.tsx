import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Calendar, Bell, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Patient, MealPlan } from '../../types/meal-plan';

export function NutritionistDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [recentMealPlans, setRecentMealPlans] = useState<MealPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Carregar pacientes
      const { data: patientsData } = await supabase
        .from('patients')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('nutritionist_id', user.id)
        .order('created_at', { ascending: false });

      if (patientsData) {
        setPatients(patientsData);
      }

      // Carregar cardápios recentes
      const { data: mealPlansData } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('nutritionist_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (mealPlansData) {
        setRecentMealPlans(mealPlansData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard Nutricional</h1>
            <button
              onClick={() => navigate('/nutritionist/meal-plans/new')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Cardápio
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Card de Pacientes */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Pacientes</h2>
                <p className="text-gray-600">{patients.length} total</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/nutritionist/patients')}
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              Ver todos →
            </button>
          </div>

          {/* Card de Cardápios */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Cardápios Ativos</h2>
                <p className="text-gray-600">{recentMealPlans.length} ativos</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/nutritionist/meal-plans')}
              className="text-green-600 text-sm font-medium hover:text-green-700"
            >
              Gerenciar →
            </button>
          </div>

          {/* Card de Notificações */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Bell className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notificações</h2>
                <p className="text-gray-600">3 não lidas</p>
              </div>
            </div>
            <button className="text-yellow-600 text-sm font-medium hover:text-yellow-700">
              Ver todas →
            </button>
          </div>
        </div>

        {/* Lista de Pacientes */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Pacientes Recentes</h2>
            <div className="mt-4 relative">
              <input
                type="text"
                placeholder="Buscar pacientes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Carregando...</div>
            ) : filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <div key={patient.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{patient.name}</h3>
                    <p className="text-sm text-gray-500">{patient.email}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/nutritionist/patients/${patient.id}`)}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Ver detalhes →
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                Nenhum paciente encontrado
              </div>
            )}
          </div>
        </div>

        {/* Cardápios Recentes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Cardápios Recentes</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Carregando...</div>
            ) : recentMealPlans.length > 0 ? (
              recentMealPlans.map((mealPlan) => (
                <div key={mealPlan.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{mealPlan.title}</h3>
                    <p className="text-sm text-gray-500">
                      Criado em {new Date(mealPlan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/nutritionist/meal-plans/${mealPlan.id}`)}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Editar →
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                Nenhum cardápio encontrado
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}