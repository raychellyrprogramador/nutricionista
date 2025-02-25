import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/Input';

interface UserForm {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  role: string;
  is_active: boolean;
}

export function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<UserForm>({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    role: 'user',
    is_active: true
  });

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          admin_users (
            role
          )
        `)
        .eq('id', id)
        .single();

      if (profileError) throw profileError;

      if (profile) {
        setForm({
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          city: profile.city || '',
          state: profile.state || '',
          role: profile.admin_users?.[0]?.role || 'user',
          is_active: profile.is_active
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          phone: form.phone,
          city: form.city,
          state: form.state,
          is_active: form.is_active
        })
        .eq('id', id);

      if (profileError) throw profileError;

      // Update role if changed
      if (form.role !== 'user') {
        const { error: roleError } = await supabase
          .from('admin_users')
          .upsert({
            id,
            role: form.role,
            permissions: {
              users: true,
              appointments: true,
              meal_plans: true,
              settings: true
            }
          });

        if (roleError) throw roleError;
      }

      setSuccess('Usuário atualizado com sucesso');
      setTimeout(() => navigate('/admin/users'), 2000);
    } catch (err: any) {
      setError(err.message);
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/users')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                Editar Usuário
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nome Completo"
                value={form.full_name}
                onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                disabled
              />
              <Input
                label="Telefone"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(00) 00000-0000"
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Papel no Sistema
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                  <option value="super_admin">Super Administrador</option>
                </select>
              </div>
              <Input
                label="Cidade"
                value={form.city}
                onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <select
                  value={form.state}
                  onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Selecione o estado</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Usuário Ativo
                </span>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 text-green-600 rounded-md text-sm">
                {success}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="animate-spin">⌛</span>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}