import React from 'react';
import { Calendar, AlertCircle, Share2, Download } from 'lucide-react';
import type { MealPlan } from '../types/meal-plan';

interface NutritionalMenuProps {
  mealPlans: MealPlan[];
  onViewMealPlan: (mealPlan: MealPlan) => void;
  onShareMealPlan: (mealPlan: MealPlan) => void;
}

export function NutritionalMenu({ mealPlans, onViewMealPlan, onShareMealPlan }: NutritionalMenuProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Cardápio Nutricional</h2>
      
      {mealPlans.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum cardápio disponível no momento</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mealPlans.map((mealPlan) => (
              <div
                key={mealPlan.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{mealPlan.title}</h3>
                    <p className="text-sm text-gray-600">
                      Nutricionista: {mealPlan.nutritionist_name}
                    </p>
                  </div>
                  {!mealPlan.viewed_at && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Novo
                    </span>
                  )}
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(mealPlan.received_at)}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onViewMealPlan(mealPlan)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Visualizar
                  </button>
                  <button
                    onClick={() => onShareMealPlan(mealPlan)}
                    className="p-2 text-gray-600 hover:text-gray-800 rounded-md border"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">
                  Restrições Alimentares
                </h4>
                <p className="text-sm text-yellow-700">
                  Lembre-se de sempre informar seu nutricionista sobre quaisquer alergias
                  ou restrições alimentares para garantir um cardápio adequado às suas necessidades.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}