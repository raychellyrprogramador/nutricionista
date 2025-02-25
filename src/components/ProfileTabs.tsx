import React from 'react';
import { LayoutDashboard, Utensils, User, Settings, Calendar, Shield } from 'lucide-react';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin?: boolean;
}

export function ProfileTabs({ activeTab, onTabChange, isAdmin = false }: ProfileTabsProps) {
  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'menu', label: 'Cardápio', icon: Utensils },
    { id: 'appointments', label: 'Agendamento', icon: Calendar },
    { id: 'settings', label: 'Configurações', icon: Settings },
    ...(isAdmin ? [{ id: 'admin', label: 'Administrador', icon: Shield }] : []),
  ];

  return (
    <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm mb-6 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}