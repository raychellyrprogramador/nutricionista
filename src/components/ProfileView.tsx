import React from 'react';
import { Mail, Phone, MapPin, Calendar } from 'lucide-react';
import type { ProfileForm } from '../types/profile';

interface ProfileViewProps {
  profile: ProfileForm;
}

export function ProfileView({ profile }: ProfileViewProps) {
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatPhone = (phone: string) => {
    if (!phone) return 'Não informado';
    
    // Remove todos os caracteres não numéricos
    const numbers = phone.replace(/\D/g, '');
    
    // Formata o número conforme o padrão brasileiro
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="relative h-48 bg-gradient-to-r from-green-400 to-green-600">
        <div className="absolute -bottom-16 left-8">
          <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-3xl font-semibold text-gray-400">
                  {profile.fullName.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-20 px-8 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
          {profile.username && <p className="text-gray-500">@{profile.username}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center text-gray-600">
              <Mail className="w-5 h-5 mr-2" />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Phone className="w-5 h-5 mr-2" />
              <span>{formatPhone(profile.phone)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center text-gray-600">
              <MapPin className="w-5 h-5 mr-2" />
              <span>
                {profile.city && profile.state 
                  ? `${profile.city}, ${profile.state}`
                  : 'Não informado'}
              </span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-2" />
              <span>{profile.birthDate ? `${calculateAge(profile.birthDate)} anos` : 'Não informado'}</span>
            </div>
          </div>
        </div>

        {profile.bio && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">{profile.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
}