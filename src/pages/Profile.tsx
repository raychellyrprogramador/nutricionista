import React, { useState, useEffect } from 'react';
import { Camera, Edit2, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ProfileTabs } from '../components/ProfileTabs';
import { NutritionalMenu } from '../components/NutritionalMenu';
import { ProfileView } from '../components/ProfileView';
import { SettingsForm } from '../components/SettingsForm';
import { AppointmentScheduler } from '../components/AppointmentScheduler';
import { AdminDashboard } from '../components/AdminDashboard';
import type { ProfileForm } from '../types/profile';
import type { MealPlan } from '../types/meal-plan';

export function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    id: '',
    fullName: '',
    username: '',
    bio: '',
    city: '',
    state: '',
    birthDate: '',
    gender: '',
    email: '',
    phone: '',
    coverImage: null,
    avatarUrl: null
  });
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        // Check if user is admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        setIsAdmin(!!adminData && ['admin', 'super_admin'].includes(adminData?.role || ''));

        // Load profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // Create new profile if it doesn't exist
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                full_name: session.user.user_metadata.full_name || '',
                birth_date: new Date().toISOString(),
                phone: '',
                tutorial_shown: false,
                is_public: true,
                theme: 'light',
                notifications: {
                  email: true,
                  push: true
                }
              })
              .select()
              .single();

            if (createError) throw createError;
            if (newProfile) {
              setForm({
                id: newProfile.id,
                fullName: newProfile.full_name || '',
                username: newProfile.username || '',
                bio: newProfile.bio || '',
                city: newProfile.city || '',
                state: newProfile.state || '',
                birthDate: newProfile.birth_date || '',
                gender: newProfile.gender || '',
                email: session.user.email || '',
                phone: newProfile.phone || '',
                avatarUrl: newProfile.avatar_url,
                coverImage: newProfile.cover_image
              });
            }
          } else {
            throw profileError;
          }
        } else if (profile) {
          setForm({
            id: profile.id,
            fullName: profile.full_name || '',
            username: profile.username || '',
            bio: profile.bio || '',
            city: profile.city || '',
            state: profile.state || '',
            birthDate: profile.birth_date || '',
            gender: profile.gender || '',
            email: session.user.email || '',
            phone: profile.phone || '',
            avatarUrl: profile.avatar_url,
            coverImage: profile.cover_image
          });
        }

        // Load meal plans
        const { data: mealPlansData, error: mealPlansError } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('patient_profile_id', session.user.id)
          .order('received_at', { ascending: false });

        if (mealPlansError) throw mealPlansError;
        setMealPlans(mealPlansData || []);

      } catch (err: any) {
        console.error('Error loading profile:', err.message);
        setError(err.message);
      }
    };

    initializeProfile();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem deve ter menos de 2MB');
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Apenas imagens JPG e PNG são permitidas');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${type}-${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('profiles')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      const updateData = type === 'avatar' 
        ? { avatar_url: publicUrl }
        : { cover_image: publicUrl };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      setForm(prev => ({
        ...prev,
        [type === 'avatar' ? 'avatarUrl' : 'coverImage']: publicUrl
      }));

      setSuccess('Imagem atualizada com sucesso');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedProfile: ProfileForm) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updatedProfile.fullName,
          username: updatedProfile.username,
          bio: updatedProfile.bio,
          city: updatedProfile.city,
          state: updatedProfile.state,
          birth_date: updatedProfile.birthDate,
          gender: updatedProfile.gender,
          phone: updatedProfile.phone
        })
        .eq('id', updatedProfile.id);

      if (error) throw error;
      setForm(updatedProfile);
      setSuccess('Perfil atualizado com sucesso');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMealPlanView = async (mealPlan: MealPlan) => {
    try {
      if (!mealPlan.viewed_at) {
        await supabase
          .from('meal_plans')
          .update({ viewed_at: new Date().toISOString() })
          .eq('id', mealPlan.id);
      }
      window.open(mealPlan.file_url, '_blank');
    } catch (err: any) {
      console.error('Erro ao marcar cardápio como visto:', err.message);
    }
  };

  const handleShare = async (mealPlan: MealPlan) => {
    try {
      await navigator.share({
        title: mealPlan.title,
        text: `Meu cardápio nutricional: ${mealPlan.title}`,
        url: mealPlan.file_url
      });
    } catch (err) {
      navigator.clipboard.writeText(mealPlan.file_url);
      setSuccess('Link copiado para a área de transferência!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Header with logout button */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 border border-gray-300 rounded-md"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Imagem de Capa */}
      <div className="relative h-[200px] bg-gray-100">
        {form.coverImage ? (
          <img
            src={form.coverImage}
            alt="Capa"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <label className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-50">
          <Edit2 className="w-5 h-5 text-gray-600" />
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png"
            onChange={(e) => handleImageUpload(e, 'cover')}
          />
        </label>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProfileTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          isAdmin={isAdmin}
        />
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTab === 'profile' && <ProfileView profile={form} />}
          {activeTab === 'menu' && (
            <NutritionalMenu
              mealPlans={mealPlans}
              onViewMealPlan={handleMealPlanView}
              onShareMealPlan={handleShare}
            />
          )}
          {activeTab === 'appointments' && <AppointmentScheduler />}
          {activeTab === 'settings' && (
            <SettingsForm
              profile={form}
              onSave={handleSave}
              onImageUpload={handleImageUpload}
            />
          )}
          {activeTab === 'admin' && isAdmin && <AdminDashboard />}
        </div>
      </div>

      {/* Notificações */}
      {(error || success) && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
            error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          }`}
        >
          {error || success}
        </div>
      )}
    </div>
  );
}