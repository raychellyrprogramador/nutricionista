import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Camera, Save, Share2, Clock, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/Input';
import type { MealPlan, Meal, FoodItem } from '../../types/meal-plan';

export function MealPlanEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan>({
    id: '',
    title: '',
    patientId: '',
    nutritionistId: '',
    startDate: '',
    endDate: '',
    meals: [],
    restrictions: [],
    allergies: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  useEffect(() => {
    if (id) {
      loadMealPlan();
    }
  }, [id]);

  const loadMealPlan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setMealPlan(data);
      }
    } catch (error) {
      console.error('Erro ao carregar cardápio:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNutrients = (meals: Meal[]) => {
    let totalCals = 0, totalProt = 0, totalCarbs = 0, totalFats = 0;

    meals.forEach(meal => {
      meal.foods.forEach(food => {
        totalCals += food.calories;
        totalProt += food.protein;
        totalCarbs += food.carbs;
        totalFats += food.fats;
      });
    });

    return { totalCals, totalProt, totalCarbs, totalFats };
  };

  const handleAddMeal = () => {
    const newMeal: Meal = {
      id: crypto.randomUUID(),
      time: '',
      name: '',
      foods: [],
    };

    setMealPlan(prev => ({
      ...prev,
      meals: [...prev.meals, newMeal],
    }));
  };

  const handleAddFood = (mealId: string) => {
    const newFood: FoodItem = {
      id: crypto.randomUUID(),
      name: '',
      portion: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    };

    setMealPlan(prev => ({
      ...prev,
      meals: prev.meals.map(meal => 
        meal.id === mealId
          ? { ...meal, foods: [...meal.foods, newFood] }
          : meal
      ),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const nutrients = calculateNutrients(mealPlan.meals);
      const updatedMealPlan = {
        ...mealPlan,
        nutritionistId: user.id,
        totalCalories: nutrients.totalCals,
        totalProtein: nutrients.totalProt,
        totalCarbs: nutrients.totalCarbs,
        totalFats: nutrients.totalFats,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('meal_plans')
        .upsert(updatedMealPlan);

      if (error) throw error;
      navigate('/nutritionist/meal-plans');
    } catch (error) {
      console.error('Erro ao salvar cardápio:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              {id ? 'Editar Cardápio' : 'Novo Cardápio'}
            </h1>
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                <Share2 className="w-5 h-5" />
                Compartilhar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Título do Cardápio"
                value={mealPlan.title}
                onChange={(e) => setMealPlan(prev => ({ ...prev, title: e.target.value }))}
                required
              />
              <Input
                label="Paciente"
                type="select"
                value={mealPlan.patientId}
                onChange={(e) => setMealPlan(prev => ({ ...prev, patientId: e.target.value }))}
                required
              />
              <Input
                label="Data de Início"
                type="date"
                value={mealPlan.startDate}
                onChange={(e) => setMealPlan(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
              <Input
                label="Data de Término"
                type="date"
                value={mealPlan.endDate}
                onChange={(e) => setMealPlan(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
          </div>
        </div>

        {/* Refeições */}
        <div className="space-y-6">
          {mealPlan.meals.map((meal, index) => (
            <div key={meal.id} className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Refeição {index + 1}
                  </h3>
                  <button
                    onClick={() => setMealPlan(prev => ({
                      ...prev,
                      meals: prev.meals.filter(m => m.id !== meal.id)
                    }))}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome da Refeição"
                    value={meal.name}
                    onChange={(e) => setMealPlan(prev => ({
                      ...prev,
                      meals: prev.meals.map(m => 
                        m.id === meal.id ? { ...m, name: e.target.value } : m
                      )
                    }))}
                  />
                  <Input
                    label="Horário"
                    type="time"
                    value={meal.time}
                    onChange={(e) => setMealPlan(prev => ({
                      ...prev,
                      meals: prev.meals.map(m => 
                        m.id === meal.id ? { ...m, time: e.target.value } : m
                      )
                    }))}
                  />
                </div>
              </div>

              {/* Alimentos */}
              <div className="p-6">
                <div className="space-y-4">
                  {meal.foods.map((food, foodIndex) => (
                    <div key={food.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                      <div className="md:col-span-2">
                        <Input
                          label="Alimento"
                          value={food.name}
                          onChange={(e) => setMealPlan(prev => ({
                            ...prev,
                            meals: prev.meals.map(m => 
                              m.id === meal.id ? {
                                ...m,
                                foods: m.foods.map(f =>
                                  f.id === food.id ? { ...f, name: e.target.value } : f
                                )
                              } : m
                            )
                          }))}
                        />
                      </div>
                      <div>
                        <Input
                          label="Porção"
                          value={food.portion}
                          onChange={(e) => setMealPlan(prev => ({
                            ...prev,
                            meals: prev.meals.map(m => 
                              m.id === meal.id ? {
                                ...m,
                                foods: m.foods.map(f =>
                                  f.id === food.id ? { ...f, portion: e.target.value } : f
                                )
                              } : m
                            )
                          }))}
                        />
                      </div>
                      <div>
                        <Input
                          label="Calorias"
                          type="number"
                          value={food.calories}
                          onChange={(e) => setMealPlan(prev => ({
                            ...prev,
                            meals: prev.meals.map(m => 
                              m.id === meal.id ? {
                                ...m,
                                foods: m.foods.map(f =>
                                  f.id === food.id ? { ...f, calories: Number(e.target.value) } : f
                                )
                              } : m
                            )
                          }))}
                        />
                      </div>
                      <div>
                        <Input
                          label="Proteínas (g)"
                          type="number"
                          value={food.protein}
                          onChange={(e) => setMealPlan(prev => ({
                            ...prev,
                            meals: prev.meals.map(m => 
                              m.id === meal.id ? {
                                ...m,
                                foods: m.foods.map(f =>
                                  f.id === food.id ? { ...f, protein: Number(e.target.value) } : f
                                )
                              } : m
                            )
                          }))}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setMealPlan(prev => ({
                            ...prev,
                            meals: prev.meals.map(m => 
                              m.id === meal.id ? {
                                ...m,
                                foods: m.foods.filter(f => f.id !== food.id)
                              } : m
                            )
                          }))}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleAddFood(meal.id)}
                  className="mt-4 text-green-600 hover:text-green-700 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Alimento
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddMeal}
          className="mt-6 bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Adicionar Refeição
        </button>
      </main>
    </div>
  );
}